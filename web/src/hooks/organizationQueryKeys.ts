export const organizationQueryKeys = {
  all: ["organization"] as const,
  detail: (organizationId?: string) =>
    ["organization", organizationId] as const,
  whatsapp: (organizationId?: string) =>
    ["organization", organizationId, "whatsapp"] as const,
};
