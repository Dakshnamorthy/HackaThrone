import { useState } from "react";
import Navbar from '../components/Navbar';
import './ComplaintStatus.css';

const mockComplaints = [
  {
    id: "CIV-1001",
    type: "Pothole",
    submissionDate: "2025-10-18",
    status: "In Progress",
    lastUpdated: "2025-10-19",
    description: "Large pothole near main street affecting traffic.",
    location: "123 Main St, City Center",
    department: "Road Maintenance",
    images: ["https://via.placeholder.com/150", "https://via.placeholder.com/150"]
  },
  {
    id: "CIV-1002",
    type: "Garbage",
    submissionDate: "2025-10-17",
    status: "Resolved",
    lastUpdated: "2025-10-18",
    description: "Overflowing garbage bins near park area.",
    location: "45 Park Lane",
    department: "Sanitation",
    images: ["https://via.placeholder.com/150"]
  }
];

function ComplaintStatus() {
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const openDetails = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const closeDetails = () => {
    setSelectedComplaint(null);
  };

  const statusSteps = ["Submitted", "In Progress", "Resolved", "Closed"];

  return (
    <>
      <Navbar />
      <div className="complaintStatus-container">
        <h1>My Complaints</h1>
        <p>Track the status of the issues you have reported.</p>

        <div className="table-container">
          <table className="complaint-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Issue Type</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td>{complaint.id}</td>
                  <td>{complaint.type}</td>
                  <td>{complaint.submissionDate}</td>
                  <td className={`status ${complaint.status.replace(" ", "").toLowerCase()}`}>{complaint.status}</td>
                  <td>{complaint.lastUpdated}</td>
                  <td>
                    <button className="details-btn" onClick={() => openDetails(complaint)}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {selectedComplaint && (
          <div className="modal-overlay" onClick={closeDetails}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Complaint Details - {selectedComplaint.id}</h2>
              <p><strong>Type:</strong> {selectedComplaint.type}</p>
              <p><strong>Description:</strong> {selectedComplaint.description}</p>
              <p><strong>Location:</strong> {selectedComplaint.location}</p>
              <p><strong>Assigned Department:</strong> {selectedComplaint.department}</p>

              <div className="status-timeline">
                {statusSteps.map((step, index) => (
                  <div key={index} className={`timeline-step ${statusSteps.indexOf(selectedComplaint.status) >= index ? "active" : ""}`}>
                    {step}
                  </div>
                ))}
              </div>

              <div className="image-preview-container">
                {selectedComplaint.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`complaint-${idx}`} />
                ))}
              </div>

              <button className="close-btn" onClick={closeDetails}>Close</button>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 CivicApp. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#">About</a> | <a href="#">Contact</a> | <a href="#">Privacy Policy</a> | <a href="#">Terms</a>
        </div>
      </footer>
    </>
  );
}

export default ComplaintStatus;
