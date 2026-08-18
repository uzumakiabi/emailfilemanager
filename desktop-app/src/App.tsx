import { useState } from 'react'
import { Mail, Settings as SettingsIcon, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import Dashboard from './pages/Dashboard'
import SettingsPage from './pages/Settings'
import AdminPage from './pages/Admin'

type Tab = 'dashboard' | 'settings' | 'admin'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { t, language, setLanguage } = useI18n()

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">{t('app.title')}</div>
          <div className="text-xs text-muted-foreground leading-tight">{t('app.subtitle')}</div>
        </div>
        <nav className="ml-auto flex items-center gap-1">
          <NavButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label={t('nav.dashboard')} />
          <NavButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={<SettingsIcon className="w-4 h-4" />} label={t('nav.settings')} />
          <NavButton active={tab === 'admin'} onClick={() => setTab('admin')} icon={<ShieldCheck className="w-4 h-4" />} label={t('nav.admin')} />
          <div className="ml-2 flex items-center rounded-md border overflow-hidden">
            <LangButton active={language === 'en'} onClick={() => setLanguage('en')} label="EN" />
            <LangButton active={language === 'mk'} onClick={() => setLanguage('mk')} label="МК" />
          </div>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'settings' && <SettingsPage />}
          {tab === 'admin' && <AdminPage />}
        </div>
      </main>
    </div>
  )
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function LangButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1.5 text-xs font-semibold transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'
      )}
    >
      {label}
    </button>
  )
}
