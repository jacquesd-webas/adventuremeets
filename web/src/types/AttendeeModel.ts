import AttendeeStatusEnum from "./AttendeeStatusEnum";
import { MetaValue } from "./MetaValueModel";

export type Attendee = {
  id: string;
  meetId: string;
  userId?: string;
  status: AttendeeStatusEnum;
  sequence: number;
  respondedAt: string;
  notifiedAt?: string;
  name: string;
  phone?: string;
  email?: string;
  guests: number;
  guestOf?: string;
  isMinor?: boolean;
  guardianName?: string;
  indemnityAccepted: boolean;
  indemnityMinors?: string;
  paidFullAt?: string;
  paidDepositAt?: string;
  createdAt: string;
  updatedAt: string;
  metaValues: Array<MetaValue>;
};
