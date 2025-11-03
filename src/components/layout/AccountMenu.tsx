'use client'
import React from 'react'
import { AuthService } from '@/lib/auth'
import { Button } from '@/components/ui/Button'

export function AccountMenu() {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) { return }
      const target = e.target as Node
      if (menuRef.current && !menuRef.current.contains(target) && buttonRef.current && !buttonRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (!open) { return }
      if (e.key === 'Escape') { setOpen(false) }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const signOut = async () => {
    try {
      await AuthService.signOut()
    } finally {
      window.location.assign('/')
    }
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef as any}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : 'false'}
        variant="outline"
        size="sm"
        onClick={() => setOpen(v => !v)}
      >
        Account
      </Button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg focus:outline-none z-50"
        >
          <a role="menuitem" className="block px-4 py-2 text-sm hover:bg-gray-50" href="/dashboard">Dashboard</a>
          <a role="menuitem" className="block px-4 py-2 text-sm hover:bg-gray-50" href="/inventory">Cellar / Inventory</a>
          <a role="menuitem" className="block px-4 py-2 text-sm hover:bg-gray-50" href="/chat">Chat Sommelier</a>
          <a role="menuitem" className="block px-4 py-2 text-sm hover:bg-gray-50" href="/settings">Settings</a>
          <button role="menuitem" className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50" onClick={signOut}>Sign out</button>
        </div>
      )}
    </div>
  )
}


