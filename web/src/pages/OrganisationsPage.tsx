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
  Link,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useFetchOrganisations } from "../hooks/useFetchOrganisations";
import { Link as RouterLink } from "react-router-dom";
import { Organization } from "../types/OrganizationModel";
import { shortTimestamp } from "../helpers/formatFriendlyTimestamp";

type Order = "asc" | "desc";

const columns: Array<{
  id: keyof Organization | "id";
  label: string;
  sortable: boolean;
}> = [
  { id: "name", label: "Name", sortable: true },
  { id: "userCount", label: "Users", sortable: true },
  { id: "templateCount", label: "Templates", sortable: true },
  { id: "id", label: "ID", sortable: true },
  { id: "createdAt", label: "Created", sortable: true },
  { id: "updatedAt", label: "Updated", sortable: true },
];

const compareValues = (
  a: Organization,
  b: Organization,
  orderBy: keyof Organization
) => {
  const aVal = a[orderBy];
  const bVal = b[orderBy];

  if (orderBy === "createdAt" || orderBy === "updatedAt") {
    const aTime = aVal ? new Date(aVal).getTime() : 0;
    const bTime = bVal ? new Date(bVal).getTime() : 0;
    return aTime - bTime;
  }

  if (orderBy === "userCount") {
    return (Number(aVal) || 0) - (Number(bVal) || 0);
  }
  if (orderBy === "templateCount") {
    return (Number(aVal) || 0) - (Number(bVal) || 0);
  }

  const aStr = (aVal ?? "").toString().toLowerCase();
  const bStr = (bVal ?? "").toString().toLowerCase();
  return aStr.localeCompare(bStr);
};

function OrganisationsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<keyof Organization>("name");
  const [order, setOrder] = useState<Order>("asc");

  const { data, total, isLoading, error } = useFetchOrganisations({
    page: page + 1,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: order,
  });

  const sortedRows = useMemo(() => {
    if (!orderBy) return data;
    const items = [...data];
    items.sort((a, b) =>
      order === "asc"
        ? compareValues(a, b, orderBy)
        : -compareValues(a, b, orderBy)
    );
    return items;
  }, [data, order, orderBy]);

  const rowCount = total || data.length;

  const handleSort = (property: keyof Organization) => {
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
          Organisations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage organisations available to your account.
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
                            onClick={() =>
                              handleSort(column.id as keyof Organization)
                            }
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
                  {sortedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <Typography color="text.secondary">
                          No organisations found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                          <Link
                            component={RouterLink}
                            to={`/admin/organizations/${row.id}/members`}
                            underline="hover"
                          >
                            {row.userCount ?? 0}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            component={RouterLink}
                            to={`/admin/organizations/${row.id}/templates`}
                            underline="hover"
                          >
                            {row.templateCount ?? 0}
                          </Link>
                        </TableCell>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>
                          {row.createdAt ? shortTimestamp(row.createdAt) : "—"}
                        </TableCell>
                        <TableCell>
                          {row.updatedAt ? shortTimestamp(row.updatedAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={rowCount}
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

export default OrganisationsPage;
