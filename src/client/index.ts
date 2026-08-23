/**
 * Archived-sessions panel, browser half: an 已归档 trigger anchored to the
 * left rail via the frame-wide shell.overlay slot. Clicking it opens a
 * dropdown listing every archived session (title / workspace / relative
 * time); clicking a row opens that session; a trailing button unarchives it.
 *
 * Reads ride the shell.overlay standard hooks (`useSessions`,
 * `useWorkspaces`); opening uses `ctx.sessions.open`. All styling is inline
 * so the bundle carries no CSS-module dependency.
 *
 * The unarchive action calls `ctx.workspaces.unarchiveSession(id)` when that
 * service method exists. On a stock DSH host that method is absent (it comes
 * from the optional official-source patch in ./patches), so the button is
 * hidden rather than throwing — the panel degrades to view + open.
 */

import * as React from 'react'
import type { ClientContext, SessionId, SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-layout SlotMap merge (the shell.overlay seat).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the workspace list state shape.
import type { WorkspaceListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'

/** Required services: session-open routing and workspace archive-set mutation. */
export const inject = ['sessions', 'workspaces']

function relTime(ts: number): string {
  const d = Date.now() - ts
  if (d < 60000) return '刚刚'
  const m = Math.floor(d / 60000)
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

function workspaceTitleOf(workspaces: WorkspaceListState | undefined, sessionId: string): string {
  const items = workspaces?.items ?? []
  for (const w of items) {
    if (w.sessionIds.includes(sessionId as SessionId)) return w.title ?? '未分组'
  }
  return '未分组'
}

interface ArchivedPanelProps {
  useSessions: SnapshotSelectorHook<SessionListState>
  useWorkspaces: SnapshotSelectorHook<WorkspaceListState>
}

interface ArchivedSessionRow {
  id: string
  title: string
  updatedAt: number
}

/** Render one archived-session row; clicking the body opens it, the trailing button unarchives it. */
function ArchivedRow(props: {
  id: string
  title: string
  meta: string
  canUnarchive: boolean
  onOpen: (id: string) => void
  onUnarchive: (id: string) => void
}) {
  const unarchiveButton = props.canUnarchive
    ? React.createElement('button', {
      type: 'button',
      onClick: () => props.onUnarchive(props.id),
      title: '取消归档',
      'aria-label': '取消归档',
      style: {
        flex: '0 0 auto', padding: '4px 7px', border: '0', borderRadius: '6px', cursor: 'pointer',
        background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-secondary)',
        fontFamily: 'inherit', fontSize: '11px', whiteSpace: 'nowrap',
      },
    }, '取消归档')
    : null
  return React.createElement('div', {
    key: props.id,
    style: { display: 'flex', alignItems: 'center', gap: '6px', width: '100%' },
  },
    React.createElement('button', {
      type: 'button',
      onClick: () => props.onOpen(props.id),
      title: props.title,
      style: {
        display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 auto', minWidth: '0',
        padding: '8px 10px', border: '0', borderRadius: '8px', background: 'transparent',
        cursor: 'pointer', textAlign: 'left',
      },
    },
      React.createElement('span', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, props.title),
      React.createElement('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, props.meta),
    ),
    unarchiveButton,
  )
}

/** The left-rail trigger plus its dropdown, hosted on the overlay slot. */
function ArchivedPanel(props: ArchivedPanelProps & { open: (id: string) => void; onUnarchive: (id: string) => void; canUnarchive: boolean }) {
  const [openList, setOpenList] = React.useState(false)
  // Panel width tracks the rendered sidebar column (default 280px, min 264,
  // max 420). The sidebar slot anchor is a `display:contents` wrapper (width
  // 0), so measure its PARENT — the layout column that carries the grid width
  // — and keep it in sync with user drags via a ResizeObserver.
  const [sidebarWidth, setSidebarWidth] = React.useState(280)
  React.useEffect(() => {
    const anchor = document.querySelector('[data-slot="sidebar"]')
    const column = anchor?.parentElement ?? null
    if (column === null) return
    const update = () => {
      const w = column.getBoundingClientRect().width
      if (w > 0) setSidebarWidth(w)
    }
    update()
    const observer = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(update) : undefined
    observer?.observe(column)
    return () => { observer?.disconnect() }
  }, [])

  let rows: ArchivedSessionRow[] = []
  let workspaces: WorkspaceListState | undefined
  try {
    workspaces = props.useWorkspaces((s: WorkspaceListState) => s)
    const list = props.useSessions((s: SessionListState) => s)
    const archivedIds = workspaces.archivedSessionIds ?? []
    const byId = list.byId ?? {}
    rows = archivedIds
      .map(id => byId[id])
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
      .map(s => ({ id: s.id, title: s.displayTitle ?? String(s.id), updatedAt: s.updatedAt ?? 0 }))
  } catch (e) {
    console.error('archived data:', e)
  }

  const openSession = (id: string) => { props.open(id); setOpenList(false) }

  const trigger = React.createElement('button', {
    type: 'button',
    'data-archived-mounted': '1',
    onClick: () => setOpenList((v: boolean) => !v),
    'aria-expanded': openList,
    title: `已归档会话 ${String(rows.length)}`,
    style: {
      position: 'fixed', left: '10px', bottom: '112px', zIndex: 1300,
      height: '38px', padding: '0 12px', boxSizing: 'border-box',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      border: '1px solid var(--dsw-alias-border-l1)', cursor: 'pointer',
      background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-secondary)',
      fontFamily: 'inherit', fontSize: '12px', borderRadius: '8px', whiteSpace: 'nowrap',
    },
  },
    React.createElement('span', { style: { fontSize: '14px', lineHeight: '1' } }, '🗂'),
    React.createElement('span', { style: { lineHeight: '1' } }, '已归档'),
    React.createElement('span', { style: { fontSize: '11px', opacity: '.7' } }, String(rows.length)),
  )

  if (!openList) return React.createElement(React.Fragment, null, trigger)

  const body: import('react').ReactNode[] = []
  if (rows.length === 0) {
    body.push(React.createElement('div', { style: { padding: '18px 12px', textAlign: 'center', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' } }, '暂无归档会话'))
  } else {
    for (const s of rows) {
      const meta = `${workspaceTitleOf(workspaces, s.id)} · ${relTime(s.updatedAt)}`
      body.push(React.createElement(ArchivedRow, { id: s.id, title: s.title, meta, canUnarchive: props.canUnarchive, onOpen: openSession, onUnarchive: props.onUnarchive }))
    }
  }

  return React.createElement(React.Fragment, null, trigger,
    React.createElement('div', {
      onClick: () => setOpenList(false),
      style: { position: 'fixed', inset: '0', zIndex: 1250, background: 'rgba(0,0,0,.35)' },
    },
      React.createElement('div', {
        onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation() },
        style: {
          position: 'fixed', left: '10px', bottom: '158px',
          width: `${Math.min(Math.max(sidebarWidth - 20, 240), 420)}px`, maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'min(64vh, 560px)', overflow: 'auto',
          background: 'var(--dsw-alias-bg-overlay)', border: '1px solid var(--dsw-alias-border-l1)',
          borderRadius: '12px', boxShadow: '0 10px 34px rgba(0,0,0,.22)', zIndex: 1310,
        },
      },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--dsw-alias-border-l1)', color: 'var(--dsw-alias-label-primary)', fontWeight: '600', fontSize: '14px' } },
          React.createElement('span', null, '已归档会话'),
          React.createElement('button', { type: 'button', onClick: () => setOpenList(false), 'aria-label': '关闭', style: { border: '0', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', fontSize: '18px', lineHeight: '1', cursor: 'pointer', padding: '0 5px', borderRadius: '6px' } }, '×'),
        ),
        React.createElement('div', { style: { padding: '6px' } }, body),
      ),
    ),
  )
}

/**
 * Client plugin body: register the archived panel against the frame-wide
 * overlay once its declarer is up.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.inject(['slots', 'workspaces'], (scope: ClientContext) => {
    const sessions = scope.sessions
    const workspaces = scope.workspaces
    // Feature-detect the patch-provided unarchive capability: on a stock DSH
    // host the method is absent, so we hide the button instead of throwing.
    const canUnarchive = typeof (workspaces as { unarchiveSession?: unknown }).unarchiveSession === 'function'
    scope.slots.inject('shell.overlay', () => scope.slots.register({
      name: 'shell.overlay',
      id: 'dsh-archived',
      order: 0,
      label: '已归档',
    }, (props: ArchivedPanelProps) => {
      const open = (id: string) => { sessions.open(id as SessionId) }
      const unarchive = (id: string) => {
        const target = workspaces as { unarchiveSession?: (id: SessionId) => Promise<void> }
        if (typeof target.unarchiveSession === 'function') void target.unarchiveSession(id as SessionId)
      }
      return React.createElement(ArchivedPanel, { ...props, open, onUnarchive: unarchive, canUnarchive })
    }))
  })
}
