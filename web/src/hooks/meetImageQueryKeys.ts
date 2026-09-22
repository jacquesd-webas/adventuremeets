export const meetImageQueryKeys = {
  all: ["meet-images"] as const,
  list: (meetId?: string | null) => ["meet-images", meetId] as const,
};
