import { MouseEvent, useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LinkIcon from "@mui/icons-material/Link";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import MeetActionsEnum from "../../types/MeetActionsEnum";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import { useLocation, useNavigate } from "react-router-dom";
import { isSameMeetDayOrLater } from "../../helpers/defaultPendingAction";
import {
  navigateToMeetCheckin,
  navigateToMeetSignup,
} from "../../helpers/meetNavigation";

type MeetActionsMenuProps = {
  meetId: string;
  statusId?: number;
  isUpcoming: boolean;
  startTime?: string | null;
  isOrganizer?: boolean;
  canViewMeet?: boolean;
  canManageMeet?: boolean;
  canAccessManageMenu?: boolean;
  setSelectedMeetId: (meetId: string | null) => void;
  setPendingAction: (action: MeetActionsEnum | null) => void;
  previewLinkCode?: string;
  menuButtonRef?: React.Ref<HTMLButtonElement>;
};

// Helper to decide what to show in the menu
const shouldShow = (
  action: MeetActionsEnum,
  statusId: number,
  isUpcoming: boolean,
  startTime?: string | null,
) => {
  switch (action) {
    case "create":
      return false;
    case "clone":
      return true;
    case "attendees":
      return (
        statusId === MeetStatusEnum.Open ||
        MeetStatusEnum.Closed ||
        MeetStatusEnum.Postponed ||
        MeetStatusEnum.Completed ||
        MeetStatusEnum.Cancelled
      );
    case "open":
      return (
        statusId === MeetStatusEnum.Published ||
        statusId === MeetStatusEnum.Closed
      );
    case "close":
      return statusId === MeetStatusEnum.Open;
    case "edit":
      return (
        statusId === MeetStatusEnum.Draft ||
        statusId === MeetStatusEnum.Published ||
        statusId === MeetStatusEnum.Open ||
        statusId === MeetStatusEnum.Closed ||
        statusId === MeetStatusEnum.Postponed
      );
    case "delete":
      return statusId === MeetStatusEnum.Draft;
    case "postpone":
      return (
        statusId === MeetStatusEnum.Closed || statusId === MeetStatusEnum.Open
      );
    case "cancel":
      return (
        statusId === MeetStatusEnum.Closed ||
        statusId === MeetStatusEnum.Open ||
        statusId === MeetStatusEnum.Postponed
      );
    case "checkin":
      return statusId === MeetStatusEnum.Closed;
    case "report":
      return (
        statusId === MeetStatusEnum.Completed ||
        (statusId === MeetStatusEnum.Closed &&
          (!isUpcoming ||
            isSameMeetDayOrLater({ startTime: startTime ?? undefined })))
      );
    case "preview":
      return (
        statusId === MeetStatusEnum.Draft ||
        statusId === MeetStatusEnum.Published
      );
    case "copy-link":
      return (
        statusId === MeetStatusEnum.Published ||
        statusId === MeetStatusEnum.Open ||
        statusId === MeetStatusEnum.Postponed
      );
    case "details":
      return true;
    case "apply":
      return statusId === MeetStatusEnum.Open;
  }
};

export function MeetActionsMenu({
  meetId,
  statusId,
  isUpcoming,
  startTime,
  canViewMeet,
  canManageMeet,
  canAccessManageMenu,
  setSelectedMeetId,
  setPendingAction,
  previewLinkCode,
  menuButtonRef,
}: MeetActionsMenuProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const nav = useNavigate();
  const location = useLocation();
  const canShowManageMenu = canAccessManageMenu ?? canManageMeet;

  // Undefined or status should not happen, if it does just render nothing
  if (!statusId) return null;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const runAfterMenuClose = (callback: () => void) => {
    if (!isMobile) {
      callback();
      return;
    }

    handleClose();
    window.setTimeout(callback, 225);
  };

  const handleCopyLink = async (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!previewLinkCode || typeof navigator === "undefined") {
      handleClose();
      return;
    }

    const shareUrl =
      typeof window === "undefined"
        ? `/share/${previewLinkCode}`
        : `${window.location.origin}/share/${previewLinkCode}`;

    await navigator.clipboard.writeText(shareUrl);
    handleClose();
  };

  const handleNavigateToSignup = (
    event: MouseEvent<HTMLElement>,
    isPreview = false,
  ) => {
    event.stopPropagation();
    if (previewLinkCode) {
      navigateToMeetSignup({
        shareCode: previewLinkCode,
        navigate: nav,
        isPreview,
      });
    }
    handleClose();
  };

  const handleAction = (
    event: MouseEvent<HTMLElement>,
    action: MeetActionsEnum,
    onAction?: (meetId: string) => void,
  ) => {
    event.stopPropagation();
    runAfterMenuClose(() => {
      if (meetId) setSelectedMeetId(meetId);
      setPendingAction(action);
      if (typeof onAction === "function") {
        onAction(meetId);
      }
    });
    if (!isMobile) {
      handleClose();
    }
  };

  const renderItems = () => (
    <>
      {canShowManageMenu ? (
        <>
          {shouldShow(
            MeetActionsEnum.Details,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Details)}
            >
              <ListItemIcon>
                <InfoOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                Meet{" "}
                {statusId === MeetStatusEnum.Completed ? "wall" : "details"}
              </ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Attendees,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) =>
                handleAction(event, MeetActionsEnum.Attendees)
              }
              disabled={!canManageMeet}
            >
              <ListItemIcon>
                <PeopleOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Attendees</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Edit,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Edit)}
            >
              <ListItemIcon>
                <EditOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Open, statusId, isUpcoming) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Open)}
              disabled={!canManageMeet}
            >
              <ListItemIcon>
                <LockOpenOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {statusId === MeetStatusEnum.Closed
                  ? "Re-open meet"
                  : "Open meet"}
              </ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Preview,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem onClick={(event) => handleNavigateToSignup(event, true)}>
              <ListItemIcon>
                <OpenInNewOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Preview</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.CopyLink,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem onClick={handleCopyLink}>
              <ListItemIcon>
                <LinkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Copy link</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Clone,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Clone)}
              disabled={!canManageMeet}
            >
              <ListItemIcon>
                <ContentCopyOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Create a copy</ListItemText>
            </MenuItem>
          )}

          {shouldShow(
            MeetActionsEnum.Checkin,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => {
                event.stopPropagation();
                if (meetId) {
                  navigateToMeetCheckin({
                    meetId,
                    navigate: nav,
                    returnTo: `${location.pathname}${location.search}`,
                  });
                }
                handleClose();
              }}
              disabled={!canManageMeet}
            >
              <ListItemIcon>
                <FactCheckOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Check-in</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Close,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Close)}
              disabled={!canManageMeet}
            >
              <ListItemIcon>
                <FactCheckOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Close meet</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Postpone,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Postpone)}
              disabled={!canManageMeet}
            >
              <ListItemIcon>
                <PauseCircleOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Postpone</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Cancel,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Cancel)}
              disabled={!canManageMeet}
            >
              <ListItemIcon>
                <BlockOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cancel meet</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Report,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Report)}
            >
              <ListItemIcon>
                <AssessmentOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Generate Report</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Delete,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Delete)}
              disabled={!canManageMeet}
            >
              <ListItemIcon>
                <DeleteOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </>
      ) : canViewMeet ? (
        <>
          {shouldShow(
            MeetActionsEnum.Details,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Details)}
            >
              <ListItemIcon>
                <InfoOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                Meet{" "}
                {statusId === MeetStatusEnum.Completed ? "wall" : "details"}
              </ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.CopyLink,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem onClick={handleCopyLink}>
              <ListItemIcon>
                <LinkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Copy link</ListItemText>
            </MenuItem>
          )}
        </>
      ) : (
        <>
          {shouldShow(
            MeetActionsEnum.Details,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem
              onClick={(event) => handleAction(event, MeetActionsEnum.Details)}
            >
              <ListItemIcon>
                <InfoOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Meet details</ListItemText>
            </MenuItem>
          )}
          {shouldShow(
            MeetActionsEnum.Apply,
            statusId,
            isUpcoming,
            startTime,
          ) && (
            <MenuItem onClick={(event) => handleNavigateToSignup(event, false)}>
              <ListItemIcon>
                <HowToRegOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Apply to meet</ListItemText>
            </MenuItem>
          )}
        </>
      )}
    </>
  );

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        ref={menuButtonRef}
        sx={{
          color:
            theme.palette.mode === "dark"
              ? theme.palette.grey[200]
              : theme.palette.text.primary,
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      {!isMobile && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          onClick={(event) => event.stopPropagation()}
        >
          {renderItems()}
        </Menu>
      )}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: { borderTopLeftRadius: 12, borderTopRightRadius: 12, pb: 1 },
          }}
        >
          <Box
            sx={{ width: "100%", maxWidth: 480, mx: "auto", pt: 1 }}
            onClick={(event) => event.stopPropagation()}
          >
            {renderItems()}
          </Box>
        </Drawer>
      )}
    </>
  );
}
