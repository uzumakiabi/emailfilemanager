'use client'

import { useState } from 'react'
import { Download, Apple, Monitor, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const RELEASE_TAG = 'v2.0.2'
const BASE = `https://github.com/uzumakiabi/emailfilemanager/releases/download/${RELEASE_TAG}`

const downloads = [
  {
    id: 'mac-arm64',
    label: 'macOS · Apple Silicon',
    detail: 'For M1, M2, M3 and newer Macs',
    icon: Apple,
    href: `${BASE}/pratiplati-2.0.2-arm64.dmg`,
  },
  {
    id: 'mac-intel',
    label: 'macOS · Intel',
    detail: 'For Intel-based Macs',
    icon: Monitor,
    href: `${BASE}/pratiplati-2.0.2.dmg`,
  },
  {
    id: 'windows',
    label: 'Windows',
    detail: 'Windows 10 and 11',
    icon: HardDrive,
    href: `${BASE}/pratiplati.Setup.2.0.2.exe`,
  },
]

export default function DownloadDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Download className="w-4 h-4" />
          Download Desktop App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download pratiplati</DialogTitle>
          <DialogDescription>
            Get the desktop app for your operating system. It lets you send Drive files and collect Gmail responses from your own computer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {downloads.map((d) => (
            <a
              key={d.id}
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <d.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{d.label}</div>
                <div className="text-xs text-muted-foreground">{d.detail}</div>
              </div>
              <Download className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Downloads are hosted on GitHub Releases. The app runs entirely on your machine — your files and credentials never leave your computer.
        </p>
        <p className="text-xs text-muted-foreground">
          On macOS, the app isn&apos;t notarized by Apple yet. If you see &quot;can&apos;t be opened&quot;, right-click the app in Finder and choose <strong>Open</strong>, then confirm.
        </p>
      </DialogContent>
    </Dialog>
  )
}
