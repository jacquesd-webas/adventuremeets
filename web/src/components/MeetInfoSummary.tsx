import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Meet from "../types/MeetModel";

type MeetInfoSummaryProps = {
  meet: Meet;
  isPreview: boolean;
  loginHref?: string;
  onLoginClick?: () => void;
  onCopyLink?: () => void;
  descriptionMaxLines?: number;
  showMoreChip?: boolean;
  showUserAction?: boolean;
  actionSlot?: ReactNode;
  onClose?: () => void;
};

export function MeetInfoSummary({
  meet,
  isPreview,
  loginHref = "/login",
  onLoginClick,
  onCopyLink,
  descriptionMaxLines,
  showMoreChip = false,
  showUserAction = true,
  actionSlot,
  onClose,
}: MeetInfoSummaryProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const startDate = meet.startTime ? new Date(meet.startTime) : null;
  const endDate = meet.endTime ? new Date(meet.endTime) : null;
  const dateLabel =
    startDate &&
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(startDate);
  const startTimeLabel =
    startDate &&
    startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const durationLabel =
    startDate && endDate
      ? (() => {
          const diffMs = endDate.getTime() - startDate.getTime();
          const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
        })()
      : null;
  const costLabel =
    typeof meet.costCents === "number"
      ? `${meet.currencySymbol || ""}${(meet.costCents / 100).toFixed(2)}`
      : null;
  const hasImage = Boolean(meet.imageUrl);
  const displayName = useMemo(() => {
    if (!user) return "";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (name) return name;
    if (user.idp_profile?.name) return user.idp_profile.name;
    if (user.email) return user.email.split("@")[0];
    return "";
  }, [user]);
  const initials = useMemo(() => {
    if (!displayName) return "MP";
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [displayName]);
  const shouldClamp = Boolean(descriptionMaxLines) && !isExpanded;

  useEffect(() => {
    if (!descriptionRef.current || !descriptionMaxLines) {
      setIsTruncated(false);
      return;
    }
    const el = descriptionRef.current;
    setIsTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [descriptionMaxLines, meet.description, isExpanded]);

  const renderDescription = () => (
    <Stack spacing={1} alignItems="flex-start">
      <Typography
        ref={descriptionRef}
        variant="body1"
        color="text.secondary"
        sx={{
          whiteSpace: "pre-line",
          ...(shouldClamp && {
            display: "-webkit-box",
            WebkitLineClamp: descriptionMaxLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }),
        }}
      >
        {meet.description}
      </Typography>
      {showMoreChip && descriptionMaxLines && isTruncated && (
        <Chip
          label={"show more"}
          size="small"
          variant="outlined"
          onClick={() => {
            setIsTruncated(false), setIsExpanded(true);
          }}
        />
      )}
      {showMoreChip && descriptionMaxLines && isExpanded && (
        <Chip
          label={"show less"}
          size="small"
          variant="outlined"
          onClick={() => {
            setIsTruncated(true), setIsExpanded(false);
          }}
        />
      )}
    </Stack>
  );

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h4" fontWeight={700}>
          {meet.name}
        </Typography>
        {actionSlot ? (
          actionSlot
        ) : onClose ? (
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : showUserAction ? (
          isPreview && typeof onCopyLink === "function" ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<LinkIcon fontSize="small" />}
              aria-label="Copy share link"
              onClick={onCopyLink}
              disabled={!meet.shareCode}
            >
              Copy link
            </Button>
          ) : isAuthenticated ? (
            <Avatar
              role="button"
              sx={{ width: 36, height: 36, cursor: "pointer" }}
              onClick={() => void logout()}
            >
              {initials}
            </Avatar>
          ) : (
            <Button
              variant="outlined"
              size="small"
              href={!onLoginClick ? loginHref : undefined}
              onClick={onLoginClick}
            >
              Login
            </Button>
          )
        ) : null}
      </Stack>
      {dateLabel && (
        <Typography variant="subtitle1" color="text.secondary">
          {dateLabel}
        </Typography>
      )}
      {hasImage ? (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="flex-start"
            mt={1}
          >
            <Box
              component="img"
              src={meet.imageUrl || ""}
              alt="Meet preview"
              sx={{
                width: 180,
                height: 130,
                borderRadius: 2,
                objectFit: "cover",
              }}
            />
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonOutlineIcon fontSize="small" color="disabled" />
                <Typography variant="body2">{meet.organizerName}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="small" color="disabled" />
                <Typography variant="body2">
                  {startTimeLabel} ({durationLabel || "Duration TBD"})
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PlaceIcon fontSize="small" color="disabled" />
                <Typography variant="body2">{meet.location}</Typography>
              </Stack>
              {typeof meet.capacity === "number" && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <GroupOutlinedIcon fontSize="small" color="disabled" />
                  <Typography variant="body2">{meet.capacity} spots</Typography>
                </Stack>
              )}
              {costLabel && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <AttachMoneyOutlinedIcon fontSize="small" color="disabled" />
                  <Typography variant="body2">{costLabel}</Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
          {renderDescription()}
        </>
      ) : (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="flex-start"
            flexWrap="wrap"
            mt={1}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonOutlineIcon fontSize="small" color="disabled" />
              <Typography variant="body2">{meet.organizerName}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeIcon fontSize="small" color="disabled" />
              <Typography variant="body2">
                {startTimeLabel} ({durationLabel || "Duration TBD"})
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <PlaceIcon fontSize="small" color="disabled" />
              <Typography variant="body2">{meet.location}</Typography>
            </Stack>
            {typeof meet.capacity === "number" && (
              <Stack direction="row" spacing={1} alignItems="center">
                <GroupOutlinedIcon fontSize="small" color="disabled" />
                <Typography variant="body2">{meet.capacity} spots</Typography>
              </Stack>
            )}
            {costLabel && (
              <Stack direction="row" spacing={1} alignItems="center">
                <AttachMoneyOutlinedIcon fontSize="small" color="disabled" />
                <Typography variant="body2">{costLabel}</Typography>
              </Stack>
            )}
          </Stack>
          {renderDescription()}
        </>
      )}
    </>
  );
}
