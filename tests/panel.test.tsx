// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ArchivedPanel, deriveArchivedRows } from '../src/client/index.ts'
import { zh, en } from '../src/client/locales.ts'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
})
afterEach(cleanup)

const t = (key: keyof typeof zh, variables: Record<string, string | number> = {}) =>
  zh[key].replace(/\{(\w+)\}/g, (_, name: string) => String(variables[name] ?? `{${name}}`))

function mount(actions = {}) {
  const workspaces = {
    items: [{ workspaceId: 'work', title: '项目', sessionIds: ['one', 'two'], path: '/work', createdAt: '', updatedAt: '' }],
    archivedSessionIds: ['one', 'two', 'missing'],
    pinnedSessionIds: [], phase: 'ready', state: 'idle', error: null,
  }
  const sessions = {
    ids: ['one', 'two'],
    byId: {
      one: { id: 'one', displayTitle: '第一条', updatedAt: 100 },
      two: { id: 'two', displayTitle: '第二条', updatedAt: 200 },
    },
    phase: 'ready', projectionsBySession: {},
  }
  return render(<ArchivedPanel {...{
    useSessions: (select: Function) => select(sessions),
    useWorkspaces: (select: Function) => select(workspaces),
    useSessionAccess: () => true,
    unarchive: vi.fn().mockResolvedValue(undefined),
    open: vi.fn(), remove: vi.fn().mockResolvedValue(undefined), t, locale: 'zh', ...actions,
  } as any} />)
}

it('keeps missing metadata visible and searches without losing total count', () => {
  mount()
  expect(screen.getByText('missing')).toBeTruthy()
  expect(screen.getByText('暂时无法读取会话元数据；已保留会话 ID，可稍后重试。')).toBeTruthy()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '第二' } })
  expect(screen.getByText('显示 1 / 3 个归档会话')).toBeTruthy()
  expect(screen.queryByText('第一条')).toBeNull()
})

it('filters by workspace and offers a clear action for empty results', () => {
  mount()
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '__ungrouped__' } })
  expect(screen.getByText('missing')).toBeTruthy()
  expect(screen.queryByText('第一条')).toBeNull()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'not-found' } })
  expect(screen.getByText('没有匹配的会话')).toBeTruthy()
  fireEvent.click(screen.getByText('清除筛选'))
  expect(screen.getByText('第一条')).toBeTruthy()
})

it('opens only after restoration succeeds', async () => {
  const deferred = Promise.withResolvers<void>()
  const unarchive = vi.fn(() => deferred.promise)
  const open = vi.fn()
  mount({ unarchive, open })
  const action = screen.getByLabelText('恢复并打开：第一条') as HTMLButtonElement
  fireEvent.click(action)
  fireEvent.click(action)
  expect(action.disabled).toBe(true)
  expect(unarchive).toHaveBeenCalledExactlyOnceWith('one')
  expect(open).not.toHaveBeenCalled()
  deferred.resolve()
  await waitFor(() => expect(open).toHaveBeenCalledExactlyOnceWith('one'))
})

it('surfaces restore failures without hiding the row', async () => {
  const unarchive = vi.fn().mockRejectedValue(new Error('offline'))
  const open = vi.fn()
  mount({ unarchive, open })
  fireEvent.click(screen.getByLabelText('恢复：第一条'))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('offline'))
  expect(unarchive).toHaveBeenCalledExactlyOnceWith('one')
  expect(open).not.toHaveBeenCalled()
  expect(screen.getByText('第一条')).toBeTruthy()
  expect((screen.getByLabelText('恢复：第一条') as HTMLButtonElement).disabled).toBe(false)
})

it('does not open when restoration fails and reports post-restore open errors separately', async () => {
  const open = vi.fn(() => { throw new Error('navigation refused') })
  mount({ open })
  fireEvent.click(screen.getByLabelText('恢复并打开：第一条'))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('已恢复，但打开失败'))
  expect(screen.getByRole('status').textContent).toContain('已将“第一条”恢复')
})

it('hides restore without access but still offers confirmed deletion', async () => {
  const remove = vi.fn().mockResolvedValue(undefined)
  mount({ useSessionAccess: () => false, remove })
  expect(screen.getAllByText('当前权限无法恢复此会话。')).toHaveLength(3)
  expect(screen.queryByRole('button', { name: /恢复并打开：/ })).toBeNull()
  fireEvent.click(screen.getByLabelText('删除：第一条'))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('取消'))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByLabelText('删除：第一条'))
  fireEvent.click(screen.getByText('永久删除'))
  await waitFor(() => expect(remove).toHaveBeenCalledExactlyOnceWith('one'))
  expect(screen.getByRole('status').textContent).toContain('已永久删除')
})

it('deduplicates archive IDs and keeps unknown timestamps last in either order', () => {
  const rows = deriveArchivedRows({
    items: [], archivedSessionIds: ['one', 'one', 'missing'] as any,
  }, { byId: { one: { displayTitle: '第一条', updatedAt: 100 } } } as any)
  expect(rows.map(row => row.id)).toEqual(['one', 'missing'])
  mount()
  const getIds = () => within(screen.getByRole('list')).getAllByRole('listitem').map(row => row.querySelector('code')?.textContent)
  expect(getIds()).toEqual(['two', 'one', 'missing'])
  fireEvent.click(screen.getByText('最近更新优先'))
  expect(getIds()).toEqual(['one', 'two', 'missing'])
})

it('keeps Chinese and English locale keys balanced', () => {
  expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
})
