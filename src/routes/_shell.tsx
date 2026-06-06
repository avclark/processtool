import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell'
import { useDevAuth } from '@/lib/dev-auth'

export const Route = createFileRoute('/_shell')({
  component: ShellLayout,
})

function ShellLayout() {
  // TEMPORARY — dev-auth bridge, removed in Phase 11
  const auth = useDevAuth()

  if (auth.status === 'loading') {
    return (
      <AppShell>
        <p className="text-ink-muted">Signing in...</p>
      </AppShell>
    )
  }

  if (auth.status === 'error') {
    return (
      <AppShell>
        <div className="callout callout-danger">
          <p>
            <strong>Dev auth error:</strong> {auth.error}
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
