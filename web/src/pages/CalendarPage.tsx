import {
  Box,
  Container,
  IconButton,
  Paper,
  Stack,
  Tooltip,
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
import { MeetInfoModal } from "../components/meet/MeetInfoModal";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, delta: number) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

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

const chunkWeeks = (cells: Date[]) => {
  const weeks: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

const getMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    date,
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

  const multiDayMeetsByDay = useMemo(() => {
    const map = new Map<
      string,
      Array<{ meet: Meet; renderId: string; weekKey: string }>
    >();
    meets.forEach((meet) => {
      const start = meet.startTime ? new Date(meet.startTime) : null;
      if (!start || Number.isNaN(start.getTime())) return;

      const end = meet.endTime ? new Date(meet.endTime) : null;
      if (!end || Number.isNaN(end.getTime())) return;

      const startDay = startOfDay(start);
      const endDay = startOfDay(end);
      if (endDay <= startDay) {
        return;
      }

      for (
        let cursor = new Date(startDay);
        cursor <= endDay;
        cursor.setDate(cursor.getDate() + 1)
      ) {
        const key = formatKey(cursor);
        const weekStart = new Date(cursor);
        weekStart.setDate(cursor.getDate() - cursor.getDay());
        const weekKey = formatKey(weekStart);
        const list = map.get(key) || [];
        const uniqueWeekKey = `${meet.id}-${weekKey}`;
        list.push({ meet, renderId: uniqueWeekKey, weekKey: uniqueWeekKey });
        map.set(key, list);
      }
    });
    return map;
  }, [meets]);

  const singleDayMeetsByDay = useMemo(() => {
    const map = new Map<string, Meet[]>();
    meets.forEach((meet) => {
      const start = meet.startTime ? new Date(meet.startTime) : null;
      if (!start || Number.isNaN(start.getTime())) return;

      const end = meet.endTime ? new Date(meet.endTime) : null;
      if (!end || Number.isNaN(end.getTime())) {
        const key = formatKey(start);
        const list = map.get(key) || [];
        list.push(meet);
        map.set(key, list);
        return;
      }

      const startDay = startOfDay(start);
      const endDay = startOfDay(end);
      if (endDay <= startDay) {
        const key = formatKey(startDay);
        const list = map.get(key) || [];
        list.push(meet);
        map.set(key, list);
      }
    });
    return map;
  }, [meets]);
  const monthCells = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const weeks = useMemo(() => chunkWeeks(monthCells), [monthCells]);
  const monthLabel = useMemo(() => getMonthLabel(currentMonth), [currentMonth]);
  const monthIndex = currentMonth.getMonth();

  // if theme is dark use different colors
  const weekendColor =
    theme.palette.mode === "dark" ? "#2c2c2c" : "rgba(235, 235, 235, 0.8)";
  const thisMonthColor =
    theme.palette.mode === "dark" ? "#2c2c2c" : "rgba(255,255,255,0.8)";
  const notThisMonthColor =
    theme.palette.mode === "dark" ? "#1a1a1a" : "rgba(0,0,0,0.02)";
  const dayPadding = 6;
  const headerHeight = 18;
  const itemRowHeight = 20;
  const itemRowGap = 4;

  console.log({ multiDayMeetsByDay, singleDayMeetsByDay });
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
              <Stack spacing={0.75}>
                {weeks.map((week, weekIndex) => {
                  const weekGroups = new Map<
                    string,
                    {
                      minX: number;
                      maxX: number;
                      minY: number;
                      maxY: number;
                      meet: Meet;
                    }
                  >();
                  const weekDayItems = week.map((day) => {
                    const key = formatKey(day);
                    return multiDayMeetsByDay.get(key) || [];
                  });

                  weekDayItems.forEach((items, dayIndex) => {
                    items.forEach((item, itemIndex) => {
                      const group = weekGroups.get(item.weekKey) || {
                        minX: dayIndex,
                        maxX: dayIndex,
                        minY: itemIndex,
                        maxY: itemIndex,
                        meet: item.meet,
                      };
                      group.minX = Math.min(group.minX, dayIndex);
                      group.maxX = Math.max(group.maxX, dayIndex);
                      group.minY = Math.min(group.minY, itemIndex);
                      group.maxY = Math.max(group.maxY, itemIndex);
                      weekGroups.set(item.weekKey, group);
                    });

                    console.log({ weekDayItems, weekGroups });
                  });

                  return (
                    <Box
                      key={`week-${weekIndex}`}
                      sx={{
                        position: "relative",
                        "--day-padding": `${dayPadding}px`,
                        "--header-height": `${headerHeight}px`,
                        "--item-row-height": `${itemRowHeight}px`,
                        "--item-row-gap": `${itemRowGap}px`,
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: 0.75,
                        }}
                      >
                        {week.map((day, dayIndex) => {
                          const key = formatKey(day);
                          const isCurrentMonth = day.getMonth() === monthIndex;
                          const items = weekDayItems[dayIndex];
                          const singleDayItems =
                            singleDayMeetsByDay.get(key) || [];
                          const isWeekend =
                            day.getDay() === 0 || day.getDay() === 6;
                          return (
                            <Box
                              key={key}
                              sx={{
                                height: isMobile ? 92 : 120,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: isCurrentMonth
                                  ? isWeekend
                                    ? weekendColor
                                    : thisMonthColor
                                  : notThisMonthColor,
                                color: isCurrentMonth
                                  ? "text.primary"
                                  : "text.disabled",
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  height: "100%",
                                  px: "var(--day-padding)",
                                  pt: "var(--day-padding)",
                                  pb: "var(--day-padding)",
                                  boxSizing: "border-box",
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  fontWeight={600}
                                  sx={{
                                    fontSize: "0.7rem",
                                    height: "var(--header-height)",
                                    lineHeight: "var(--header-height)",
                                  }}
                                >
                                  {day.getDate()}
                                </Typography>
                                <Box sx={{ mt: "var(--item-row-gap)" }}>
                                  {isLoading ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Loading...
                                    </Typography>
                                  ) : (
                                    <>
                                      {items.map(({ meet, renderId }) => {
                                          const isTruncated =
                                            meet.name.length > 26;
                                          const label = isTruncated
                                            ? `${meet.name.slice(0, 16)}...`
                                            : meet.name;
                                          const content = (
                                            <Box
                                              sx={{
                                                px: 0.75,
                                                height:
                                                  "var(--item-row-height)",
                                                display: "flex",
                                                alignItems: "center",
                                                borderRadius: 1,
                                                backgroundColor:
                                                  theme.palette.primary.main,
                                                color:
                                                  theme.palette.mode === "dark"
                                                    ? "#222222"
                                                    : theme.palette.primary
                                                        .contrastText,
                                                fontSize: "0.62rem",
                                                lineHeight: 1.2,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                cursor: "pointer",
                                              }}
                                              onClick={() =>
                                                setSelectedMeet(meet)
                                              }
                                            >
                                              <Typography
                                                variant="caption"
                                                fontWeight={600}
                                                sx={{ display: "block" }}
                                              >
                                                {label}
                                              </Typography>
                                            </Box>
                                          );
                                          return isTruncated ? (
                                            <Tooltip
                                              key={renderId}
                                              title={meet.name}
                                              arrow
                                            >
                                              {content}
                                            </Tooltip>
                                          ) : (
                                            <Box key={renderId}>{content}</Box>
                                          );
                                        })}
                                      {singleDayItems.map((meet) => {
                                        const isTruncated =
                                          meet.name.length > 26;
                                        const label = isTruncated
                                          ? `${meet.name.slice(0, 16)}...`
                                          : meet.name;
                                        const content = (
                                          <Box
                                            sx={{
                                              px: 0.75,
                                              height: "var(--item-row-height)",
                                              display: "flex",
                                              alignItems: "center",
                                              borderRadius: 1,
                                              backgroundColor:
                                                theme.palette.primary.main,
                                              color:
                                                theme.palette.mode === "dark"
                                                  ? "#222222"
                                                  : theme.palette.primary
                                                      .contrastText,
                                              fontSize: "0.62rem",
                                              lineHeight: 1.2,
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              cursor: "pointer",
                                            }}
                                            onClick={() =>
                                              setSelectedMeet(meet)
                                            }
                                          >
                                            <Typography
                                              variant="caption"
                                              fontWeight={600}
                                              sx={{ display: "block" }}
                                            >
                                              {label}
                                            </Typography>
                                          </Box>
                                        );
                                        return isTruncated ? (
                                          <Tooltip
                                            key={meet.id}
                                            title={meet.name}
                                            arrow
                                          >
                                            {content}
                                          </Tooltip>
                                        ) : (
                                          <Box key={meet.id}>{content}</Box>
                                        );
                                      })}
                                    </>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                      {/* Week span overlays intentionally hidden for now */}
                    </Box>
                  );
                })}
              </Stack>
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
