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
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import { MouseEvent, useState } from "react";
import { PendingAction } from "./MeetActionsDialogs";
import MeetStatusEnum from "../models/MeetStatusEnum";
import { useNavigate } from "react-router-dom";

type MeetActionsMenuProps = {
  meetId: string;
  statusId?: number;
  setSelectedMeetId: (meetId: string | null) => void;
  setPendingAction: (action: PendingAction | null) => void;
  previewLinkCode?: string;
};

// Helper to decide what to show in the menu
const shouldShow = (action: PendingAction, statusId: number) => {
  switch (action) {
    case "create":
      return false;
    case "attendees":
      return (
        statusId === MeetStatusEnum.Open ||
        MeetStatusEnum.Closed ||
        MeetStatusEnum.Postponed ||
        MeetStatusEnum.Completed ||
        MeetStatusEnum.Cancelled
      );
    case "open":
      return statusId === MeetStatusEnum.Published;
    case "close":
      return statusId === MeetStatusEnum.Open;
    case "edit":
      return (
        statusId === MeetStatusEnum.Draft ||
        statusId === MeetStatusEnum.Published ||
        statusId === MeetStatusEnum.Open ||
        statusId === MeetStatusEnum.Postponed
      );
    case "delete":
      return statusId === MeetStatusEnum.Draft;
    case "postpone":
      return statusId === MeetStatusEnum.Closed || MeetStatusEnum.Open;
    case "cancel":
      return (
        statusId === MeetStatusEnum.Closed ||
        MeetStatusEnum.Open ||
        MeetStatusEnum.Postponed
      );
    case "checkin":
      return statusId === MeetStatusEnum.Closed;
    case "report":
      return statusId === MeetStatusEnum.Completed;
    case "preview":
      return (
        statusId === MeetStatusEnum.Published ||
        statusId === MeetStatusEnum.Open ||
        statusId === MeetStatusEnum.Closed
      );
  }
};

export function MeetActionsMenu({
  meetId,
  statusId,
  setSelectedMeetId,
  setPendingAction,
  previewLinkCode,
}: MeetActionsMenuProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const nav = useNavigate();

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (isMobile) {
      setDrawerOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setDrawerOpen(false);
  };

  const handleAction = (
    event: MouseEvent<HTMLElement>,
    action: PendingAction,
    onAction?: (meetId: string) => void
  ) => {
    event.stopPropagation();
    if (meetId) setSelectedMeetId(meetId);
    setPendingAction(action);
    if (typeof onAction === "function") {
      onAction(meetId);
    }
    handleClose();
  };

  const renderItems = (
    onItemClick?: (
      event: MouseEvent<HTMLElement>,
      action: PendingAction,
      handler?: (id: string) => void
    ) => void
  ) => (
    <>
      {shouldShow("attendees", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "attendees")}>
          <ListItemIcon>
            <PeopleOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Attendees</ListItemText>
        </MenuItem>
      )}
      {shouldShow("open", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "open")}>
          <ListItemIcon>
            <LockOpenOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open meet</ListItemText>
        </MenuItem>
      )}
      {shouldShow("preview", statusId) && (
        <MenuItem
          onClick={(event) =>
            (onItemClick || handleAction)(event, "preview", () => {
              if (previewLinkCode) nav(`/meets/${previewLinkCode}?preview=true`);
            })
          }
        >
          <ListItemIcon>
            <OpenInNewOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
      )}
      {shouldShow("edit", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "edit")}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
      )}
      {shouldShow("checkin", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "checkin")}>
          <ListItemIcon>
            <FactCheckOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Check-in</ListItemText>
        </MenuItem>
      )}
      {shouldShow("close", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "close")}>
          <ListItemIcon>
            <FactCheckOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Close meet</ListItemText>
        </MenuItem>
      )}
      {shouldShow("postpone", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "postpone")}>
          <ListItemIcon>
            <PauseCircleOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Postpone</ListItemText>
        </MenuItem>
      )}
      {shouldShow("cancel", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "cancel")}>
          <ListItemIcon>
            <BlockOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cancel meet</ListItemText>
        </MenuItem>
      )}
      {shouldShow("report", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "report")}>
          <ListItemIcon>
            <AssessmentOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reports</ListItemText>
        </MenuItem>
      )}
      {shouldShow("delete", statusId) && (
        <MenuItem onClick={(event) => (onItemClick || handleAction)(event, "delete")}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      )}
    </>
  );

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
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
          open={drawerOpen}
          onClose={handleClose}
          PaperProps={{
            sx: { borderTopLeftRadius: 12, borderTopRightRadius: 12, pb: 1 },
          }}
        >
          <Box
            sx={{ width: "100%", maxWidth: 480, mx: "auto", pt: 1 }}
            onClick={(event) => event.stopPropagation()}
          >
            {renderItems(handleAction)}
          </Box>
        </Drawer>
      )}
    </>
  );
}
