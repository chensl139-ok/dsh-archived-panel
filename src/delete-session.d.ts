export function sessionDirectoryFromLocation(location: { kind?: string, path?: string } | undefined): string
export function deleteArchivedSession(ctx: { get(name: string): any }, sessionId: string): Promise<void>
