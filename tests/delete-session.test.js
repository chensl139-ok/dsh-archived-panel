import { expect, it } from 'vitest'
import { sessionDirectoryFromLocation } from '../src/delete-session.js'

it('accepts only a canonical session log inside its own directory', () => {
  const directory = sessionDirectoryFromLocation({
    kind: 'jsonl', path: '/tmp/dsh-sessions/project/session-1/session.v4.jsonl.zstd',
  })
  expect(directory).toBe('/tmp/dsh-sessions/project/session-1')
})

it('rejects traversal, foreign files, and filesystem roots', () => {
  expect(() => sessionDirectoryFromLocation({ kind: 'sqlite', path: '/tmp/session.v4.jsonl' })).toThrow(/JSONL/)
  expect(() => sessionDirectoryFromLocation({ kind: 'jsonl', path: '/tmp/session.v4.jsonl.zstd' })).toThrow(/不安全/)
  expect(() => sessionDirectoryFromLocation({ kind: 'jsonl', path: '/tmp/project/session-1/notes.txt' })).toThrow(/文件名/)
})
