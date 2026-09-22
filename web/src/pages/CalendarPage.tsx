import {
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
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
import { Heading } from "../components/Heading";
import { MeetStatus } from "../components/meet/MeetStatus";
import { CalendarStatusFilter } from "../components/meet/CalendarStatusFilter";
import MeetStatusEnum from "../types/MeetStatusEnum";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad2 = (v: number) => `${v}`.padStart(2, "0");
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addMonths = (date: Date, delta: number) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const differenceInDaysInclusive = (start: Date, end: Date) => {
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  return Math.max(1, Math.floor((b - a) / DAY_MS) + 1);
};

const parseDayKey = (key: string) => {
  const [year, month, date] = key.split("-").map((v) => Number(v));
  return new Date(year, month - 1, date);
};

type MobileCalView = "agenda" | "month";

type MobileOccurrence = {
  meet: Meet;
  day: Date;
  dayKey: string;
  dayIndex: number;
  totalDays: number;
  isStart: boolean;
  isEnd: boolean;
  start: Date;
  end: Date | null;
  startDay: Date;
  endDay: Date;
  sortTs: number;
};

type WeekEventSegment = {
  meet: Meet;
  startDayIndex: number;
  endDayIndex: number;
  lane: number;
  sortTs: number;
};

type WeekLayout = {
  segments: WeekEventSegment[];
  laneCount: number;
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

const getMeetDayRange = (meet: Meet) => {
  const start = meet.startTime ? new Date(meet.startTime) : null;
  if (!start || Number.isNaN(start.getTime())) return null;

  const end = meet.endTime ? new Date(meet.endTime) : null;
  let startDay = startOfDay(start);
  let endDay = end && !Number.isNaN(end.getTime()) ? startOfDay(end) : startDay;

  if (
    end &&
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0 &&
    endDay.getTime() > startDay.getTime()
  ) {
    endDay = addDays(endDay, -1);
  }

  if (endDay.getTime() < startDay.getTime()) {
    endDay = startDay;
  }

  return {
    start,
    startDay,
    endDay,
  };
};

const buildWeekLayout = (week: Date[], meets: Meet[]): WeekLayout => {
  const weekStart = startOfDay(week[0]);
  const weekEnd = startOfDay(week[6]);

  const candidates = meets
    .map((meet) => {
      const range = getMeetDayRange(meet);
      if (!range) return null;
      if (range.endDay.getTime() < weekStart.getTime()) return null;
      if (range.startDay.getTime() > weekEnd.getTime()) return null;

      const startDayIndex = Math.max(
        0,
        Math.floor(
          (startOfDay(range.startDay).getTime() - weekStart.getTime()) / DAY_MS,
        ),
      );
      const endDayIndex = Math.min(
        6,
        Math.floor(
          (startOfDay(range.endDay).getTime() - weekStart.getTime()) / DAY_MS,
        ),
      );

      return {
        meet,
        startDayIndex,
        endDayIndex,
        sortTs: range.start.getTime(),
      };
    })
    .filter((item): item is Omit<WeekEventSegment, "lane"> => Boolean(item));

  candidates.sort((a, b) => {
    if (a.startDayIndex !== b.startDayIndex) {
      return a.startDayIndex - b.startDayIndex;
    }
    const aSpan = a.endDayIndex - a.startDayIndex;
    const bSpan = b.endDayIndex - b.startDayIndex;
    if (aSpan !== bSpan) {
      return bSpan - aSpan;
    }
    if (a.sortTs !== b.sortTs) {
      return a.sortTs - b.sortTs;
    }
    return a.meet.name.localeCompare(b.meet.name);
  });

  const laneOccupancy: boolean[][] = [];
  const segments: WeekEventSegment[] = [];

  candidates.forEach((candidate) => {
    let lane = 0;
    while (true) {
      const occupancy = laneOccupancy[lane] ?? Array.from({ length: 7 }, () => false);
      const overlaps = occupancy
        .slice(candidate.startDayIndex, candidate.endDayIndex + 1)
        .some(Boolean);

      if (!overlaps) {
        for (
          let dayIndex = candidate.startDayIndex;
          dayIndex <= candidate.endDayIndex;
          dayIndex += 1
        ) {
          occupancy[dayIndex] = true;
        }
        laneOccupancy[lane] = occupancy;
        segments.push({ ...candidate, lane });
        return;
      }
      lane += 1;
    }
  });

  return {
    segments,
    laneCount: laneOccupancy.length,
  };
};

const getStatusColor = (statusId?: number) => {
  switch (statusId) {
    case MeetStatusEnum.Postponed:
      return "#ed6c02";
    case MeetStatusEnum.Cancelled:
      return "#d32f2f";
    case MeetStatusEnum.Closed:
      return "#7e57c2";
    case MeetStatusEnum.Completed:
      return "#757575";
    case MeetStatusEnum.Published:
      return "#2e7d32";
    case MeetStatusEnum.Open:
      return "#1976d2";
    default:
      return "#1976d2";
  }
};

export default function CalendarPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { currentOrganizationId } = useCurrentOrganization();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);
  const [mobileView, setMobileView] = useState<MobileCalView>("agenda");
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [visibleStatusIds, setVisibleStatusIds] = useState<number[]>([
    MeetStatusEnum.Published,
    MeetStatusEnum.Open,
    MeetStatusEnum.Closed,
    MeetStatusEnum.Cancelled,
    MeetStatusEnum.Postponed,
    MeetStatusEnum.Completed,
  ]);
  const calendarStartDate = useMemo(
    () => addDays(startOfMonth(currentMonth), -7).toISOString(),
    [currentMonth],
  );
  const calendarEndDate = useMemo(
    () => addDays(endOfMonth(currentMonth), 7).toISOString(),
    [currentMonth],
  );

  const { data: meets, isLoading } = useFetchMeets({
    view: "calendar",
    page: 1,
    limit: 200,
    organizationId: currentOrganizationId || "",
    startDate: calendarStartDate,
    endDate: calendarEndDate,
  });
  const filteredMeets = useMemo(
    () =>
      meets.filter(
        (meet) =>
          typeof meet.statusId !== "number" ||
          visibleStatusIds.includes(meet.statusId),
      ),
    [meets, visibleStatusIds],
  );

  const monthCells = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const weeks = useMemo(() => chunkWeeks(monthCells), [monthCells]);
  const weekLayouts = useMemo(
    () => weeks.map((week) => buildWeekLayout(week, filteredMeets)),
    [filteredMeets, weeks],
  );
  const monthIndex = currentMonth.getMonth();
  const agendaDayKeys = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const keys: string[] = [];
    for (
      let cursor = new Date(start);
      cursor <= end;
      cursor = addDays(cursor, 1)
    ) {
      keys.push(dayKey(cursor));
    }
    return keys;
  }, [currentMonth]);

  const occurrencesByDayKey = useMemo(() => {
    const map = new Map<string, MobileOccurrence[]>();
    filteredMeets.forEach((meet) => {
      const start = meet.startTime ? new Date(meet.startTime) : null;
      if (!start || Number.isNaN(start.getTime())) return;

      const end = meet.endTime ? new Date(meet.endTime) : null;
      let startDayValue = startOfDay(start);
      let endDayValue = end ? startOfDay(end) : startDayValue;

      if (
        end &&
        end.getHours() === 0 &&
        end.getMinutes() === 0 &&
        end.getSeconds() === 0 &&
        end.getMilliseconds() === 0 &&
        endDayValue.getTime() > startDayValue.getTime()
      ) {
        endDayValue = addDays(endDayValue, -1);
      }

      if (endDayValue.getTime() < startDayValue.getTime()) {
        endDayValue = startDayValue;
      }

      const totalDays = differenceInDaysInclusive(startDayValue, endDayValue);
      for (let i = 0; i < totalDays; i += 1) {
        const occurrenceDay = addDays(startDayValue, i);
        const key = dayKey(occurrenceDay);
        const list = map.get(key) || [];
        list.push({
          meet,
          day: occurrenceDay,
          dayKey: key,
          dayIndex: i + 1,
          totalDays,
          isStart: i === 0,
          isEnd: i === totalDays - 1,
          start,
          end,
          startDay: startDayValue,
          endDay: endDayValue,
          sortTs: start.getTime(),
        });
        map.set(key, list);
      }
    });

    map.forEach((list) => {
      list.sort((a, b) => {
        if (a.isStart !== b.isStart) return a.isStart ? -1 : 1;
        if (a.sortTs !== b.sortTs) return a.sortTs - b.sortTs;
        return a.meet.name.localeCompare(b.meet.name);
      });
    });
    return map;
  }, [filteredMeets]);

  const selectedDayDate = useMemo(
    () => (selectedDayKey ? parseDayKey(selectedDayKey) : null),
    [selectedDayKey],
  );
  const selectedDayOccurrences = useMemo(
    () => (selectedDayKey ? occurrencesByDayKey.get(selectedDayKey) || [] : []),
    [occurrencesByDayKey, selectedDayKey],
  );
  const hasVisibleOccurrences = useMemo(
    () =>
      agendaDayKeys.some((key) => (occurrencesByDayKey.get(key) || []).length),
    [agendaDayKeys, occurrencesByDayKey],
  );

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
  const formatTime = (date?: Date | null) =>
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
  const formatDayHeader = (date: Date) =>
    date.toLocaleDateString([], {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  const formatDateShort = (date: Date) =>
    date.toLocaleDateString([], {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const getOccurrencePhaseLabel = (occurrence: MobileOccurrence) => {
    if (occurrence.isStart && !occurrence.isEnd) {
      const label = formatTime(occurrence.start);
      return label ? `Starts ${label}` : "Starts";
    }
    if (occurrence.isEnd && !occurrence.isStart) {
      const label = formatTime(occurrence.end);
      return label ? `Ends ${label}` : "Ends";
    }
    if (!occurrence.isStart && !occurrence.isEnd) {
      return "Continues";
    }
    const startLabel = formatTime(occurrence.start);
    const endLabel = formatTime(occurrence.end);
    if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
    if (startLabel) return startLabel;
    return "";
  };

  const openDayDrawer = (key: string) => {
    setSelectedDayKey(key);
    setDayDrawerOpen(true);
  };

  const renderOccurrenceCard = (
    occurrence: MobileOccurrence,
    options?: { showRange?: boolean; closeDrawerOnClick?: boolean },
  ) => (
    <Paper
      key={`${occurrence.dayKey}-${occurrence.meet.id}`}
      variant="outlined"
      sx={{ p: 1.25, borderRadius: 1.5, cursor: "pointer" }}
      onClick={() => {
        setSelectedMeet(occurrence.meet);
        if (options?.closeDrawerOnClick) setDayDrawerOpen(false);
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="subtitle2" fontWeight={700}>
          {occurrence.meet.name}
        </Typography>
        {occurrence.meet.location ? (
          <Typography variant="caption" color="text.secondary">
            {occurrence.meet.location}
          </Typography>
        ) : null}
        <Box sx={{ width: "fit-content" }}>
          <MeetStatus
            statusId={occurrence.meet.statusId}
            fallbackLabel={occurrence.meet.status || "Scheduled"}
          />
        </Box>
        {options?.showRange && occurrence.totalDays > 1 ? (
          <Typography variant="caption" color="text.secondary">
            {`${formatDateShort(occurrence.startDay)} \u2192 ${formatDateShort(
              occurrence.endDay,
            )}`}
          </Typography>
        ) : null}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {occurrence.totalDays > 1 ? (
            <Typography variant="caption" fontWeight={600}>
              Day {occurrence.dayIndex} of {occurrence.totalDays}
            </Typography>
          ) : null}
          <Typography variant="caption" color="text.secondary">
            {getOccurrencePhaseLabel(occurrence)}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{ flex: 1, overflow: "auto", pt: 0, pb: 3 }}>
      <Container maxWidth="xl">
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Heading title="Calendar" />
            <Box sx={{ flexGrow: 1 }} />
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              justifyContent="flex-end"
            >
              {!isMobile ? (
                <CalendarStatusFilter
                  value={visibleStatusIds}
                  onChange={setVisibleStatusIds}
                />
              ) : null}
              <IconButton
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="body1" fontWeight={600}>
                {currentMonth.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
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
              {isMobile ? (
                <Stack spacing={1.25}>
                  <ToggleButtonGroup
                    value={mobileView}
                    exclusive
                    size="small"
                    onChange={(_, next) => {
                      if (next) setMobileView(next);
                    }}
                    sx={{ width: "fit-content" }}
                  >
                    <ToggleButton value="agenda">Agenda</ToggleButton>
                    <ToggleButton value="month">Month</ToggleButton>
                  </ToggleButtonGroup>

                  {isLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  ) : mobileView === "agenda" ? (
                    <Stack spacing={1.5}>
                      {agendaDayKeys.map((key) => {
                        const day = parseDayKey(key);
                        const dayOccurrences =
                          occurrencesByDayKey.get(key) || [];
                        if (!dayOccurrences.length) return null;
                        return (
                          <Box key={key}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{ mb: 0.75 }}
                            >
                              {formatDayHeader(day)}
                            </Typography>
                            <Stack spacing={0.75}>
                              {dayOccurrences.map((occurrence) =>
                                renderOccurrenceCard(occurrence),
                              )}
                            </Stack>
                          </Box>
                        );
                      })}
                      {!hasVisibleOccurrences ? (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography color="text.secondary" variant="body2">
                            No meets this month.
                          </Typography>
                        </Paper>
                      ) : null}
                    </Stack>
                  ) : (
                    <Stack spacing={1}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: 0.5,
                        }}
                      >
                        {weekdays.map((label) => (
                          <Typography
                            key={label}
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            align="center"
                            sx={{ fontSize: "0.65rem" }}
                          >
                            {label}
                          </Typography>
                        ))}
                      </Box>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: 0.5,
                        }}
                      >
                        {monthCells.map((day) => {
                          const key = dayKey(day);
                          const dayOccurrences =
                            occurrencesByDayKey.get(key) || [];
                          const count = dayOccurrences.length;
                          const startMarkerCount = dayOccurrences.filter(
                            (occurrence) =>
                              occurrence.totalDays > 1 && occurrence.isStart,
                          ).length;
                          const continueMarkerCount = dayOccurrences.filter(
                            (occurrence) =>
                              occurrence.totalDays > 1 &&
                              !occurrence.isStart &&
                              !occurrence.isEnd,
                          ).length;
                          const endMarkerCount = dayOccurrences.filter(
                            (occurrence) =>
                              occurrence.totalDays > 1 && occurrence.isEnd,
                          ).length;
                          const isCurrentMonth = day.getMonth() === monthIndex;
                          return (
                            <Box
                              key={key}
                              onClick={() => openDayDrawer(key)}
                              sx={{
                                minHeight: 62,
                                borderRadius: 1.25,
                                border: "1px solid",
                                borderColor: "divider",
                                p: 0.75,
                                backgroundColor: isCurrentMonth
                                  ? "background.paper"
                                  : "action.hover",
                                color: isCurrentMonth
                                  ? "text.primary"
                                  : "text.disabled",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                cursor: "pointer",
                              }}
                            >
                              <Typography variant="caption" fontWeight={700}>
                                {day.getDate()}
                              </Typography>
                              <Stack spacing={0.25}>
                                {count > 0 ? (
                                  count <= 3 ? (
                                    <Stack direction="row" spacing={0.35}>
                                      {Array.from({ length: count }).map(
                                        (_, index) => (
                                          <Box
                                            key={`${key}-dot-${index}`}
                                            sx={{
                                              width: 5,
                                              height: 5,
                                              borderRadius: "50%",
                                              backgroundColor: getStatusColor(
                                                dayOccurrences[index]?.meet
                                                  .statusId,
                                              ),
                                            }}
                                          />
                                        ),
                                      )}
                                    </Stack>
                                  ) : (
                                    <Typography
                                      variant="caption"
                                      color={getStatusColor(
                                        dayOccurrences[0]?.meet.statusId,
                                      )}
                                      fontWeight={700}
                                    >
                                      +{count}
                                    </Typography>
                                  )
                                ) : null}
                                <Stack
                                  direction="row"
                                  spacing={0.35}
                                  sx={{ minHeight: 10 }}
                                >
                                  {startMarkerCount > 0 ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        fontSize: "0.58rem",
                                        lineHeight: 1,
                                      }}
                                    >
                                      →{startMarkerCount}
                                    </Typography>
                                  ) : null}
                                  {continueMarkerCount > 0 ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        fontSize: "0.58rem",
                                        lineHeight: 1,
                                      }}
                                    >
                                      ⋯{continueMarkerCount}
                                    </Typography>
                                  ) : null}
                                  {endMarkerCount > 0 ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        fontSize: "0.58rem",
                                        lineHeight: 1,
                                      }}
                                    >
                                      ←{endMarkerCount}
                                    </Typography>
                                  ) : null}
                                </Stack>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Box>
                    </Stack>
                  )}
                </Stack>
              ) : (
                <>
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
                      const layout = weekLayouts[weekIndex];
                      const laneCount = layout?.laneCount || 0;
                      const minCellHeight = isMobile ? 92 : 120;
                      const eventsHeight = laneCount
                        ? laneCount * itemRowHeight +
                          Math.max(0, laneCount - 1) * itemRowGap
                        : 0;
                      const cellHeight = Math.max(
                        minCellHeight,
                        dayPadding * 2 +
                          headerHeight +
                          (isLoading || eventsHeight
                            ? itemRowGap + eventsHeight
                            : 0),
                      );

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
                            {week.map((day) => {
                              const key = formatKey(day);
                              const isCurrentMonth =
                                day.getMonth() === monthIndex;
                              const isWeekend =
                                day.getDay() === 0 || day.getDay() === 6;
                              return (
                                <Box
                                  key={key}
                                  sx={{
                                    height: cellHeight,
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
                                      ) : null}
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                          {!isLoading
                            ? layout.segments.map((segment) => {
                                const span =
                                  segment.endDayIndex - segment.startDayIndex + 1;
                                const row = segment.lane;
                                const barTop = `calc(var(--day-padding) + var(--header-height) + var(--item-row-gap) + (${row} * (var(--item-row-height) + var(--item-row-gap))))`;
                                const gridGap = theme.spacing(0.75);
                                const left = `calc((((100% - (${gridGap} * 6)) / 7) * ${segment.startDayIndex}) + (${gridGap} * ${segment.startDayIndex}) + var(--day-padding))`;
                                const width = `calc((((100% - (${gridGap} * 6)) / 7) * ${span}) + (${gridGap} * ${Math.max(0, span - 1)}) - (var(--day-padding) * 2))`;
                                const isSingleDay = span === 1;
                                const truncateAt = isSingleDay ? 16 : 30;
                                const isTruncated =
                                  segment.meet.name.length > (isSingleDay ? 26 : 42);
                                const label = isTruncated
                                  ? `${segment.meet.name.slice(0, truncateAt)}...`
                                  : segment.meet.name;
                                const content = (
                                  <Box
                                    key={`${segment.meet.id}-${segment.startDayIndex}-${segment.endDayIndex}`}
                                    sx={{
                                      position: "absolute",
                                      left,
                                      top: barTop,
                                      width,
                                      height: "var(--item-row-height)",
                                      px: 0.75,
                                      borderRadius: 1,
                                      backgroundColor:
                                        getStatusColor(segment.meet.statusId),
                                      color:
                                        theme.palette.mode === "dark"
                                          ? "#222222"
                                          : theme.palette.primary.contrastText,
                                      fontSize: "0.62rem",
                                      lineHeight: "var(--item-row-height)",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      cursor: "pointer",
                                      zIndex: 2,
                                    }}
                                    onClick={() =>
                                      setSelectedMeet(segment.meet)
                                    }
                                  >
                                    <Typography
                                      variant="caption"
                                      fontWeight={600}
                                      sx={{
                                        display: "block",
                                        lineHeight: "inherit",
                                      }}
                                    >
                                      {label}
                                    </Typography>
                                  </Box>
                                );
                                return isTruncated ? (
                                  <Tooltip
                                    key={`${segment.meet.id}-${segment.startDayIndex}-${segment.endDayIndex}`}
                                    title={segment.meet.name}
                                    arrow
                                  >
                                    {content}
                                  </Tooltip>
                                ) : (
                                  content
                                );
                              })
                            : null}
                        </Box>
                      );
                    })}
                  </Stack>
                </>
              )}
            </Paper>
          )}
        </Stack>
      </Container>
      <Drawer
        anchor="bottom"
        open={dayDrawerOpen}
        onClose={() => setDayDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 2,
            pb: 3,
            maxHeight: "75vh",
          },
        }}
      >
        <Stack spacing={1.25}>
          <Typography variant="h6" fontWeight={700}>
            {selectedDayDate
              ? selectedDayDate.toLocaleDateString([], {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "Day details"}
          </Typography>
          <Divider />
          {selectedDayOccurrences.length ? (
            <Stack spacing={0.85}>
              {selectedDayOccurrences.map((occurrence) =>
                renderOccurrenceCard(occurrence, {
                  showRange: true,
                  closeDrawerOnClick: true,
                }),
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No meets on this day.
            </Typography>
          )}
        </Stack>
      </Drawer>
      <MeetInfoModal
        open={Boolean(selectedMeet)}
        meetId={selectedMeet?.id}
        onClose={() => setSelectedMeet(null)}
      />
    </Box>
  );
}
