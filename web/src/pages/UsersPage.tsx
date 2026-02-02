import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useFetchUsers } from "../hooks/useFetchUsers";
import { User } from "../types/UserModel";
import { shortTimestamp } from "../helpers/formatFriendlyTimestamp";

type Order = "asc" | "desc";

const columns: Array<{
  id: keyof User | "name";
  label: string;
  sortable: boolean;
}> = [
  { id: "name", label: "Name", sortable: true },
  { id: "email", label: "Email", sortable: true },
  { id: "phone", label: "Phone", sortable: true },
  { id: "emailVerified", label: "Verified", sortable: true },
  { id: "lastLoginAt", label: "Last login", sortable: true },
  { id: "createdAt", label: "Created", sortable: true },
];

const compareValues = (a: User, b: User, orderBy: keyof User | "name") => {
  if (orderBy === "name") {
    const aName = `${a.firstName || ""} ${a.lastName || ""}`
      .trim()
      .toLowerCase();
    const bName = `${b.firstName || ""} ${b.lastName || ""}`
      .trim()
      .toLowerCase();
    return aName.localeCompare(bName);
  }

  if (orderBy === "createdAt" || orderBy === "lastLoginAt") {
    const aTime = a[orderBy] ? new Date(a[orderBy] as string).getTime() : 0;
    const bTime = b[orderBy] ? new Date(b[orderBy] as string).getTime() : 0;
    return aTime - bTime;
  }

  if (orderBy === "emailVerified") {
    const aVal = a.emailVerified ? 1 : 0;
    const bVal = b.emailVerified ? 1 : 0;
    return aVal - bVal;
  }

  const aVal = (a[orderBy] ?? "").toString().toLowerCase();
  const bVal = (b[orderBy] ?? "").toString().toLowerCase();
  return aVal.localeCompare(bVal);
};

function UsersPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<keyof User | "name">("name");
  const [order, setOrder] = useState<Order>("asc");

  const { data: users, isLoading, error } = useFetchUsers();

  const sortedRows = useMemo(() => {
    const items = [...users];
    items.sort((a, b) =>
      order === "asc"
        ? compareValues(a, b, orderBy)
        : -compareValues(a, b, orderBy)
    );
    return items;
  }, [users, order, orderBy]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedRows]);

  const handleSort = (property: keyof User | "name") => {
    if (orderBy === property) {
      setOrder(order === "asc" ? "desc" : "asc");
      return;
    }
    setOrderBy(property);
    setOrder("asc");
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Users across your organizations.
        </Typography>
      </Box>
      <Paper>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 240,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        {column.sortable ? (
                          <TableSortLabel
                            active={orderBy === column.id}
                            direction={orderBy === column.id ? order : "asc"}
                            onClick={() => handleSort(column.id)}
                          >
                            {column.label}
                          </TableSortLabel>
                        ) : (
                          column.label
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <Typography color="text.secondary">
                          No users found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          {[row.firstName, row.lastName]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </TableCell>
                        <TableCell>{row.email || "—"}</TableCell>
                        <TableCell>{row.phone || "—"}</TableCell>
                        <TableCell>
                          {row.emailVerified ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          {row.lastLoginAt
                            ? shortTimestamp(row.lastLoginAt)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {row.createdAt ? shortTimestamp(row.createdAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={users.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </Paper>
    </Stack>
  );
}

export default UsersPage;
