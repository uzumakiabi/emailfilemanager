declare module 'imapflow' {
  export class ImapFlow {
    constructor(options: any)
    connect(): Promise<void>
    logout(): Promise<void>
    getMailboxLock(mailbox: string): Promise<{ release: () => void }>
    search(criteria: any, options?: any): Promise<number[]>
    fetchOne(range: string, query: any, options?: any): Promise<any>
  }
}
