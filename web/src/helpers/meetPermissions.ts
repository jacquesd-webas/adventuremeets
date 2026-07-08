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
  const isOrganizerForMeet = Boolean(
    currentUserId && organizerId && currentUserId === organizerId,
  );

  return {
    isOrganizerForMeet,
    canManageMeet: isAdmin || isOrganizerForMeet,
    canViewMeet:
      currentOrganizationRole === "organizer" &&
      !isOrganizerForMeet &&
      !isAdmin,
  };
}
