import { useState, MouseEvent } from "react";
import { IconButton, Menu, MenuItem, ListItemText } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Link as RouterLink } from "react-router-dom";

type OrganizationActionsProps = {
  organizationId: string;
  disabled?: boolean;
  onEdit?: (organizationId: string) => void;
  onDelete?: (organizationId: string) => void;
};

export function OrganizationActions({
  organizationId,
  disabled = false,
  onEdit,
  onDelete,
}: OrganizationActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleClose();
    onEdit?.(organizationId);
  };

  const handleDelete = () => {
    handleClose();
    onDelete?.(organizationId);
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        aria-label="Organization actions"
        disabled={disabled}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={isOpen} onClose={handleClose}>
        <MenuItem
          component={RouterLink}
          to={`/admin/organizations/${organizationId}/members`}
          onClick={handleClose}
          disabled={disabled}
        >
          <ListItemText>Manage Users</ListItemText>
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to={`/admin/organizations/${organizationId}/templates`}
          onClick={handleClose}
          disabled={disabled}
        >
          <ListItemText>Manage Templates</ListItemText>
        </MenuItem>
        <MenuItem
          component={RouterLink}
          to={`/admin/organizations/${organizationId}/theme`}
          onClick={handleClose}
          disabled={disabled}
        >
          <ListItemText>Manage Theme</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit} disabled={disabled}>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} disabled={disabled}>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
