import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_shell/shows')({
  component: ShowsPage,
})

function ShowsPage() {
  return (
    <div className="border-b border-hairline pb-6">
      <h1>Shows</h1>
    </div>
  )
}
