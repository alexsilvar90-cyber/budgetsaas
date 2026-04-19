import type { Metadata } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import type { Role } from '@/types'

export const metadata: Metadata = {
  title: 'BudgetSaaS — Gestão Orçamentária',
  description: 'Sistema interno de divulgação e acompanhamento orçamentário',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile (role, name) if user is signed in
  let role: Role = 'manager'
  let userName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()

    role = (profile?.role as Role) ?? 'manager'
    userName = profile?.full_name ?? profile?.email ?? user.email ?? null
  }

  const isAuthPage = !user

  return (
    <html lang="pt-BR">
      <body className="bg-surface text-white font-sans">
        {isAuthPage ? (
          <>{children}</>
        ) : (
          <div className="flex min-h-screen">
            <Sidebar role={role} userName={userName} />
            <main className="flex-1 ml-64 min-h-screen">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        )}
      </body>
    </html>
  )
}
