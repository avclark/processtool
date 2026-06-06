import { createFileRoute } from '@tanstack/react-router'
import { DesignSystem } from '@/components/design-system/DesignSystem'

export const Route = createFileRoute('/design-system')({
  component: DesignSystem,
})
