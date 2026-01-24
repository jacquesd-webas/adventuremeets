import { ApiProperty } from "@nestjs/swagger";

export class UserProfile {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  icePhone?: string;

  @ApiProperty({ required: false })
  iceName?: string;

  @ApiProperty({ required: false })
  iceMedicalAid?: string;

  @ApiProperty({ required: false })
  iceMedicalAidNumber?: string;

  @ApiProperty({ required: false })
  iceDob?: string;

  @ApiProperty({
    required: false,
    type: "object",
    additionalProperties: { type: "string" },
  })
  organizations?: Record<string, string>;

  constructor() {
    this.organizations = {};
    this.hasRole = this.hasRole.bind(this);
    this.getOrganizationIds = this.getOrganizationIds.bind(this);
  }

  // Internal use only; not exposed in /me response.
  passwordHash?: string;

  hasRole = (
    organizationId: string,
    requiredRole: "member" | "organizer" | "admin"
  ): boolean => {
    if (!this.organizations || !this.organizations[organizationId]) {
      return false;
    }
    const userRole = this.organizations[organizationId];
    if (requiredRole === "member") {
      return (
        userRole === "member" ||
        userRole === "organizer" ||
        userRole === "admin"
      );
    }
    if (requiredRole === "organizer") {
      return userRole === "organizer" || userRole === "admin";
    }

    return this.organizations[organizationId] === requiredRole;
  };

  getOrganizationIds = (
    minRole?: "member" | "organizer" | "admin"
  ): string[] => {
    // admin
    if (minRole === "admin") {
      return Object.entries(this.organizations || {})
        .filter(([_, r]) => r === "admin")
        .map(([id, _]) => id);
    }
    // organizer
    if (minRole === "organizer") {
      return Object.entries(this.organizations || {})
        .filter(([_, r]) => r === "organizer" || r === "admin")
        .map(([id, _]) => id);
    }
    // member
    return Object.entries(this.organizations || {})
      .filter(([_, r]) => r === "member" || r === "organizer" || r === "admin")
      .map(([id, _]) => id);
  };
}
