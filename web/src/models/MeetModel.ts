export type MeetModel = {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  organizerId?: string;
  organizerName?: string;
  imageUrl?: string;
  capacity?: number;
  waitlistSize?: number;
  allowGuests?: boolean;
  maxGuests?: number;
  shareCode?: string;
  currency?: string;
  currencySymbol?: string;
  costCents?: number | null;
  waitlistMessage?: string;
  confirmMessage?: string;
  rejectMessage?: string;
  statusId?: number;
};

export default MeetModel;
