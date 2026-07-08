import MeetStatusEnum from "../types/MeetStatusEnum";
import { MeetActionsEnum } from "../types/MeetActionsEnum";

export function defaultPendingAction(
  statusId?: number | undefined | null,
  isOrganizer = false,
): MeetActionsEnum | null {
  if (statusId === undefined || statusId === null) return null;
  switch (statusId) {
    case MeetStatusEnum.Draft:
    case MeetStatusEnum.Postponed:
      if (isOrganizer) return MeetActionsEnum.Edit;
      return null;
    case MeetStatusEnum.Published:
    case MeetStatusEnum.Open:
    case MeetStatusEnum.Closed:
    case MeetStatusEnum.Cancelled:
      if (isOrganizer) return MeetActionsEnum.Attendees;
      return MeetActionsEnum.Details;
    case MeetStatusEnum.Completed:
      return MeetActionsEnum.Report;
    default:
      return null;
  }
}
