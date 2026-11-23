import { lstat, rm } from 'node:fs/promises'
import path from 'node:path'

const SESSION_LOG = /^session(?:\.v\d+)?\.jsonl(?:\.zstd)?$/

/** Resolve the session-owned directory for one JSONL location, or reject an unsafe path. */
export function sessionDirectoryFromLocation(location) {
  if (!location || location.kind !== 'jsonl' || typeof location.path !== 'string' || location.path.trim() === '') {
    throw new Error('当前会话不是可识别的 JSONL 日志，已停止删除')
  }
  const file = path.resolve(location.path)
  if (!SESSION_LOG.test(path.basename(file))) {
    throw new Error('会话文件名不符合预期，已停止删除')
  }
  const directory = path.dirname(file)
  const parent = path.dirname(directory)
  const root = path.parse(directory).root
  if (directory === parent || directory === root || parent === root) {
    throw new Error('会话目录位置不安全，已停止删除')
  }
  return directory
}

async function removeSessionDirectory(location) {
  const directory = sessionDirectoryFromLocation(location)
  const stat = await lstat(directory)
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error('会话目录不是普通文件夹，已停止删除')
  }
  await rm(directory, { recursive: true, force: false })
}

/**
 * Permanently delete one archived session log and detach its workspace indexes.
 * Running or owned sessions are refused. Project directories are never touched.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {string} sessionId
 */
export async function deleteArchivedSession(ctx, sessionId) {
  if (typeof sessionId !== 'string' || sessionId.length < 1 || sessionId.length > 200 || /[\\/\0]/.test(sessionId)) {
    throw new Error('会话 ID 无效')
  }
  if (ctx.get('sessions')?.get(sessionId) || ctx.get('agents')?.get(sessionId)) {
    throw new Error('session-live：会话仍在运行或已被打开，请先停止后再删除')
  }
  const registry = ctx.get('workspaceRegistry')
  const persistence = ctx.get('sessionPersistence')
  if (!registry || !persistence) throw new Error('会话存储不可用')
  if (!registry.archivedSessionIds?.includes(sessionId)) {
    throw new Error('只能永久删除已归档的会话')
  }

  const snapshot = await persistence.stat(sessionId)
  if (snapshot) {
    let handle
    try {
      handle = await persistence.open(sessionId, 'write')
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'SessionAlreadyOwnedError') {
        throw new Error('session-live：会话仍被其他组件持有，暂时不能删除')
      }
      throw cause
    }
    await handle.close()
    await removeSessionDirectory(snapshot.location)
    if (await persistence.stat(sessionId)) throw new Error('会话文件仍然存在，删除未完成')
  }

  for (const workspace of registry.list()) {
    if (workspace.sessionIds?.includes(sessionId)) await workspace.detachSession(sessionId)
  }
  await registry.unpinSession(sessionId)
  await registry.unarchiveSession(sessionId)
}
