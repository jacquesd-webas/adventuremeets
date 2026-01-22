import { MetaValue } from "./MetaValueModel";

export type Attendee = {
  id: string;
  meetId: string;
  status: string;
  sequence: number;
  respondedAt: string;
  name: string;
  phone?: string;
  email?: string;
  guests: number;
  indemnityAccepted: boolean;
  indemnityMinors?: string;
  createdAt: string;
  updatedAt: string;
  metaValues: Array<MetaValue>;
};
