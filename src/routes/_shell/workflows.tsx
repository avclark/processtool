import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_shell/workflows')({
  component: WorkflowsPage,
})

function WorkflowsPage() {
  return (
    <div className="border-b border-hairline pb-6">
      <h1>Workflows</h1>
    </div>
  )
}
