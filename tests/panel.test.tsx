// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ArchivedPanel } from '../src/client/index.ts'
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
})
afterEach(cleanup)
function mount(actions = {}) {
  const result = render(<ArchivedPanel {...{
    useSessions: (select: Function) => select({ byId: { one: { id: 'one', displayTitle: '第一条', updatedAt: 100 }, two: { id: 'two', displayTitle: '第二条', updatedAt: 200 } } }),
    useWorkspaces: (select: Function) => select({ items: [], archivedSessionIds: ['one', 'two', 'missing'] }), open: vi.fn(), ...actions,
  } as any} />)
  fireEvent.click(screen.getByText('🗂 已归档 3'))
  return result
}
it('keeps missing metadata visible and searches without losing total count', () => {
  mount()
  expect(screen.getByText('missing')).toBeTruthy()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '第二' } })
  expect(screen.getByText('显示 1 / 3 个归档会话')).toBeTruthy()
  expect(screen.queryByText('第一条')).toBeNull()
})
it('requires explicit confirmation and shows failed deletion without hiding the row', async () => {
  const remove = vi.fn().mockRejectedValue(new Error('disk failure'))
  mount({ remove })
  fireEvent.click(screen.getByLabelText('删除：第一条'))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('取消'))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByLabelText('删除：第一条'))
  fireEvent.click(screen.getByText('永久删除'))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('disk failure'))
  expect(remove).toHaveBeenCalledExactlyOnceWith('one')
  expect(screen.getByText('第一条')).toBeTruthy()
})
it('blocks duplicate mutations and surfaces unarchive errors', async () => {
  const deferred = Promise.withResolvers<void>()
  const unarchive = vi.fn(() => deferred.promise)
  mount({ unarchive })
  const button = screen.getByLabelText('取消归档：第一条') as HTMLButtonElement
  fireEvent.click(button)
  fireEvent.click(button)
  expect(button.disabled).toBe(true)
  expect(unarchive).toHaveBeenCalledTimes(1)
  deferred.reject(new Error('offline'))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('offline'))
  expect(button.disabled).toBe(false)
})
