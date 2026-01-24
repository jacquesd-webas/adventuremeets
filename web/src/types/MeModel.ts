export type Me = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organizations?: Record<string, string>;
  idp_profile?: {
    name?: string;
  };
};
