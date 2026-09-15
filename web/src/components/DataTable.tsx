import { Paper } from "@mui/material";
import { DataGrid, type DataGridProps, type GridValidRowModel } from "@mui/x-data-grid";

export function DataTable<Row extends GridValidRowModel>(props: DataGridProps<Row>) {
  return (
    <Paper variant="outlined" sx={{ width: "100%", bgcolor: "transparent" }}>
      <DataGrid
        autoHeight
        pagination
        paginationMode="server"
        pageSizeOptions={[10, 25, 50]}
        disableColumnFilter
        disableRowSelectionOnClick
        sx={(theme) => ({
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(16, 16, 16, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          "& .MuiDataGrid-cell:first-of-type": {
            pl: 2,
          },
          "& .MuiDataGrid-cell:last-of-type": {
            pr: 2,
          },
          "& .MuiDataGrid-columnHeader:first-of-type": {
            pl: 2,
          },
          "& .MuiDataGrid-columnHeader:last-of-type": {
            pr: 2,
          },
        })}
        {...props}
      />
    </Paper>
  );
}
