import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/SimpleAuthContext";
import ComplaintStatus from "./complaintStatus/ComplaintStatus"
import Navbar from "./components/Navbar"
import Help from "./help/Help"
import Home from "./home/Home"
import Login from "./login/Login"
import Map from "./map/Map"
import ReportIssue from "./reportIssue/ReportIssue"
import SignUp from "./signup/SignUp"
import Dashboard from "./gov/Dashboard"
import ReportedIssues from "./gov/ReportedIssues"
import StaffManagement from "./gov/StaffManagement"
import Analytics from "./gov/Analytics"
import OTPVerification from "./otp/OTPVerification"
import LoginDebug from "./components/LoginDebug"


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Citizen Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          <Route path="/report-issue" element={<ReportIssue />} />
          <Route path="/help" element={<Help/>} />
          <Route path="/map" element={<Map />} />
          <Route path="/complaint-status" element={<ComplaintStatus />} />
          
          {/* Government Staff Routes */}
          <Route path="/gov-dashboard" element={<Dashboard />} />
          <Route path="/reported-issues" element={<ReportedIssues />} />
          <Route path="/staff-management" element={<StaffManagement />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
        <LoginDebug />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
