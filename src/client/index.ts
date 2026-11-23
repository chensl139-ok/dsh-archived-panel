import * as React from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceId, WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {
  PropsRuntime, SnapshotSelectorHook, TranslateNS,
} from '@deepseek-ai/dsh-client-ui-slots'
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { en, zh, NS } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface GlobalStandardProps {
    /** Session list supplied by the installed session UI adapter. */
    useSessions: SnapshotSelectorHook<SessionListState>
    /** Whether the current peer may call one Session action. */
    useSessionAccess: (sessionId: SessionId, action: string) => boolean
  }
}
import { panelStyles } from './styles.ts'

const h = React.createElement
const PANEL_ID = 'dsh-archived-panel'
const UNGROUPED_FILTER = '__ungrouped__'

type PanelRuntimeProps = Pick<
  PropsRuntime<'main'>, 'useSessions' | 'useWorkspaces' | 'useSessionAccess'
>

export interface ArchivedPanelProps extends PanelRuntimeProps {
  t: TranslateNS<typeof NS>
  locale: string
  unarchive: (id: SessionId) => Promise<void>
  open: (id: SessionId) => void
  remove: (id: SessionId) => Promise<void>
}

interface WorkspaceRef {
  id: WorkspaceId
  title: string
}

export interface ArchivedRowData {
  id: SessionId
  title: string
  updatedAt: number
  metadataAvailable: boolean
  workspace?: WorkspaceRef
}

interface PendingOperation {
  id: SessionId
  action: 'restore' | 'open' | 'delete'
}

/** Keep archive IDs even when their Session summary is temporarily missing. */
export function deriveArchivedRows(
  workspaces: Pick<WorkspaceSnapshot, 'items' | 'archivedSessionIds'>,
  sessions: Pick<SessionListState, 'byId'>,
): ArchivedRowData[] {
  const workspaceBySession = new Map<SessionId, WorkspaceRef>()
  for (const item of workspaces.items) {
    const workspace = { id: item.workspaceId, title: item.title.trim() }
    for (const id of item.sessionIds) workspaceBySession.set(id, workspace)
  }
  return [...new Set(workspaces.archivedSessionIds)].map(id => {
    const session = sessions.byId[id]
    return {
      id,
      title: session?.displayTitle?.trim() ?? '',
      updatedAt: session?.updatedAt ?? 0,
      metadataAvailable: session !== undefined,
      workspace: workspaceBySession.get(id),
    }
  })
}

function ArchiveIcon({ size = 20 }: { size?: number }) {
  return h('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true,
  },
  h('path', { d: 'M5 9h14v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V9Z', stroke: 'currentColor', strokeWidth: 1.7 }),
  h('path', { d: 'M4 4.5h16V9H4zM9.5 13h5', stroke: 'currentColor', strokeWidth: 1.7, strokeLinejoin: 'round' }))
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

function formatTime(timestamp: number, locale: string, unknown: string): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return unknown
  try {
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : locale, {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date(timestamp))
  } catch {
    return new Date(timestamp).toLocaleString()
  }
}

function ConfirmDialog(props: { title: string, close: () => void, children: React.ReactNode }) {
  const ref = React.useRef<HTMLDialogElement>(null)
  const titleId = React.useId()
  React.useEffect(() => {
    const dialog = ref.current
    if (!dialog) return undefined
    dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])
  return h('dialog', {
    ref, className: 'dap-dialog', 'aria-labelledby': titleId, 'data-window-drag-exclude': '',
    onCancel: (event: React.SyntheticEvent) => { event.preventDefault(); props.close() },
  },
  h('h2', { id: titleId }, props.title),
  props.children)
}

function ArchivedRow(props: {
  row: ArchivedRowData
  pending: PendingOperation | null
  sessionsReady: boolean
  locale: string
  t: TranslateNS<typeof NS>
  useSessionAccess: ArchivedPanelProps['useSessionAccess']
  run: (row: ArchivedRowData, action: 'restore' | 'open') => void
  requestDelete: (row: ArchivedRowData) => void
}) {
  const { row, pending, t } = props
  const allowed = props.useSessionAccess(row.id, 'workspace/unarchiveSession')
  const busy = pending?.id === row.id
  const title = row.title || t('untitled')
  const workspaceTitle = row.workspace?.title || t('ungrouped')
  const busyText = pending?.action === 'open' ? t('opening') : pending?.action === 'delete' ? t('deleting') : t('restoring')
  return h('li', {
    className: 'dap-row', 'aria-busy': busy,
  },
  h('div', { className: 'dap-copy' },
    h('h2', { title: title || String(row.id) }, title),
    h('div', { className: 'dap-meta' },
      h('span', null, workspaceTitle),
      h('span', null, formatTime(row.updatedAt, props.locale, t('unknownTime')))),
    h('code', { className: 'dap-id', title: String(row.id) }, String(row.id)),
    !row.metadataAvailable && props.sessionsReady ? h('p', { className: 'dap-warning' }, t('metadataMissing')) : null),
  h('div', { className: 'dap-actions' },
    allowed
      ? h(React.Fragment, null,
        h('button', {
          type: 'button', className: 'dap-button', disabled: pending !== null,
          'aria-label': t('restoreFor', { title }),
          onClick: () => props.run(row, 'restore'),
        }, busy && pending?.action === 'restore' ? busyText : t('restore')),
        h('button', {
          type: 'button', className: 'dap-button dap-primary', disabled: pending !== null,
          'aria-label': t('restoreAndOpenFor', { title }),
          onClick: () => props.run(row, 'open'),
        }, busy && pending?.action === 'open' ? busyText : t('restoreAndOpen')))
      : h('span', { className: 'dap-access' }, t('restoreUnavailable')),
    h('button', {
      type: 'button', className: 'dap-button dap-danger', disabled: pending !== null,
      'aria-label': t('deleteFor', { title }),
      onClick: () => props.requestDelete(row),
    }, busy && pending?.action === 'delete' ? busyText : t('delete'))))
}

/** Searchable native page rendered in DSH's root-scoped `main` slot. */
export function ArchivedPanel(props: ArchivedPanelProps) {
  const { t } = props
  const [query, setQuery] = React.useState('')
  const deferredQuery = React.useDeferredValue(query)
  const [workspace, setWorkspace] = React.useState('')
  const [oldest, setOldest] = React.useState(false)
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [pending, setPending] = React.useState<PendingOperation | null>(null)
  const [confirmation, setConfirmation] = React.useState<ArchivedRowData | null>(null)
  const pendingRef = React.useRef(false)
  const mountedRef = React.useRef(true)
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  const searchId = React.useId()
  React.useEffect(() => () => { mountedRef.current = false }, [])

  const archivedIds = props.useWorkspaces((state: WorkspaceSnapshot) => state.archivedSessionIds)
  const workspaceItems = props.useWorkspaces((state: WorkspaceSnapshot) => state.items)
  const workspacePhase = props.useWorkspaces((state: WorkspaceSnapshot) => state.phase)
  const workspaceError = props.useWorkspaces((state: WorkspaceSnapshot) => state.error)
  const byId = props.useSessions((state: SessionListState) => state.byId)
  const sessionsPhase = props.useSessions((state: SessionListState) => state.phase)
  const rows = React.useMemo(
    () => deriveArchivedRows({ items: workspaceItems, archivedSessionIds: archivedIds }, { byId }),
    [workspaceItems, archivedIds, byId],
  )
  const filtered = React.useMemo(() => {
    const needle = deferredQuery.trim().toLocaleLowerCase()
    return rows.filter(row => {
      const workspaceMatch = !workspace
        || (workspace === UNGROUPED_FILTER ? row.workspace === undefined : row.workspace?.id === workspace)
      if (!workspaceMatch) return false
      const title = row.title || t('untitled')
      const haystack = `${title}\n${String(row.id)}\n${row.workspace?.title || t('ungrouped')}`
      return haystack.toLocaleLowerCase().includes(needle)
    }).sort((a, b) => {
      const aValid = Number.isFinite(a.updatedAt) && a.updatedAt > 0
      const bValid = Number.isFinite(b.updatedAt) && b.updatedAt > 0
      if (aValid !== bValid) return aValid ? -1 : 1
      if (aValid && bValid && a.updatedAt !== b.updatedAt) {
        return oldest ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt
      }
      return String(a.id).localeCompare(String(b.id))
    })
  }, [rows, deferredQuery, workspace, oldest, t])

  const focusHeading = () => { headingRef.current?.focus() }
  const run = async (row: ArchivedRowData, action: 'restore' | 'open' | 'delete') => {
    if (pendingRef.current) return
    pendingRef.current = true
    const title = row.title || t('untitled')
    setPending({ id: row.id, action })
    setError('')
    setNotice('')
    try {
      if (action === 'delete') {
        await props.remove(row.id)
        if (!mountedRef.current) return
        setNotice(t('deleted', { title }))
        focusHeading()
      } else {
        await props.unarchive(row.id)
        if (!mountedRef.current) return
        if (action === 'open') {
          try { props.open(row.id) }
          catch (cause) {
            setNotice(t('restored', { title }))
            setError(t('openFailed', { title, message: messageOf(cause) }))
            focusHeading()
          }
        } else {
          setNotice(t('restored', { title }))
          focusHeading()
        }
      }
    } catch (cause) {
      if (mountedRef.current) {
        setError(t(action === 'delete' ? 'deleteFailed' : 'restoreFailed', { title, message: messageOf(cause) }))
      }
    } finally {
      pendingRef.current = false
      if (mountedRef.current) setPending(null)
    }
  }

  const clearFilters = () => { setQuery(''); setWorkspace('') }
  const sessionsReady = sessionsPhase === 'ready'
  const loading = !workspaceError && (workspacePhase === 'pending' || (!sessionsReady && rows.some(row => !row.metadataAvailable)))
  let content: React.ReactNode
  if (workspaceError && rows.length === 0) {
    content = null
  } else if (rows.length === 0 && loading) {
    content = h('div', { className: 'dap-empty', role: 'status' },
      h('span', { className: 'dap-spinner', 'aria-hidden': true }), t('loading'))
  } else if (filtered.length === 0) {
    const filteredEmpty = rows.length > 0
    content = h('div', { className: 'dap-empty' },
      h('div', { className: 'dap-empty-icon' }, h(ArchiveIcon, { size: 32 })),
      h('h2', null, t(filteredEmpty ? 'noMatchesTitle' : 'emptyTitle')),
      h('p', null, t(filteredEmpty ? 'noMatchesDescription' : 'emptyDescription')),
      filteredEmpty ? h('button', { type: 'button', className: 'dap-button', onClick: clearFilters }, t('clearFilters')) : null)
  } else {
    content = h('ul', { className: 'dap-list', 'aria-label': t('title') }, filtered.map(row =>
      h(ArchivedRow, {
        key: String(row.id), row, pending, sessionsReady, locale: props.locale, t,
        useSessionAccess: props.useSessionAccess,
        run: (target, action) => { void run(target, action) },
        requestDelete: setConfirmation,
      })))
  }

  return h('main', { className: 'dap-root', 'data-archived-mounted': '1' },
    h('style', null, panelStyles),
    h('div', { className: 'dap-inner' },
      h('header', { className: 'dap-header' },
        h('div', { className: 'dap-heading', 'data-window-drag': '' },
          h('h1', { ref: headingRef, tabIndex: -1 }, t('title')),
          h('p', null, t('subtitle'))),
        h('span', { className: 'dap-count' }, t('totalCount', { total: rows.length }))),
      h('section', { className: 'dap-toolbar', 'aria-label': t('title') },
        h('input', {
          id: searchId, className: 'dap-input', type: 'search', value: query,
          'aria-label': t('search'), placeholder: t('searchPlaceholder'),
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
        }),
        h('select', {
          className: 'dap-select', value: workspace, 'aria-label': t('workspaceFilter'),
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) => setWorkspace(event.target.value),
        },
        h('option', { value: '' }, t('allWorkspaces')),
        h('option', { value: UNGROUPED_FILTER }, t('ungrouped')),
        workspaceItems.map((item: WorkspaceSnapshot['items'][number]) => h('option', { key: item.workspaceId, value: item.workspaceId }, item.title || t('ungrouped')))),
        h('button', {
          type: 'button', className: 'dap-button', 'aria-pressed': oldest,
          onClick: () => setOldest(value => !value),
        }, t(oldest ? 'oldestFirst' : 'newestFirst'))),
      h('p', { className: 'dap-status', role: 'status', 'aria-live': 'polite' },
        notice || t('resultCount', { shown: filtered.length, total: rows.length })),
      workspaceError ? h('div', { className: 'dap-alert', role: 'alert' },
        t('loadFailed', { message: workspaceError.message })) : null,
      error ? h('div', { className: 'dap-alert', role: 'alert' }, error) : null,
      content,
      confirmation ? h(ConfirmDialog, {
        title: t('confirmTitle'),
        close: () => setConfirmation(null),
        children: h(React.Fragment, null,
          h('p', null, t('confirmBody', { title: confirmation.title || t('untitled') })),
          h('div', { className: 'dap-dialog-actions' },
            h('button', { type: 'button', className: 'dap-button', autoFocus: true, onClick: () => setConfirmation(null) }, t('cancel')),
            h('button', {
              type: 'button', className: 'dap-button dap-danger',
              onClick: () => {
                const target = confirmation
                setConfirmation(null)
                void run(target, 'delete')
              },
            }, t('confirmDelete')))),
      }) : null))
}

export const inject = ['slots', 'locale', 'uiWorkspace']

/** Register a native sidebar entry and its matching global main panel. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'archived-panel: dictionaries')
  const t = ctx.locale.bind(NS)
  const workspaceActions = ctx.get('uiWorkspace') as Pick<UiWorkspace, 'openSession' | 'unarchiveSession'>

  function Page(runtimeProps: PanelRuntimeProps) {
    const locale = React.useSyncExternalStore(
      listener => ctx.locale.subscribe(listener),
      () => ctx.locale.getSnapshot(),
    )
    return h(ArchivedPanel, {
      ...runtimeProps,
      t, locale: locale.active,
      unarchive: async (id: SessionId) => { await workspaceActions.unarchiveSession(id) },
      open: (id: SessionId) => { workspaceActions.openSession(id) },
      remove: async (id: SessionId) => {
        const response = await fetch('/api/dsh-archived-panel', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', sessionId: id }),
        })
        const value = await response.json() as { error?: string }
        if (!response.ok || value.error) throw new Error(value.error || `HTTP ${response.status}`)
      },
    })
  }

  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Page))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: PANEL_ID, order: 40, label: () => t('title'),
  }, ArchiveIcon))
}
