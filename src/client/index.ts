/** Searchable archived-session browser shared by both plugin distributions. */
import * as React from 'react'
import type { ClientContext, SessionId, SessionListState, WorkspaceListState } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'

export const inject = ['sessions', 'workspaces']

interface ArchivedPanelProps {
  useSessions: SnapshotSelectorHook<SessionListState>
  useWorkspaces: SnapshotSelectorHook<WorkspaceListState>
  open: (id: string) => void
  unarchive?: (id: string) => Promise<void>
  remove?: (id: string) => Promise<void>
}

const h = React.createElement
const button: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid var(--dsw-alias-border-l1, #ddd)',
  borderRadius: 8, background: 'var(--dsw-alias-bg-layer-1, white)',
  color: 'var(--dsw-alias-label-primary, #222)', font: 'inherit', cursor: 'pointer',
}
const secondary: React.CSSProperties = { color: 'var(--dsw-alias-label-secondary, #666)', fontSize: 12 }
const modal: React.CSSProperties = {
  width: 'min(680px, calc(100vw - 32px))', maxHeight: '80vh', boxSizing: 'border-box',
  padding: 20, border: '1px solid var(--dsw-alias-border-l1, #ddd)', borderRadius: 14,
  background: 'var(--dsw-alias-bg-overlay, white)', color: 'var(--dsw-alias-label-primary, #222)',
  boxShadow: '0 20px 60px #0004', font: '14px/1.5 system-ui',
}

function relativeTime(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '时间未知'
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`
  return `${Math.floor(minutes / 1440)} 天前`
}

/** Native modal supplies focus trapping, Escape handling and focus restoration. */
function Dialog(props: { title: string; close: () => void; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDialogElement>(null)
  const titleId = React.useId()
  React.useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return h('dialog', {
    ref, 'aria-labelledby': titleId, style: modal,
    onCancel: (event: React.SyntheticEvent) => { event.preventDefault(); props.close() },
    onClick: (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) props.close()
    },
  },
  h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 } },
    h('h2', { id: titleId, style: { margin: 0, fontSize: 18 } }, props.title),
    h('button', { type: 'button', style: button, onClick: props.close, 'aria-label': `关闭${props.title}` }, '×')),
  props.children)
}

/** Archived IDs remain visible even while their session metadata is unavailable. */
export function ArchivedPanel(props: ArchivedPanelProps) {
  const [visible, setVisible] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [workspace, setWorkspace] = React.useState('')
  const [oldest, setOldest] = React.useState(false)
  const [error, setError] = React.useState('')
  const [pending, setPending] = React.useState<string | null>(null)
  const pendingRef = React.useRef(false)
  const [confirmation, setConfirmation] = React.useState<{ id: string; title: string } | null>(null)
  const workspaces = props.useWorkspaces(s => s)
  const sessions = props.useSessions(s => s)
  const workspaceBySession = new Map<string, { id: string; title: string }>()
  for (const item of workspaces.items) {
    for (const id of item.sessionIds) workspaceBySession.set(id, { id: item.workspaceId, title: item.title || '未分组' })
  }
  const rows = [...new Set(workspaces.archivedSessionIds)].map(id => {
    const session = sessions.byId[id]
    return { id, title: session?.displayTitle || String(id), updatedAt: session?.updatedAt ?? 0,
      workspace: workspaceBySession.get(id) }
  })
  const needle = query.trim().toLocaleLowerCase()
  const filtered = rows.filter(row => (!workspace || row.workspace?.id === workspace)
    && `${row.title}\n${row.id}\n${row.workspace?.title ?? '未分组'}`.toLocaleLowerCase().includes(needle))
    .sort((a, b) => (oldest ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt) || a.id.localeCompare(b.id))

  const run = async (id: string, action: ((id: string) => Promise<void>) | undefined, label: string) => {
    if (!action || pendingRef.current) return
    pendingRef.current = true
    setPending(id)
    setError('')
    try { await action(id) }
    catch (cause) { setError(`${label}失败：${cause instanceof Error ? cause.message : String(cause)}`) }
    finally { pendingRef.current = false; setPending(null) }
  }
  const close = () => { setVisible(false); setConfirmation(null) }
  return h(React.Fragment, null,
    h('button', {
      type: 'button', 'data-archived-mounted': '1', 'aria-haspopup': 'dialog', 'aria-expanded': visible,
      onClick: () => setVisible(true), title: `已归档会话 ${rows.length}`,
      style: { ...button, position: 'fixed', left: 10, bottom: 112, zIndex: 1300 },
    }, `🗂 已归档 ${rows.length}`),
    visible ? h(Dialog, { title: '已归档会话', close, children: h(React.Fragment, null,
      h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 } },
        h('input', { autoFocus: true, type: 'search', 'aria-label': '搜索归档会话', placeholder: '搜索标题、工作区或会话 ID',
          value: query, onChange: (event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
          style: { ...button, flex: '1 1 220px', minWidth: 0, cursor: 'text' } }),
        h('select', { 'aria-label': '筛选工作区', value: workspace, style: button,
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) => setWorkspace(event.target.value) },
          h('option', { value: '' }, '全部工作区'),
          ...workspaces.items.map(item => h('option', { key: item.workspaceId, value: item.workspaceId }, item.title || '未分组'))),
        h('button', { type: 'button', style: button, onClick: () => setOldest(value => !value) }, oldest ? '最早更新优先' : '最近更新优先')),
      h('p', { style: secondary, role: 'status' }, `显示 ${filtered.length} / ${rows.length} 个归档会话`),
      error ? h('div', { role: 'alert', style: { color: 'var(--dsw-alias-color-danger, #b42318)', marginBottom: 12 } }, error) : null,
      filtered.length === 0 ? h('p', { style: { ...secondary, textAlign: 'center', padding: 24 } }, rows.length ? '没有匹配的归档会话' : '暂无归档会话') : null,
      h('ul', { style: { listStyle: 'none', margin: 0, padding: 0 } }, ...filtered.map(row => h('li', {
        key: row.id, 'aria-busy': pending === row.id,
        style: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--dsw-alias-border-l1, #eee)' },
      },
      h('button', { type: 'button', disabled: pending !== null,
        style: { ...button, textAlign: 'left', flex: '1 1 220px', minWidth: 0, border: 0 },
        title: row.title, onClick: () => {
          try { props.open(row.id); close() }
          catch (cause) { setError(`打开失败：${cause instanceof Error ? cause.message : String(cause)}`) }
        } },
        h('span', { style: { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, row.title),
        h('span', { style: secondary }, `${row.workspace?.title ?? '未分组'} · ${relativeTime(row.updatedAt)}`)),
      props.unarchive ? h('button', { type: 'button', style: button, disabled: pending !== null,
        'aria-label': `取消归档：${row.title}`, onClick: () => { void run(row.id, props.unarchive, '取消归档') } }, pending === row.id ? '处理中…' : '取消归档') : null,
      props.remove ? h('button', { type: 'button', style: { ...button, color: 'var(--dsw-alias-color-danger, #b42318)' }, disabled: pending !== null,
        'aria-label': `删除：${row.title}`, onClick: () => setConfirmation({ id: row.id, title: row.title }) }, '删除') : null))),
    ) }) : null,
    visible && confirmation ? h(Dialog, { title: '永久删除会话', close: () => setConfirmation(null), children: h(React.Fragment, null,
      h('p', { style: { overflowWrap: 'anywhere' } }, `确定删除「${confirmation.title}」？会话记录将永久删除，无法恢复。`),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8 } },
        h('button', { type: 'button', autoFocus: true, style: button, onClick: () => setConfirmation(null) }, '取消'),
        h('button', { type: 'button', style: { ...button, color: '#b42318' }, onClick: () => {
          const target = confirmation
          setConfirmation(null)
          void run(target.id, props.remove, '删除')
        } }, '永久删除')),
    ) }) : null)
}

/** Register with the overlay slot; older hosts expose only browse and open. */
export function apply(ctx: ClientContext): void {
  ctx.inject(['slots', 'workspaces'], (scope: ClientContext) => {
    const workspaces = scope.workspaces as typeof scope.workspaces & {
      unarchiveSession?: (id: SessionId) => Promise<void>
      deleteSession?: (id: SessionId) => Promise<void>
    }
    scope.slots.inject('shell.overlay', () => scope.slots.register({
      name: 'shell.overlay', id: 'dsh-archived', order: 0, label: '已归档',
    }, (props: Pick<ArchivedPanelProps, 'useSessions' | 'useWorkspaces'>) => h(ArchivedPanel, {
      ...props, open: (id: string) => { scope.sessions.open(id as SessionId) },
      unarchive: typeof workspaces.unarchiveSession === 'function' ? (id: string) => workspaces.unarchiveSession!(id as SessionId) : undefined,
      remove: typeof workspaces.deleteSession === 'function' ? (id: string) => workspaces.deleteSession!(id as SessionId) : undefined,
    })))
  })
}
