export type Me = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organizationIds?: string[];
  roles?: string[];
  idp_profile?: {
    name?: string;
  };
};
