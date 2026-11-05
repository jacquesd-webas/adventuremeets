import { useSearchParams } from "react-router-dom";
import AdminMeetCheckinPage from "./AdminMeetCheckinPage";
import MeetCheckinPage from "./MeetCheckinPage";

export default function MeetCheckinRoute() {
  const [searchParams] = useSearchParams();
  return searchParams.has("adminShareCode") ? (
    <AdminMeetCheckinPage />
  ) : (
    <MeetCheckinPage />
  );
}
