import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_shell/processes')({
  component: ProcessesPage,
})

function ProcessesPage() {
  return (
    <div className="border-b border-hairline pb-6">
      <h1>Processes</h1>
    </div>
  )
}
