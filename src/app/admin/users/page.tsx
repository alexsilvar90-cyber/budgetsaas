'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, CostCenter, Role } from '@/types'
import { UserPlus, ToggleLeft, ToggleRight, Loader2, Search } from 'lucide-react'
import { clsx } from '@/lib/utils'

interface ProfileWithCC extends Profile {
  cost_centers: CostCenter | null
}

export default function AdminUsersPage() {
  const supabase = createClient()

  const [users, setUsers] = useState<ProfileWithCC[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<Role>('manager')
  const [newCostCenter, setNewCostCenter] = useState('')
  const [savingUser, setSavingUser] = useState(false)
  const [modalError, setModalError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
    loadCostCenters()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, cost_centers(*)')
      .order('full_name')
    setUsers((data as ProfileWithCC[]) ?? [])
    setLoading(false)
  }

  async function loadCostCenters() {
    const { data } = await supabase.from('cost_centers').select('*').order('name')
    setCostCenters((data as CostCenter[]) ?? [])
    if (data && data.length > 0) setNewCostCenter(data[0].id)
  }

  async function toggleActive(user: ProfileWithCC) {
    setTogglingId(user.id)
    await supabase
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    setTogglingId(null)
  }

  async function handleAddUser() {
    if (!newEmail.trim()) return
    setSavingUser(true)
    setModalError('')

    try {
      // Check if profile already exists by email
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newEmail.trim().toLowerCase())
        .maybeSingle()

      if (existing) {
        // Update role and cost center on existing profile
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole, cost_center_id: newCostCenter || null, is_active: true })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        setModalError('Usuário não encontrado. O gestor precisa fazer login pelo menos uma vez via SSO antes de ser configurado aqui.')
        setSavingUser(false)
        return
      }

      setShowModal(false)
      setNewEmail('')
      await loadUsers()
    } catch (e: any) {
      setModalError(e?.message ?? 'Erro desconhecido')
    } finally {
      setSavingUser(false)
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestores</h1>
          <p className="text-sm text-surface-muted mt-1">Gerencie o acesso dos gestores ao sistema</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Adicionar Gestor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input pl-9"
        />
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card/50">
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">E-mail</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Centro de Custo</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Perfil</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Último Acesso</th>
                <th className="px-4 py-3 text-left font-medium text-surface-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-surface-muted">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-surface-muted">Nenhum usuário encontrado.</td>
                </tr>
              )}
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                        {(user.full_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{user.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-muted">{user.email ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-muted">
                    {user.cost_centers ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-600/10 text-brand-400 text-xs border border-brand-600/20">
                        {user.cost_centers.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded-md text-xs border font-medium capitalize',
                      user.role === 'admin'
                        ? 'bg-purple-900/20 text-purple-400 border-purple-700/30'
                        : 'bg-surface-border/50 text-surface-muted border-surface-border'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-surface-muted text-xs">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
                      : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(user)}
                      disabled={togglingId === user.id}
                      title={user.is_active ? 'Clique para desativar' : 'Clique para ativar'}
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    >
                      {togglingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-surface-muted" />
                      ) : user.is_active ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                          <span className="text-emerald-400">Ativo</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-surface-muted" />
                          <span className="text-surface-muted">Inativo</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md space-y-5">
            <div>
              <h2 className="text-base font-semibold text-white">Adicionar Gestor</h2>
              <p className="text-xs text-surface-muted mt-1">
                O usuário deve ter feito login pelo menos uma vez via Azure AD SSO.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-surface-muted mb-1.5">E-mail corporativo</label>
                <input
                  type="email"
                  placeholder="nome@empresa.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs text-surface-muted mb-1.5">Perfil</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as Role)}
                  className="form-select w-full"
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {newRole === 'manager' && (
                <div>
                  <label className="block text-xs text-surface-muted mb-1.5">Centro de Custo</label>
                  <select
                    value={newCostCenter}
                    onChange={e => setNewCostCenter(e.target.value)}
                    className="form-select w-full"
                  >
                    {costCenters.length === 0 && <option>Nenhum centro cadastrado</option>}
                    {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>)}
                  </select>
                </div>
              )}

              {modalError && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg p-3">{modalError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); setModalError('') }} className="btn-ghost">Cancelar</button>
              <button onClick={handleAddUser} disabled={savingUser || !newEmail} className="btn-primary">
                {savingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {savingUser ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
