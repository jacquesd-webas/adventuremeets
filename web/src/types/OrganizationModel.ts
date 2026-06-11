export type Organization = {
  id: string;
  name: string;
  logoUrl?: string;
  isPrivate?: boolean;
  theme?: string;
  canViewAllMeets?: boolean;
  customField1Name?: string;
  customField2Name?: string;
  userCount?: number;
  templateCount?: number;
  createdAt?: string;
  updatedAt?: string;
};
