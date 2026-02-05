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
import { MeetInfoModal } from "../components/MeetInfoModal";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, delta: number) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date: Date) => {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const endOfWeek = (date: Date) => {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  return end;
};

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

  const multiDaySpansByWeek = useMemo(() => {
    type Span = {
      meet: Meet;
      weekKey: string;
      startCol: number;
      endCol: number;
      row: number;
    };

    const spansByWeek = new Map<string, Span[]>();

    const addSpan = (weekKey: string, span: Omit<Span, "row">) => {
      const list = spansByWeek.get(weekKey) || [];
      list.push({ ...span, row: 0 });
      spansByWeek.set(weekKey, list);
    };

    meets.forEach((meet) => {
      const start = meet.startTime ? new Date(meet.startTime) : null;
      if (!start || Number.isNaN(start.getTime())) return;

      const end = meet.endTime ? new Date(meet.endTime) : null;
      if (!end || Number.isNaN(end.getTime())) return;

      const startDay = startOfDay(start);
      const endDay = startOfDay(end);
      if (endDay <= startDay) return;

      let cursor = new Date(startDay);
      while (cursor <= endDay) {
        const weekStart = startOfWeek(cursor);
        const weekEnd = endOfWeek(cursor);
        const segmentStart = new Date(cursor);
        const segmentEnd =
          endDay < weekEnd ? new Date(endDay) : new Date(weekEnd);
        const weekKey = formatKey(weekStart);
        addSpan(weekKey, {
          meet,
          weekKey,
          startCol: segmentStart.getDay(),
          endCol: segmentEnd.getDay(),
        });
        const next = new Date(weekEnd);
        next.setDate(next.getDate() + 1);
        cursor = next;
      }
    });

    spansByWeek.forEach((spans, weekKey) => {
      const sorted = spans
        .slice()
        .sort((a, b) =>
          a.startCol === b.startCol ? a.endCol - b.endCol : a.startCol - b.startCol,
        );
      const rowLastEnd: number[] = [];
      const packed: Span[] = [];

      sorted.forEach((span) => {
        let rowIndex = 0;
        while (
          rowIndex < rowLastEnd.length &&
          span.startCol <= rowLastEnd[rowIndex]
        ) {
          rowIndex += 1;
        }
        if (rowIndex === rowLastEnd.length) {
          rowLastEnd.push(span.endCol);
        } else {
          rowLastEnd[rowIndex] = span.endCol;
        }
        packed.push({ ...span, row: rowIndex });
      });

      spansByWeek.set(weekKey, packed);
    });

    return spansByWeek;
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
                  const weekKey = formatKey(week[0]);
                  const weekSpans = multiDaySpansByWeek.get(weekKey) || [];
                  const spanRowsByCol = Array.from({ length: 7 }, () => 0);
                  weekSpans.forEach((span) => {
                    for (let col = span.startCol; col <= span.endCol; col += 1) {
                      spanRowsByCol[col] = Math.max(
                        spanRowsByCol[col],
                        span.row + 1,
                      );
                    }
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
                        "--day-gap": theme.spacing(0.75),
                        "--cell-border": "1px",
                        "--content-pad":
                          "calc(var(--day-padding) + var(--cell-border))",
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: "var(--day-gap)",
                        }}
                      >
                        {week.map((day) => {
                          const key = formatKey(day);
                          const isCurrentMonth = day.getMonth() === monthIndex;
                          const singleDayItems =
                            singleDayMeetsByDay.get(key) || [];
                          const isWeekend =
                            day.getDay() === 0 || day.getDay() === 6;
                          const spanOffsetRows = spanRowsByCol[day.getDay()] || 0;
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
                                  {spanOffsetRows > 0 ? (
                                    <Box
                                      sx={{
                                        height: `calc(${spanOffsetRows} * (var(--item-row-height) + var(--item-row-gap)))`,
                                      }}
                                    />
                                  ) : null}
                                  {isLoading ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Loading...
                                    </Typography>
                                  ) : (
                                    <>
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
                      {weekSpans.length > 0 ? (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: "calc(var(--day-padding) + var(--header-height) + var(--item-row-gap))",
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gridAutoRows: "var(--item-row-height)",
                            columnGap:
                              "calc(var(--day-gap) + (2 * var(--content-pad)))",
                            rowGap: "var(--item-row-gap)",
                            px: "var(--content-pad)",
                            boxSizing: "border-box",
                          }}
                        >
                          {weekSpans.map((span) => (
                            <Box
                              key={`span-${span.weekKey}-${span.meet.id}-${span.row}-${span.startCol}`}
                              sx={{
                                gridColumn: `${span.startCol + 1} / ${
                                  span.endCol + 2
                                }`,
                                gridRow: `${span.row + 1}`,
                                backgroundColor: theme.palette.primary.main,
                                borderRadius: 1,
                                height: "var(--item-row-height)",
                                px: 0.75,
                                display: "flex",
                                alignItems: "center",
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
                              onClick={() => setSelectedMeet(span.meet)}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={600}
                                sx={{ display: "block" }}
                              >
                                {span.meet.name}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : null}
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
