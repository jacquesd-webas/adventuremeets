import { useNavigate, useParams } from "react-router-dom";
import { ManageAttendeesModal } from "../components/manageAttendeesModal/ManageAttendeesModal";
import { MeetNotFound } from "../components/meet/MeetNotFound";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { useFetchMeet } from "../hooks/useFetchMeet";
import { useAuth } from "../context/authContext";
import { getMeetPermissions } from "../helpers/meetPermissions";

function MeetAttendeesPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: meet, isLoading } = useFetchMeet(id, Boolean(id));

  if (!id) {
    return <MeetNotFound />;
  }

  if (isLoading) {
    return <FullPageSpinner message="Loading attendees..." />;
  }

  if (!meet) {
    return <MeetNotFound />;
  }

  const currentOrganizationRole = meet.organizationId
    ? user?.organizations?.[meet.organizationId] ?? null
    : null;
  const permissions = getMeetPermissions({
    currentUserId: user?.id,
    currentOrganizationRole,
    organizerId: meet.organizerId,
  });

  if (!permissions.canViewMeet) {
    return <MeetNotFound />;
  }

  return (
    <ManageAttendeesModal
      open
      meetId={meet.id}
      canViewMeet={permissions.canViewMeet}
      canManageMeet={permissions.canManageMeet}
      isOrganizer={permissions.isOrganizerForMeet}
      onClose={() => nav("/plan")}
    />
  );
}

export default MeetAttendeesPage;
