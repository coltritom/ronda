import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { acceptInvite } from '@/lib/actions/invites'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /* ── Buscar el invite ─────────────────────────────────────── */
  const { data: invite } = await supabase
    .from('invites')
    .select('group_id, group_name')
    .eq('token', token)
    .single()

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-5xl">🔗</div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Link inválido
          </h1>
          <p className="mt-2 text-sm text-muted">
            Este link de invitación no existe o fue revocado.
          </p>
          <Link
            href="/groups"
            className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Ir a mis grupos
          </Link>
        </div>
      </div>
    )
  }

  /* ── No autenticado ───────────────────────────────────────── */
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
            <div className="mb-4 text-4xl">👥</div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Te invitaron a {invite.group_name}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Iniciá sesión para unirte al grupo.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/login?next=/invite/${token}`}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href={`/register?next=/invite/${token}`}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Ya es miembro → redirigir directo ───────────────────── */
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', invite.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    redirect(`/groups/${invite.group_id}`)
  }

  /* ── Formulario de unirse ─────────────────────────────────── */
  async function join() {
    'use server'
    const result = await acceptInvite(token)
    if ('groupId' in result) redirect(`/groups/${result.groupId}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">👥</div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            {invite.group_name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Te invitaron a unirte a este grupo.
          </p>
          <form action={join} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Unirme al grupo
            </button>
          </form>
          <Link
            href="/groups"
            className="mt-3 inline-block text-sm text-muted hover:text-foreground transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  )
}
