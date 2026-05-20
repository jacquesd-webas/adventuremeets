export type MeetPermissionsInput = {
  currentUserId?: string | null;
  currentOrganizationRole?: string | null;
  organizerId?: string | null;
};

export function getMeetPermissions({
  currentUserId,
  currentOrganizationRole,
  organizerId,
}: MeetPermissionsInput) {
  const isAdmin = currentOrganizationRole === "admin";
  const isOrganizer = currentOrganizationRole === "organizer";
  const isMember = currentOrganizationRole === "member";
  const isOrganizerForMeet = Boolean(
    currentUserId && organizerId && currentUserId === organizerId,
  );

  return {
    isOrganizerForMeet,
    canManageMeet: isAdmin || isOrganizerForMeet,
    canViewMeet: isAdmin || isOrganizer || isMember,
  };
}
