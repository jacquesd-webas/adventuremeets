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
import { useParams } from "react-router-dom";
import { useFetchOrganizationMembers } from "../hooks/useFetchOrganizationMembers";
import { useOrganization } from "../hooks/useOrganization";
import { OrganizationMember } from "../types/MemberModel";
import { shortTimestamp } from "../helpers/formatFriendlyTimestamp";

type Order = "asc" | "desc";

const columns: Array<{
  id: keyof OrganizationMember | "name";
  label: string;
  sortable: boolean;
}> = [
  { id: "name", label: "Name", sortable: true },
  { id: "email", label: "Email", sortable: true },
  { id: "role", label: "Role", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "createdAt", label: "Joined", sortable: true },
];

const compareValues = (
  a: OrganizationMember,
  b: OrganizationMember,
  orderBy: keyof OrganizationMember | "name"
) => {
  if (orderBy === "name") {
    const aName = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
    const bName = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
    return aName.localeCompare(bName);
  }

  if (orderBy === "createdAt") {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  }

  const aVal = (a[orderBy] ?? "").toString().toLowerCase();
  const bVal = (b[orderBy] ?? "").toString().toLowerCase();
  return aVal.localeCompare(bVal);
};

function MembersPage() {
  const { id } = useParams();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<
    keyof OrganizationMember | "name"
  >("name");
  const [order, setOrder] = useState<Order>("asc");
  const { data, isLoading, error } = useFetchOrganizationMembers(id);
  const { organization } = useOrganization(id);

  const sortedRows = useMemo(() => {
    const items = [...data];
    items.sort((a, b) =>
      order === "asc"
        ? compareValues(a, b, orderBy)
        : -compareValues(a, b, orderBy)
    );
    return items;
  }, [data, order, orderBy]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedRows]);

  const handleSort = (property: keyof OrganizationMember | "name") => {
    if (orderBy === property) {
      setOrder(order === "asc" ? "desc" : "asc");
      return;
    }
    setOrderBy(property);
    setOrder("asc");
  };

  const title = organization?.name
    ? `${organization.name} Members`
    : "Members";

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Organization members and roles.
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
                          No members found.
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
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>
                          {row.createdAt
                            ? shortTimestamp(row.createdAt)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data.length}
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

export default MembersPage;
