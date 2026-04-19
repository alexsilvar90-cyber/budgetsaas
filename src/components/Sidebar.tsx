'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload, Users, LogOut, TrendingUp, BrainCircuit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { clsx } from '@/lib/utils'
import type { Role } from '@/types'

interface SidebarProps {
  role: Role
  userName: string | null
}

const allLinks = [
  { href: '/dashboard',           label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin', 'manager'] as Role[] },
  { href: '/dashboard/agente-fpa', label: 'Agente FP&A', icon: BrainCircuit,  roles: ['admin', 'manager'] as Role[] },
  { href: '/upload',              label: 'Importar',   icon: Upload,          roles: ['admin'] as Role[] },
  { href: '/admin/users',         label: 'Gestores',   icon: Users,           roles: ['admin'] as Role[] },
]

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const links = allLinks.filter(l => l.roles.includes(role))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-surface-card border-r border-surface-border flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-white text-sm">BudgetSaaS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                  : 'text-surface-muted hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-semibold text-white">
            {(userName ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName ?? 'Usuário'}</p>
            <p className="text-xs text-surface-muted capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="btn-ghost w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
