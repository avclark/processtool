/**
 * Query key factory — every TanStack Query key in the app follows this pattern.
 *
 * Convention:
 *   queryKeys.<entity>.all     → base key for invalidating everything for that entity
 *   queryKeys.<entity>.list()  → list/index queries (optionally accepts filter params)
 *   queryKeys.<entity>.detail(id) → single-record queries
 *
 * Usage:
 *   useQuery({ queryKey: queryKeys.shows.list(), queryFn: ... })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.shows.all })
 */
export const queryKeys = {
  shows: {
    all: ["shows"] as const,
    list: () => [...queryKeys.shows.all, "list"] as const,
    detail: (id: string) => [...queryKeys.shows.all, id] as const,
  },
  workflows: {
    all: ["workflows"] as const,
    list: () => [...queryKeys.workflows.all, "list"] as const,
    detail: (id: string) => [...queryKeys.workflows.all, id] as const,
    countByProcess: (processId: string) =>
      [...queryKeys.workflows.all, "countByProcess", processId] as const,
  },
  processes: {
    all: ["processes"] as const,
    list: () => [...queryKeys.processes.all, "list"] as const,
    detail: (id: string) => [...queryKeys.processes.all, id] as const,
  },
  taskTemplates: {
    all: ["taskTemplates"] as const,
    byProcess: (processId: string) =>
      [...queryKeys.taskTemplates.all, "byProcess", processId] as const,
    detail: (id: string) => [...queryKeys.taskTemplates.all, id] as const,
  },
  taskTemplateBlocks: {
    all: ["taskTemplateBlocks"] as const,
    byTemplate: (templateId: string) =>
      [...queryKeys.taskTemplateBlocks.all, templateId] as const,
  },
  visibilityRules: {
    all: ["visibilityRules"] as const,
    byTemplate: (templateId: string) =>
      [...queryKeys.visibilityRules.all, templateId] as const,
  },
  dependencies: {
    all: ["dependencies"] as const,
    byTemplate: (templateId: string) =>
      [...queryKeys.dependencies.all, templateId] as const,
  },
  dateRules: {
    all: ["dateRules"] as const,
    byTemplate: (templateId: string) =>
      [...queryKeys.dateRules.all, templateId] as const,
  },
  completionActions: {
    all: ["completionActions"] as const,
    byTemplate: (templateId: string) =>
      [...queryKeys.completionActions.all, templateId] as const,
  },
  emailTemplate: {
    all: ["emailTemplate"] as const,
    byTemplate: (templateId: string) =>
      [...queryKeys.emailTemplate.all, templateId] as const,
  },
  episodes: {
    all: ["episodes"] as const,
    list: () => [...queryKeys.episodes.all, "list"] as const,
    detail: (id: string) => [...queryKeys.episodes.all, id] as const,
    countByShow: (showId: string) =>
      [...queryKeys.episodes.all, "countByShow", showId] as const,
    countByProcess: (processId: string) =>
      [...queryKeys.episodes.all, "countByProcess", processId] as const,
  },
  users: {
    all: ["users"] as const,
    list: () => [...queryKeys.users.all, "list"] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    openCountByUser: (userId: string) =>
      [...queryKeys.tasks.all, "openCountByUser", userId] as const,
  },
  settingDefinitions: {
    all: ["settingDefinitions"] as const,
    list: () => [...queryKeys.settingDefinitions.all, "list"] as const,
  },
  showSettingValues: {
    all: ["showSettingValues"] as const,
    byShow: (showId: string) =>
      [...queryKeys.showSettingValues.all, showId] as const,
  },
  roles: {
    all: ["roles"] as const,
    list: () => [...queryKeys.roles.all, "list"] as const,
  },
  roleMembers: {
    all: ["roleMembers"] as const,
    list: () => [...queryKeys.roleMembers.all, "list"] as const,
  },
  showRoleAssignments: {
    all: ["showRoleAssignments"] as const,
    byShow: (showId: string) =>
      [...queryKeys.showRoleAssignments.all, showId] as const,
  },
};
