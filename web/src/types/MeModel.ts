export type Me = {
  id: string;
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  organizations?: Record<string, string>;
  idp_profile?: {
    name?: string;
  };
  pendingInvites?: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    roleId: number;
    roleName?: string;
    createdAt: string;
    expiresAt: string;
  }>;
};
