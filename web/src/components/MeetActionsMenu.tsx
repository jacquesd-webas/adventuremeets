import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
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

type MeetActionsMenuProps = {
  meetId: string;
  statusId?: number;
  onEdit?: (meetId: string) => void;
  onPreview?: (meetId: string) => void;
  onDelete?: (meetId: string) => void;
  onAttendees?: (meetId: string) => void;
  onReports?: (meetId: string) => void;
  onPostpone?: (meetId: string) => void;
  onOpen?: (meetId: string) => void;
  onCheckin?: (meetId: string) => void;
  onCloseMeet?: (meetId: string) => void;
};

// Allow editing for draft, published, postponed, and open meets
const shouldShowEdit = (statusId?: number) => statusId === 1 || statusId === 2 || statusId === 3 || statusId === 6;
const shouldShowAttendees = (statusId?: number) => statusId === 3;
const shouldShowReports = (statusId?: number) => statusId === 5 || statusId === 7;
const isDraft = (statusId?: number) => statusId === 1;
const isPublished = (statusId?: number) => statusId === 2;
const isOpen = (statusId?: number) => statusId === 3;
const isClosed = (statusId?: number) => statusId === 4;
const isCompleted = (statusId?: number) => statusId === 7;

export function MeetActionsMenu({
  meetId,
  statusId,
  onEdit,
  onPreview,
  onDelete,
  onAttendees,
  onReports,
  onPostpone,
  onOpen,
  onCheckin,
  onCloseMeet
}: MeetActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleAction = (event: MouseEvent<HTMLElement>, action?: (meetId: string) => void) => {
    event.stopPropagation();
    if (action) {
      action(meetId);
    }
    handleClose();
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        onClick={(event) => event.stopPropagation()}
      >
        {isPublished(statusId) ? (
          <MenuItem onClick={(event) => handleAction(event, onOpen)}>
            <ListItemIcon>
              <LockOpenOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Open meet</ListItemText>
          </MenuItem>
        ) : null}
        {!isCompleted(statusId) && (shouldShowAttendees(statusId) || isClosed(statusId)) ? (
          <MenuItem onClick={(event) => handleAction(event, onAttendees)}>
            <ListItemIcon>
              <PeopleOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Attendees</ListItemText>
          </MenuItem>
        ) : null}
        {!isCompleted(statusId) && shouldShowEdit(statusId) ? (
          <MenuItem onClick={(event) => handleAction(event, onEdit)}>
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        ) : null}
        {!isCompleted(statusId) && isClosed(statusId) ? (
          <MenuItem onClick={(event) => handleAction(event, onCheckin)}>
            <ListItemIcon>
              <FactCheckOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Check-in</ListItemText>
          </MenuItem>
        ) : null}
        {!isCompleted(statusId) && isOpen(statusId) ? (
          <MenuItem onClick={(event) => handleAction(event, onPostpone)}>
            <ListItemIcon>
              <PauseCircleOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Postpone</ListItemText>
          </MenuItem>
        ) : null}
        {!isCompleted(statusId) && isOpen(statusId) ? (
          <MenuItem onClick={(event) => handleAction(event, onCloseMeet)}>
            <ListItemIcon>
              <BlockOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Close meet</ListItemText>
          </MenuItem>
        ) : null}
        {!isCompleted(statusId) && isClosed(statusId) ? (
          <MenuItem onClick={(event) => handleAction(event, onPostpone)}>
            <ListItemIcon>
              <PauseCircleOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Postpone</ListItemText>
          </MenuItem>
        ) : null}
        {shouldShowReports(statusId) ? (
          <MenuItem onClick={(event) => handleAction(event, onReports)}>
            <ListItemIcon>
              <AssessmentOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reports</ListItemText>
          </MenuItem>
        ) : null}
        {!isCompleted(statusId) && (isPublished(statusId) || isOpen(statusId)) ? (
          <MenuItem onClick={(event) => handleAction(event, onPreview)}>
            <ListItemIcon>
              <OpenInNewOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Preview</ListItemText>
          </MenuItem>
        ) : null}
        {!isCompleted(statusId) && (isPublished(statusId) || isOpen(statusId) || isDraft(statusId) || isClosed(statusId)) ? (
          <MenuItem onClick={(event) => handleAction(event, onDelete)}>
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{isDraft(statusId) ? "Delete" : "Cancel"}</ListItemText>
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}
