import { useSearchParams } from "react-router-dom";
import AdminMeetCheckinPage from "./AdminMeetCheckinPage";
import MeetSelfCheckinPage from "./MeetSelfCheckinPage";

export default function MeetSelfCheckinRoute() {
  const [searchParams] = useSearchParams();
  return searchParams.has("adminShareCode") ? (
    <AdminMeetCheckinPage />
  ) : (
    <MeetSelfCheckinPage />
  );
}
