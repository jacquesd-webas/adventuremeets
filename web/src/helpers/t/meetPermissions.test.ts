import { getMeetPermissions } from "../meetPermissions";

describe("getMeetPermissions", () => {
  it("allows members to view meets", () => {
    expect(
      getMeetPermissions({
        currentUserId: "user-1",
        currentOrganizationRole: "member",
        organizerId: "organizer-1",
      }),
    ).toEqual({
      isOrganizerForMeet: false,
      canAccessManageMenu: false,
      canManageMeet: false,
      canViewMeet: true,
    });
  });

  it("allows the meet organizer to manage their own meet", () => {
    expect(
      getMeetPermissions({
        currentUserId: "organizer-1",
        currentOrganizationRole: "member",
        organizerId: "organizer-1",
      }),
    ).toEqual({
      isOrganizerForMeet: true,
      canAccessManageMenu: true,
      canManageMeet: true,
      canViewMeet: true,
    });
  });

  it("allows organizers to view other meets without manage access", () => {
    expect(
      getMeetPermissions({
        currentUserId: "user-1",
        currentOrganizationRole: "organizer",
        organizerId: "organizer-2",
      }),
    ).toEqual({
      isOrganizerForMeet: false,
      canAccessManageMenu: true,
      canManageMeet: false,
      canViewMeet: true,
    });
  });

  it("allows admins to manage and view meets", () => {
    expect(
      getMeetPermissions({
        currentUserId: "user-1",
        currentOrganizationRole: "admin",
        organizerId: "organizer-2",
      }),
    ).toEqual({
      isOrganizerForMeet: false,
      canAccessManageMenu: true,
      canManageMeet: true,
      canViewMeet: true,
    });
  });
});
