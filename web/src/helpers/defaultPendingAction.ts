import MeetStatusEnum from "../models/MeetStatusEnum";
import { PendingAction } from "../components/MeetActionsDialogs";

export function defaultPendingAction(
  statusId?: number | undefined | null
): PendingAction | null {
  if (statusId === undefined || statusId === null) return null;
  switch (statusId) {
    case MeetStatusEnum.Draft:
      return "edit";
    case MeetStatusEnum.Published:
    case MeetStatusEnum.Open:
      return "attendees";
    case MeetStatusEnum.Closed:
    case MeetStatusEnum.Cancelled:
    case MeetStatusEnum.Completed:
      return "report";
    default:
      return null;
  }
}
