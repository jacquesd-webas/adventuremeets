import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import LinkIcon from "@mui/icons-material/Link";

type MeetInfoSummaryProps = {
  meet: {
    name: string;
    description?: string;
    organizerName?: string;
    location?: string;
    capacity?: number;
    start?: string;
    end?: string;
    costCents?: number | null;
    currencySymbol?: string;
    imageUrl?: string | null;
  };
  isPreview: boolean;
  shareLink: string;
  loginHref?: string;
  onCopyLink: () => void;
};

export function MeetInfoSummary({
  meet,
  isPreview,
  shareLink,
  loginHref = "/login",
  onCopyLink,
}: MeetInfoSummaryProps) {
  const startDate = meet.start ? new Date(meet.start) : null;
  const endDate = meet.end ? new Date(meet.end) : null;
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
        {isPreview ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<LinkIcon fontSize="small" />}
            aria-label="Copy share link"
            onClick={onCopyLink}
            disabled={!shareLink}
          >
            Copy link
          </Button>
        ) : (
          <Button variant="outlined" size="small" href={loginHref}>
            Login
          </Button>
        )}
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
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, whiteSpace: "pre-line" }}
          >
            {meet.description}
          </Typography>
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
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ whiteSpace: "pre-line" }}
          >
            {meet.description}
          </Typography>
        </>
      )}
    </>
  );
}
