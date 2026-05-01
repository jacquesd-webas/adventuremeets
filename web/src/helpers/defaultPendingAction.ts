import Meet from "../types/MeetModel";
import MeetStatusEnum from "../types/MeetStatusEnum";
import { MeetActionsEnum } from "../types/MeetActionsEnum";

type DefaultPendingActionOptions = {
  canManageMeet?: boolean;
};

function isSameMeetDayOrLater(meet?: Pick<Meet, "startTime"> | null) {
  if (!meet?.startTime) {
    return false;
  }

  const meetDate = new Date(meet.startTime);
  if (Number.isNaN(meetDate.getTime())) {
    return false;
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const meetDayStart = new Date(
    meetDate.getFullYear(),
    meetDate.getMonth(),
    meetDate.getDate(),
  );

  return todayStart >= meetDayStart;
}

export function defaultPendingAction(
  statusId?: number | undefined | null,
  isOrganizer = false,
  meet?: Pick<Meet, "startTime"> | null,
  options: DefaultPendingActionOptions = {},
): MeetActionsEnum | null {
  const canManageMeet = Boolean(options.canManageMeet ?? isOrganizer);

  if (statusId === undefined || statusId === null) return null;
  switch (statusId) {
    case MeetStatusEnum.Draft:
    case MeetStatusEnum.Postponed:
      if (isOrganizer) return MeetActionsEnum.Edit;
      return null;
    case MeetStatusEnum.Published:
    case MeetStatusEnum.Open:
    case MeetStatusEnum.Cancelled:
      if (isOrganizer) return MeetActionsEnum.Attendees;
      return MeetActionsEnum.Details;
    case MeetStatusEnum.Closed:
      if (canManageMeet && isSameMeetDayOrLater(meet)) {
        return MeetActionsEnum.Checkin;
      }
      if (isOrganizer) return MeetActionsEnum.Attendees;
      return MeetActionsEnum.Details;
    case MeetStatusEnum.Completed:
      return MeetActionsEnum.Details;
    default:
      return null;
  }
}
