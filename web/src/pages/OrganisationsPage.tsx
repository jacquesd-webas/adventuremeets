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
import { formatFriendlyTimestamp } from "../helpers/formatFriendlyTimestamp";
import { useAuth } from "../context/authContext";
import { RoleChip } from "../components/RoleChip";
import { OrganizationActions } from "../components/OrganizationActions";

type Order = "asc" | "desc";
type OrgRow = Organization & { role?: string };
type OrderBy = keyof OrgRow | "actions";

const columns: Array<{
  id: OrderBy;
  label: string;
  sortable: boolean;
  hidden?: boolean;
  align?: "left" | "center" | "right";
}> = [
  { id: "id", label: "ID", sortable: true, hidden: true },
  { id: "name", label: "Name", sortable: true },
  { id: "role", label: "", sortable: false, align: "center" },
  { id: "userCount", label: "Users", sortable: true, align: "right" },
  { id: "templateCount", label: "Templates", sortable: true, align: "right" },
  { id: "createdAt", label: "Created", sortable: true },
  { id: "actions", label: "Actions", sortable: false, align: "right" },
];

const compareValues = (a: OrgRow, b: OrgRow, orderBy: OrderBy) => {
  const aVal = a[orderBy];
  const bVal = b[orderBy];

  if (orderBy === "createdAt") {
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
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<OrderBy>("name");
  const [order, setOrder] = useState<Order>("asc");

  const {
    data: organizations,
    total,
    isLoading,
    error,
  } = useFetchOrganisations({
    page: page + 1,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: order,
  });

  const rows = useMemo<OrgRow[]>(() => {
    const orgRoles = user?.organizations || {};
    return organizations.map((org) => ({
      ...org,
      role: orgRoles[org.id] || "member",
    }));
  }, [organizations, user?.organizations]);
  const sortedRows = useMemo(() => {
    if (!orderBy) return rows;
    const items = [...rows];
    items.sort((a, b) =>
      order === "asc"
        ? compareValues(a, b, orderBy)
        : -compareValues(a, b, orderBy)
    );
    return items;
  }, [rows, order, orderBy]);

  const rowCount = total || rows.length;

  const handleSort = (property: OrderBy) => {
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
                      <TableCell
                        key={column.id}
                        sx={column.hidden ? { display: "none" } : undefined}
                        align={column.align}
                      >
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
                        {/*
                          Actions and links are admin-only; keep the data visible but disable interaction.
                        */}
                        <TableCell sx={{ display: "none" }}>{row.id}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="center">
                          <RoleChip role={row.role} />
                        </TableCell>
                        <TableCell align="right">
                          <Link
                            component={RouterLink}
                            to={`/admin/organizations/${row.id}/members`}
                            underline="hover"
                            aria-disabled={row.role !== "admin"}
                            sx={
                              row.role !== "admin"
                                ? {
                                    color: "text.disabled",
                                    pointerEvents: "none",
                                  }
                                : undefined
                            }
                          >
                            {row.userCount ?? 0}
                          </Link>
                        </TableCell>
                        <TableCell align="right">
                          <Link
                            component={RouterLink}
                            to={`/admin/organizations/${row.id}/templates`}
                            underline="hover"
                            aria-disabled={row.role !== "admin"}
                            sx={
                              row.role !== "admin"
                                ? {
                                    color: "text.disabled",
                                    pointerEvents: "none",
                                  }
                                : undefined
                            }
                          >
                            {row.templateCount ?? 0}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {row.createdAt
                            ? formatFriendlyTimestamp(row.createdAt)
                            : "—"}
                        </TableCell>
                        <TableCell align="right">
                          <OrganizationActions
                            organizationId={row.id}
                            disabled={row.role !== "admin"}
                          />
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
