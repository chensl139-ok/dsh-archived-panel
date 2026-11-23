/**
 * Archived-sessions panel, host half. The browser half lists archived
 * sessions; this half permanently deletes an archived JSONL log and detaches
 * its workspace indexes. It never deletes a project directory.
 */
import type { Context } from '@deepseek-ai/cordis'
import { deleteArchivedSession } from './delete-session.js'

interface BufferedFetchRoute {
  path: string
  methods: string[]
  requestBody: 'buffered'
  fetch: (request: Request) => Promise<Response>
}

interface HostConnection {
  fetch: { register: (route: BufferedFetchRoute) => () => void }
}

export const inject = ['connection', 'sessionPersistence', 'workspaceRegistry', 'sessions', 'agents']

/** Register the local deletion route used by the archived-sessions page. */
export function apply(ctx: Context): void {
  const connection = (ctx as Context & { connection: HostConnection }).connection
  ctx.effect(() => connection.fetch.register({
    path: '/api/dsh-archived-panel',
    methods: ['POST'],
    requestBody: 'buffered',
    async fetch(request) {
      try {
        const text = await request.text()
        if (text.length > 4000) return Response.json({ error: 'Request too large' }, { status: 413 })
        const input = JSON.parse(text) as { action?: unknown, sessionId?: unknown }
        if (input.action !== 'delete' || typeof input.sessionId !== 'string') {
          return Response.json({ error: 'Unsupported action' }, { status: 400 })
        }
        await deleteArchivedSession(ctx, input.sessionId)
        return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause)
        return Response.json({ error: message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
      }
    },
  }))
}
