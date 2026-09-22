import { Alert, Breadcrumbs, CircularProgress, Link as MuiLink, Stack, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useCurrentOrganization } from "../context/organizationContext";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { Heading } from "../components/Heading";
import { Link, useParams } from "react-router-dom";
import { ReportCard } from "../components/reportsModal/ReportCard";
import { ReportResults } from "../components/reportsModal/ReportResults";

export default function ReportsPage() {
  const { type } = useParams();
  const reportType = type === "attendees" || type === "meets" ? type : null;
  const { currentOrganizationId, currentOrganizationRole } = useCurrentOrganization();
  const { data: organization, isLoading, error } = useFetchOrganization(
    currentOrganizationId || undefined,
  );

  let content;
  if (!currentOrganizationId) {
    content = <Alert severity="info">Select an organisation to view reports.</Alert>;
  } else if (currentOrganizationRole !== "admin") {
    content = <Alert severity="warning">Only organisation admins can access this page.</Alert>;
  } else if (isLoading) {
    content = <CircularProgress />;
  } else if (error) {
    content = <Alert severity="error">{error}</Alert>;
  } else if (!organization?.reportingEnabled) {
    content = <Alert severity="info">Advanced reporting is not enabled for this organisation.</Alert>;
  } else {
    content = reportType ? (
      <ReportResults key={`${currentOrganizationId}:${reportType}`} organizationId={currentOrganizationId} type={reportType} />
    ) : (
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={600}>Meet reports</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ maxWidth: 1000 }}>
          <ReportCard type="attendees" />
          <ReportCard type="meets" />
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {reportType ? (
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Breadcrumbs
            separator={<ChevronRightIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: "text.disabled" }} />}
            aria-label="Report navigation"
            sx={{ fontSize: { xs: "1.6rem", sm: "2.125rem" }, fontWeight: 700 }}
          >
            <MuiLink component={Link} to="/admin/reports" underline="hover" color="inherit">
              Reports
            </MuiLink>
            <Typography component="h1" aria-current="page" color="text.primary" sx={{ fontSize: "inherit", fontWeight: "inherit" }}>
              {reportType === "attendees" ? "Attendee Report" : "Meets Report"}
            </Typography>
          </Breadcrumbs>
          <Typography color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
            Search and filter your organisation’s records.
          </Typography>
        </Stack>
      ) : (
        <Heading
          title="Reports"
          subtitle="Explore participation and attendance across your organisation."
        />
      )}
      {content}
    </Stack>
  );
}
