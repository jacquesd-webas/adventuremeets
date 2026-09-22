import { Box, Card, CardActionArea, Stack, Typography } from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import type { ReportType } from "../../types/Report";

export function ReportCard({ type }: { type: ReportType }) {
  const attendees = type === "attendees";
  const color = attendees ? "#5269cd" : "#168478";
  const Icon = attendees ? PeopleAltOutlinedIcon : EventAvailableOutlinedIcon;
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, flex: 1 }}>
      <CardActionArea component={Link} to={`/admin/reports/${type}`} sx={{ height: "100%" }}>
        <Box aria-hidden="true" sx={{ height: 170, bgcolor: attendees ? "#edf0ff" : "#e7f5f0", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, overflow: "hidden" }}>
          <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: "white", color, transform: "rotate(-8deg)", boxShadow: "0 10px 30px #0000000d" }}>
            <Icon sx={{ fontSize: 60 }} />
          </Box>
          <Stack spacing={1.2} sx={{ width: 110 }}>
            {[70, 100, 85].map((width, index) => (
              <Box key={width} sx={{ height: 12, width: `${width}%`, borderRadius: 2, bgcolor: color, opacity: 0.25 + index * 0.2 }} />
            ))}
          </Stack>
        </Box>
        <Stack spacing={1.5} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700}>{attendees ? "Attendee report" : "Meets report"}</Typography>
          <Typography color="text.secondary" sx={{ minHeight: 48 }}>
            {attendees ? "See who signed up, which meets they attended and their attendance status." : "Explore your meets, who organised them and how many people applied and attended."}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ color: "primary.main", pt: 1 }}>
            <Typography fontWeight={600}>View report</Typography><ArrowForwardIcon fontSize="small" />
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
