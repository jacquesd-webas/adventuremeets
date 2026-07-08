import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ConfirmCloseMeetDialog } from "../confirmDialogs/ConfirmCloseMeetDialog";
import { ConfirmCancelMeetDialog } from "../confirmDialogs/ConfirmCancelMeetDialog";
import { ConfirmOpenMeetDialog } from "../confirmDialogs/ConfirmOpenMeetDialog";
import { ConfirmPostponeMeetDialog } from "../confirmDialogs/ConfirmPostponeMeetDialog";
import { ConfirmDeleteMeetDialog } from "../confirmDialogs/ConfirmDeleteMeetDialog";
import { ConfirmCloneMeetDialog } from "../confirmDialogs/ConfirmCloneMeetDialog";

import { CreateMeetModal } from "../createMeetModal/CreateMeetModal";
import { ManageAttendeesModal } from "../manageAttendeesModal/ManageAttendeesModal";
import { ReportsModal } from "../reportsModal/ReportsModal";
import MeetActionsEnum from "../../types/MeetActionsEnum";
import { MeetInfoModal } from "../meet/MeetInfoModal";
import {
  clearCreateMeetPreviewRestore,
  readCreateMeetPreviewRestore,
} from "../createMeetModal/createMeetPreviewRestore";

type MeetActionsDialogsProps = {
  meetId: string | null;
  isOrganizer?: boolean;
  canViewMeet?: boolean;
  canManageMeet?: boolean;
  pendingAction?: MeetActionsEnum | null;
  setPendingAction: (action: MeetActionsEnum | null) => void;
  setSelectedMeetId: (meetId: string | null) => void;
  onActionConfirm?: (
    action: MeetActionsEnum,
    meetId: string | null,
  ) => Promise<void> | void;
};

function MeetActionsDialogs({
  meetId,
  isOrganizer,
  canViewMeet,
  canManageMeet,
  pendingAction,
  setPendingAction,
  setSelectedMeetId,
  onActionConfirm,
}: MeetActionsDialogsProps) {
  const nav = useNavigate();
  const location = useLocation();
  const [isCloseDialogOpen, setIsCloseDialogOpen] = React.useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = React.useState(false);
  const [isPostponeDialogOpen, setIsPostponeDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = React.useState(false);

  const [showMeetInfoModal, setShowMeetInfoModal] = React.useState(false);
  const [showMeetModal, setShowMeetModal] = React.useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = React.useState(false);
  const [showReportsModal, setShowReportsModal] = React.useState(false);

  const anyOpen =
    isCloseDialogOpen ||
    isCancelDialogOpen ||
    isOpenDialogOpen ||
    isPostponeDialogOpen ||
    isDeleteDialogOpen ||
    isCloneDialogOpen ||
    showMeetModal ||
    showMeetInfoModal ||
    showAttendeesModal ||
    showReportsModal;

  // Prevent background scroll when any dialog/modal is open
  useEffect(() => {
    if (!anyOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [anyOpen]);

  // Retore key from doing something we need to come back to
  const restore = readCreateMeetPreviewRestore();

  // Common handler to close dialogs and reset state
  const handleClose = () => {
    switch (pendingAction) {
      case MeetActionsEnum.Create:
        setShowMeetModal(false);
        break;
      case MeetActionsEnum.Edit:
        setShowMeetModal(false);
        break;
      case MeetActionsEnum.Attendees:
        setShowAttendeesModal(false);
        break;
      case MeetActionsEnum.Report:
        setShowReportsModal(false);
        break;
      case MeetActionsEnum.Checkin:
        setShowAttendeesModal(false);
        break;
      case MeetActionsEnum.Close:
        setIsCloseDialogOpen(false);
        break;
      case MeetActionsEnum.Cancel:
        setIsCancelDialogOpen(false);
        break;
      case MeetActionsEnum.Open:
        setIsOpenDialogOpen(false);
        break;
      case MeetActionsEnum.Postpone:
        setIsPostponeDialogOpen(false);
        break;
      case MeetActionsEnum.Delete:
        setIsDeleteDialogOpen(false);
        break;
      case MeetActionsEnum.Clone:
        setIsCloneDialogOpen(false);
        break;
      case MeetActionsEnum.Details:
        setShowMeetInfoModal(false);
        break;
      default:
        break;
    }
    setPendingAction(null);
    setSelectedMeetId(null);
  };

  // Open the dialog when we have something to do
  useEffect(() => {
    if (restore?.meetId) {
      setPendingAction(MeetActionsEnum.Edit);
      setSelectedMeetId(restore.meetId);
      clearCreateMeetPreviewRestore();
      return;
    }
  }, [restore, setPendingAction, setSelectedMeetId]);

  useEffect(() => {
    switch (pendingAction) {
      case "create":
        setSelectedMeetId(null);
        setShowMeetModal(true);
        break;
      case "attendees":
        setShowAttendeesModal(true);
        break;
      case "report":
        setShowReportsModal(true);
        break;
      case "edit":
        setShowMeetModal(true);
        break;
      case "checkin":
        if (meetId) {
          nav(`/meet/${meetId}/checkin`, {
            state: {
              returnTo: `${location.pathname}${location.search}`,
            },
          });
          setPendingAction(null);
          setSelectedMeetId(null);
        }
        break;
      case "close":
        setIsCloseDialogOpen(true);
        break;
      case "cancel":
        setIsCancelDialogOpen(true);
        break;
      case "open":
        setIsOpenDialogOpen(true);
        break;
      case "postpone":
        setIsPostponeDialogOpen(true);
        break;
      case "delete":
        setIsDeleteDialogOpen(true);
        break;
      case "clone":
        setIsCloneDialogOpen(true);
        break;
      case "preview":
        // redirects to preview page
        break;
      case "details":
        setShowMeetInfoModal(true);
        break;
      case "apply":
        // redirects to apply page
        break;
      default:
        break;
    }
  }, [
    location.pathname,
    location.search,
    meetId,
    nav,
    onActionConfirm,
    pendingAction,
    setPendingAction,
    setSelectedMeetId,
  ]);

  // If we have a callback for confirming the action, call it now
  const handleConfirm = async () => {
    if (pendingAction && onActionConfirm) {
      await onActionConfirm(pendingAction, meetId);
    }
    handleClose();
  };

  return (
    <>
      <ConfirmCloseMeetDialog
        open={isCloseDialogOpen}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmCancelMeetDialog
        open={isCancelDialogOpen}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmOpenMeetDialog
        open={isOpenDialogOpen}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmPostponeMeetDialog
        open={isPostponeDialogOpen}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmDeleteMeetDialog
        open={isDeleteDialogOpen}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmCloneMeetDialog
        open={isCloneDialogOpen}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />

      <CreateMeetModal
        open={showMeetModal}
        meetId={meetId}
        canViewMeet={canViewMeet}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        onClose={() => {
          setShowMeetModal(false);
          setSelectedMeetId(null);
          setPendingAction(null);
        }}
      />
      <ManageAttendeesModal
        open={showAttendeesModal}
        meetId={meetId}
        canViewMeet={canViewMeet}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        onClose={() => {
          setShowAttendeesModal(false);
          setSelectedMeetId(null);
          setPendingAction(null);
        }}
      />
      <ReportsModal
        open={showReportsModal}
        meetId={meetId}
        canViewMeet={canViewMeet}
        canManageMeet={canManageMeet}
        isOrganizer={isOrganizer}
        onClose={() => {
          setShowReportsModal(false);
          setSelectedMeetId(null);
          setPendingAction(null);
        }}
      />

      <MeetInfoModal
        open={showMeetInfoModal}
        meetId={meetId}
        onClose={() => {
          setShowMeetInfoModal(false);
          setSelectedMeetId(null);
          setPendingAction(null);
        }}
      />
    </>
  );
}

export { MeetActionsDialogs };
