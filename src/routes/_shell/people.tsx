import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_shell/people')({
  component: PeoplePage,
})

function PeoplePage() {
  return (
    <div className="border-b border-hairline pb-6">
      <h1>People</h1>
    </div>
  )
}
