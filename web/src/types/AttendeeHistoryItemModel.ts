import AttendeeStatusEnum from "./AttendeeStatusEnum";

export type AttendeeHistoryItem = {
  meetId: string;
  date: string;
  meetName: string;
  attendeeStatus: AttendeeStatusEnum | string;
};
