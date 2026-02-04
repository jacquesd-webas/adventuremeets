import MeetStatusEnum from "../types/MeetStatusEnum";
import { MeetActionsEnum } from "../types/MeetActionsEnum";

export function defaultPendingAction(
  statusId?: number | undefined | null,
): MeetActionsEnum | null {
  if (statusId === undefined || statusId === null) return null;
  switch (statusId) {
    case MeetStatusEnum.Draft:
      return MeetActionsEnum.Edit;
    case MeetStatusEnum.Published:
    case MeetStatusEnum.Open:
    case MeetStatusEnum.Closed:
    case MeetStatusEnum.Cancelled:
      return MeetActionsEnum.Details;
    case MeetStatusEnum.Completed:
      return MeetActionsEnum.Report;
    default:
      return null;
  }
}
