import { BrowserRouter, Routes, Route } from "react-router-dom";
import ComplaintStatus from "./complaintStatus/ComplaintStatus";
import Help from "./help/Help";
import Home from "./home/Home";
import Login from "./login/Login";
import Map from "./map/Map";
import ReportIssue from "./reportIssue/ReportIssue";
import SignUp from "./signup/SignUp";
import OfficerDashboard from "./OfficerDashboard/OfficerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/report-issue" element={<ReportIssue />} />
        <Route path="/help" element={<Help />} />
        <Route path="/map" element={<Map />} />
        <Route path="/officer" element={<OfficerDashboard />} />
        <Route path="/complaint-status" element={<ComplaintStatus />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
