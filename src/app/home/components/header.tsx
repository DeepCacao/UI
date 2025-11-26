'use client'

import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="w-full flex items-center justify-between py-6 px-6 md:px-12 border-b border-neutral-800/10">
      <div className="flex flex-col">
        <h1 className="text-xl font-medium tracking-widest uppercase">
          Cacao Scan
        </h1>
        <p className="text-xs text-muted-foreground font-light tracking-wide uppercase">
          Dashboard
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-none hover:bg-transparent">
          <Bell className="h-5 w-5 stroke-[1.5]" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-none hover:bg-transparent">
          <Menu className="h-5 w-5 stroke-[1.5]" />
        </Button>
      </div>
    </header>
  )
}
