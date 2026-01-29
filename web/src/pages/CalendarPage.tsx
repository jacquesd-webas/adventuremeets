import {
  Box,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useMemo, useState } from "react";
import { useFetchMeets } from "../hooks/useFetchMeets";
import { useCurrentOrganization } from "../context/organizationContext";
import Meet from "../types/MeetModel";
import { MeetInfoModal } from "../components/MeetInfoModal";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, delta: number) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const formatKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthGrid = (monthDate: Date) => {
  const first = startOfMonth(monthDate);
  const firstWeekday = first.getDay(); // Sunday start
  const start = new Date(first);
  start.setDate(first.getDate() - firstWeekday);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    cells.push(day);
  }
  return cells;
};

const getMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    date
  );

export default function CalendarPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { currentOrganizationId } = useCurrentOrganization();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);

  const { data: meets, isLoading } = useFetchMeets({
    view: "all",
    page: 1,
    limit: 200,
    organizationId: currentOrganizationId || "",
  });

  const meetsByDay = useMemo(() => {
    const map = new Map<string, Meet[]>();
    meets.forEach((meet) => {
      const start = meet.startTime ? new Date(meet.startTime) : null;
      if (!start || Number.isNaN(start.getTime())) return;
      const key = formatKey(start);
      const list = map.get(key) || [];
      list.push(meet);
      map.set(key, list);
    });
    return map;
  }, [meets]);

  const monthCells = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const monthLabel = useMemo(() => getMonthLabel(currentMonth), [currentMonth]);
  const monthIndex = currentMonth.getMonth();

  // if theme is dark use different colors
  const weekendColor =
    theme.palette.mode === "dark" ? "#2c2c2c" : "rgba(235, 235, 235, 0.8)";
  const thisMonthColor =
    theme.palette.mode === "dark" ? "#2c2c2c" : "rgba(255,255,255,0.8)";
  const notThisMonthColor =
    theme.palette.mode === "dark" ? "#1a1a1a" : "rgba(0,0,0,0.02)";

  return (
    <Box sx={{ flex: 1, overflow: "auto", pt: 0, pb: 3 }}>
      <Container maxWidth="xl">
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700}>
              Calendar
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={600}>
                {monthLabel}
              </Typography>
              <IconButton
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRightIcon />
              </IconButton>
            </Stack>
          </Stack>

          {!currentOrganizationId ? (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">
                No organisation selected.
              </Typography>
            </Paper>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.75,
                  mb: 0.75,
                }}
              >
                {weekdays.map((label) => (
                  <Typography
                    key={label}
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      fontSize: "0.7rem",
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.75,
                }}
              >
                {monthCells.map((day) => {
                  const key = formatKey(day);
                  const isCurrentMonth = day.getMonth() === monthIndex;
                  const items = meetsByDay.get(key) || [];
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const visible = items;
                  return (
                    <Box
                      key={key}
                      sx={{
                        minHeight: 102,
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        p: 0.75,
                        backgroundColor: isCurrentMonth
                          ? isWeekend
                            ? weekendColor
                            : thisMonthColor
                          : notThisMonthColor,
                        color: isCurrentMonth
                          ? "text.primary"
                          : "text.disabled",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.4,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ fontSize: "0.7rem" }}
                      >
                        {day.getDate()}
                      </Typography>
                      {isLoading ? (
                        <Typography variant="caption" color="text.secondary">
                          Loading...
                        </Typography>
                      ) : (
                        <>
                          {visible.map((meet) => (
                            <Box
                              key={meet.id}
                              sx={{
                                px: 0.75,
                                py: 0.4,
                                borderRadius: 1,
                                backgroundColor: theme.palette.primary.main,
                                color:
                                  theme.palette.mode === "dark"
                                    ? "#222222"
                                    : theme.palette.primary.contrastText,
                                fontSize: "0.62rem",
                                lineHeight: 1.2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                cursor: "pointer",
                              }}
                              onClick={() => setSelectedMeet(meet)}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={600}
                                sx={{ display: "block" }}
                              >
                                {meet.name}
                              </Typography>
                            </Box>
                          ))}
                        </>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          )}
        </Stack>
      </Container>
      <MeetInfoModal
        open={Boolean(selectedMeet)}
        meetId={selectedMeet?.id}
        onClose={() => setSelectedMeet(null)}
      />
    </Box>
  );
}
