import LoginForm from './login-form'
import { Mail, FolderInput } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderInput className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Email File Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your Drive & Gmail workflow.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
