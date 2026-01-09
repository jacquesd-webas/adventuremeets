import React, { useEffect } from "react";
import { ConfirmCloseMeetDialog } from "./confirmActions/ConfirmCloseMeetDialog";
import { ConfirmCancelMeetDialog } from "./confirmActions/ConfirmCancelMeetDialog";
import { ConfirmOpenMeetDialog } from "./confirmActions/ConfirmOpenMeetDialog";
import { ConfirmPostponeMeetDialog } from "./confirmActions/ConfirmPostponeMeetDialog";
import { ConfirmDeleteMeetDialog } from "./confirmActions/ConfirmDeleteMeetDialog";

import { CreateMeetModal } from "./createMeetModal/CreateMeetModal";
import { ManageAttendeesModal } from "./manageAttendeesModal";
import { ReportsModal } from "./reportsModal";

export type PendingAction =
  | "close"
  | "cancel"
  | "open"
  | "postpone"
  | "delete"
  | "create"
  | "attendees"
  | "checkin"
  | "edit"
  | "report"
  | "preview";

type MeetActionsDialogsProps = {
  meetId: string | null;
  pendingAction?: PendingAction;
  setPendingAction: (action: PendingAction | null) => void;
  setSelectedMeetId: (meetId: string | null) => void;
  onActionConfirm?: (
    action: PendingAction,
    meetId: string | null
  ) => Promise<void> | void;
};

function MeetActionsDialogs({
  meetId,
  pendingAction,
  setPendingAction,
  setSelectedMeetId,
  onActionConfirm,
}: MeetActionsDialogsProps) {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = React.useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = React.useState(false);
  const [isPostponeDialogOpen, setIsPostponeDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const [showMeetModal, setShowMeetModal] = React.useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = React.useState(false);
  const [showReportsModal, setShowReportsModal] = React.useState(false);

  const anyOpen =
    isCloseDialogOpen ||
    isCancelDialogOpen ||
    isOpenDialogOpen ||
    isPostponeDialogOpen ||
    isDeleteDialogOpen ||
    showMeetModal ||
    showAttendeesModal ||
    showReportsModal;

  // Prevent background scroll when any dialog/modal is open
  React.useEffect(() => {
    if (!anyOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [anyOpen]);

  // Common handler to close dialogs and reset state
  const handleClose = () => {
    switch (pendingAction) {
      case "create":
        setShowMeetModal(false);
        break;
      case "edit":
        setShowMeetModal(false);
        break;
      case "attendees":
        setShowAttendeesModal(false);
        break;
      case "report":
        setShowReportsModal(false);
        break;
      case "close":
        setIsCloseDialogOpen(false);
        break;
      case "cancel":
        setIsCancelDialogOpen(false);
        break;
      case "open":
        setIsOpenDialogOpen(false);
        break;
      case "postpone":
        setIsPostponeDialogOpen(false);
        break;
      case "delete":
        setIsDeleteDialogOpen(false);
        break;
      case "preview":
        break;
      case "checkin":
        break;
      default:
        break;
    }
    setPendingAction(null);
    setSelectedMeetId(null);
  };

  // Open the dialog when we have something to do
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
      case "preview":
        break;
      case "checkin":
        if (onActionConfirm) {
          onActionConfirm(pendingAction, meetId);
        }
        setPendingAction(null);
        break;
      default:
        break;
    }
  }, [pendingAction, meetId, onActionConfirm]);

  // For now this is just closing the dialog
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
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmCancelMeetDialog
        open={isCancelDialogOpen}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmOpenMeetDialog
        open={isOpenDialogOpen}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmPostponeMeetDialog
        open={isPostponeDialogOpen}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <ConfirmDeleteMeetDialog
        open={isDeleteDialogOpen}
        meetId={meetId}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />

      <CreateMeetModal
        open={showMeetModal}
        meetId={meetId}
        onClose={() => {
          setShowMeetModal(false);
          setSelectedMeetId(null);
          setPendingAction(null);
        }}
      />
      <ManageAttendeesModal
        open={showAttendeesModal}
        meetId={meetId}
        onClose={() => {
          setShowAttendeesModal(false);
          setSelectedMeetId(null);
          setPendingAction(null);
        }}
      />
      <ReportsModal
        open={showReportsModal}
        meetId={meetId}
        onClose={() => {
          setShowReportsModal(false);
          setSelectedMeetId(null);
          setPendingAction(null);
        }}
      />
    </>
  );
}

export { MeetActionsDialogs };
