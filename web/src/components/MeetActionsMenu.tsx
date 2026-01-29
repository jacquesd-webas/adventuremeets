import { MouseEvent, useEffect, useState } from "react";
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import MeetActionsEnum from "../types/MeetActionsEnum";
import MeetStatusEnum from "../types/MeetStatusEnum";
import { useNavigate } from "react-router-dom";
import { useCurrentOrganization } from "../context/OrganizationContext";

type MeetActionsMenuProps = {
  meetId: string;
  statusId?: number;
  isOrganizer?: boolean;
  setSelectedMeetId: (meetId: string | null) => void;
  setPendingAction: (action: MeetActionsEnum | null) => void;
  previewLinkCode?: string;
};

// Helper to decide what to show in the menu
const shouldShow = (action: MeetActionsEnum, statusId: number) => {
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
      return statusId === MeetStatusEnum.Completed;
    case "preview":
      return (
        statusId === MeetStatusEnum.Published ||
        statusId === MeetStatusEnum.Open ||
        statusId === MeetStatusEnum.Closed
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
  isOrganizer,
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

  // If the viewport switches while a menu is open, convert to the appropriate UI.
  useEffect(() => {
    if (isMobile && open) {
      setAnchorEl(null);
      setDrawerOpen(true);
    }
    if (!isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [isMobile, open, drawerOpen]);

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
    action: MeetActionsEnum,
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
      action: MeetActionsEnum,
      handler?: (id: string) => void
    ) => void
  ) => (
    <>
      {!isOrganizer ? (
        <>
          {shouldShow(MeetActionsEnum.Details, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Details)
              }
            >
              <ListItemIcon>
                <InfoOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Meet details</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Apply, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(
                  event,
                  MeetActionsEnum.Apply,
                  () => {
                    if (previewLinkCode) {
                      window.open(
                        `/meets/${previewLinkCode}`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }
                )
              }
            >
              <ListItemIcon>
                <HowToRegOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Apply to meet</ListItemText>
            </MenuItem>
          )}
        </>
      ) : (
        <>
          {shouldShow(MeetActionsEnum.Details, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Details)
              }
            >
              <ListItemIcon>
                <InfoOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Meet details</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Attendees, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Attendees)
              }
            >
              <ListItemIcon>
                <PeopleOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Attendees</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Open, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Open)
              }
            >
              <ListItemIcon>
                <LockOpenOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Open meet</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Preview, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(
                  event,
                  MeetActionsEnum.Preview,
                  () => {
                    if (previewLinkCode) {
                      window.open(
                        `/meets/${previewLinkCode}?preview=true`,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }
                )
              }
            >
              <ListItemIcon>
                <OpenInNewOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Preview</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Edit, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Edit)
              }
            >
              <ListItemIcon>
                <EditOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Checkin, statusId) && (
            <MenuItem
              onClick={(event) => {
                event.stopPropagation();
                if (meetId) {
                  nav(`/meet/${meetId}/checkin`);
                }
                handleClose();
              }}
            >
              <ListItemIcon>
                <FactCheckOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Check-in</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Close, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Close)
              }
            >
              <ListItemIcon>
                <FactCheckOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Close meet</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Postpone, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Postpone)
              }
            >
              <ListItemIcon>
                <PauseCircleOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Postpone</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Cancel, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Cancel)
              }
            >
              <ListItemIcon>
                <BlockOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cancel meet</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Report, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Report)
              }
            >
              <ListItemIcon>
                <AssessmentOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Generate Report</ListItemText>
            </MenuItem>
          )}
          {shouldShow(MeetActionsEnum.Delete, statusId) && (
            <MenuItem
              onClick={(event) =>
                (onItemClick || handleAction)(event, MeetActionsEnum.Delete)
              }
            >
              <ListItemIcon>
                <DeleteOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
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
