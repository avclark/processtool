import { QueryClient } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 min — cached data shows instantly, refetches in background
        refetchOnWindowFocus: false,
      },
    },
  })

  return {
    queryClient,
  }
}
