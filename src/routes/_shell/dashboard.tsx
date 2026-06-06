import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_shell/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="border-b border-hairline pb-6">
      <h1>Dashboard</h1>
    </div>
  )
}
