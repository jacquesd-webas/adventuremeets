export type Organization = {
  id: string;
  name: string;
  isPrivate?: boolean;
  theme?: string;
  canViewAllMeets?: boolean;
  userCount?: number;
  templateCount?: number;
  createdAt?: string;
  updatedAt?: string;
};
