import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PlaceIcon from "@mui/icons-material/Place";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { getLocationLabel, getMeetTimeLabel } from "../../helpers/meetTime";
import Meet from "../../types/MeetModel";

type MeetInfoDeetsProps = {
  meet: Meet;
  layout?: "vertical" | "horizontal";
};

export function MeetInfoDeets({
  meet,
  layout = "vertical",
}: MeetInfoDeetsProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const isHorizontal = layout === "horizontal";
  const timeLabel = getMeetTimeLabel(meet);
  const locationLabel = getLocationLabel(meet);
  const locationLabelMatch = locationLabel.match(
    /^(.*?)(\s+at\s+\d{1,2}:\d{2}(?:\s?[APap][Mm])?)$/,
  );
  const mapLinkLabel = locationLabelMatch
    ? locationLabelMatch[1]
    : locationLabel;
  const locationTimeSuffix = locationLabelMatch ? locationLabelMatch[2] : "";
  const costLabel =
    typeof meet.costCents === "number"
      ? `${meet.currencySymbol || ""}${(meet.costCents / 100).toFixed(2)}`
      : null;
  const mapQuery = useMemo(() => {
    if (
      typeof meet.locationLat === "number" &&
      typeof meet.locationLong === "number"
    ) {
      return `${meet.locationLat},${meet.locationLong}`;
    }
    return meet.location || "";
  }, [meet.location, meet.locationLat, meet.locationLong]);
  const mapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : "";

  return (
    <>
      <Stack
        direction={isHorizontal ? { xs: "column", sm: "row" } : "column"}
        spacing={isHorizontal ? 2 : 1}
        alignItems={isHorizontal ? "center" : undefined}
        justifyContent={isHorizontal ? "flex-start" : undefined}
        flexWrap={isHorizontal ? "wrap" : undefined}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonOutlineIcon fontSize="small" color="disabled" />
          <Typography variant="body2">{meet.organizerName}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon fontSize="small" color="disabled" />
          <Typography variant="body2">{timeLabel}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <PlaceIcon fontSize="small" color="disabled" />
          {meet.location ? (
            <Typography variant="body2" component="span">
              <Link
                component="button"
                variant="body2"
                onClick={() => setIsMapOpen(true)}
                sx={{ textAlign: "left", verticalAlign: "baseline" }}
              >
                {mapLinkLabel}
              </Link>
              {locationTimeSuffix}
            </Typography>
          ) : (
            <Typography variant="body2">{locationLabel}</Typography>
          )}
        </Stack>
        {typeof meet.capacity === "number" && (
          <Stack direction="row" spacing={1} alignItems="center">
            <GroupOutlinedIcon fontSize="small" color="disabled" />
            <Typography variant="body2">
              {meet.capacity === 0
                ? `${meet.attendeeCount ?? 0} Applied`
                : `${meet.attendeeCount ?? 0} Applied (limit ${meet.capacity})`}
            </Typography>
          </Stack>
        )}
        {costLabel && (
          <Stack direction="row" spacing={1} alignItems="center">
            <AttachMoneyOutlinedIcon fontSize="small" color="disabled" />
            <Typography variant="body2">{costLabel}</Typography>
          </Stack>
        )}
      </Stack>
      <Dialog
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Location map</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {mapEmbedUrl ? (
            <Box
              component="iframe"
              title="Map"
              src={mapEmbedUrl}
              sx={{ width: "100%", height: 420, border: 0 }}
            />
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No location available for this meet.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsMapOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
