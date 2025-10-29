import { useState, useEffect } from "react";
import Navbar from '../components/Navbar';
import GovNavbar from '../components/GovNavbar';
import { useAuth } from '../context/SimpleAuthContext';
import { supabase } from '../../supabaseClient';
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
  const { userRole, user } = useAuth();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closingIssue, setClosingIssue] = useState(null);

  // Fetch user's issues from database
  const fetchUserIssues = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('citizen_id', user.id)
        .neq('status', 'Closed') // Filter out closed issues
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match component expectations
      const transformedData = data.map(issue => ({
        id: issue.issue_id,
        dbId: issue.id, // Store database ID for operations
        type: issue.type,
        submissionDate: new Date(issue.created_at).toLocaleDateString(),
        status: issue.status,
        lastUpdated: new Date(issue.updated_at).toLocaleDateString(),
        description: issue.description,
        location: issue.location,
        priority: issue.priority,
        images: issue.images || []
      }));

      setComplaints(transformedData);
    } catch (error) {
      console.error('Error fetching user issues:', error);
      // Fallback to mock data if database fails
      setComplaints(mockComplaints);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserIssues();
  }, [user]);

  const openDetails = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const closeDetails = () => {
    setSelectedComplaint(null);
  };

  const closeIssue = async (issueId, issueDbId) => {
    if (!confirm('Are you sure you want to close this issue? This action cannot be undone and the issue will be removed from your list.')) {
      return;
    }

    try {
      setClosingIssue(issueId);
      console.log('Closing issue:', { issueId, issueDbId });

      // Update the issue status to 'Closed' in the database
      const { data, error } = await supabase
        .from('issues')
        .update({ 
          status: 'Closed',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('issue_id', issueId)
        .select('*');

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Issue closed successfully:', data);

      // Remove the issue from local state (it will be filtered out)
      setComplaints(prevComplaints => 
        prevComplaints.filter(complaint => complaint.id !== issueId)
      );

      // Close modal if this issue was selected
      if (selectedComplaint && selectedComplaint.id === issueId) {
        setSelectedComplaint(null);
      }

      alert('✅ Issue closed successfully!\n\nThe issue has been marked as closed and removed from your list. Thank you for using our service!');

    } catch (error) {
      console.error('Error closing issue:', error);
      alert(`❌ Failed to close issue: ${error.message}\n\nPlease try again or contact support if the problem persists.`);
    } finally {
      setClosingIssue(null);
    }
  };

  const statusSteps = ["Submitted", "In Progress", "Resolved", "Closed"];

  return (
    <>
      {userRole === 'government' ? <GovNavbar /> : <Navbar />}
      <div className="complaintStatus-container">
        <h1>My Complaints</h1>
        <p>Track the status of the issues you have reported.</p>

        {loading ? (
          <div className="loading-container">
            <p>Loading your complaints...</p>
          </div>
        ) : !user ? (
          <div className="login-prompt">
            <p>Please log in to view your complaint status.</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="no-complaints">
            <p>You haven't reported any issues yet.</p>
            <p>Visit the <a href="/report-issue">Report Issue</a> page to submit your first complaint.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="complaint-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Issue Type</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>{complaint.id}</td>
                    <td>{complaint.type}</td>
                    <td>{complaint.submissionDate}</td>
                    <td className={`status ${complaint.status.replace(" ", "").toLowerCase()}`}>
                      {complaint.status === 'Resolved' ? 'Waiting for Closure' : complaint.status}
                    </td>
                    <td className={`priority ${complaint.priority?.toLowerCase()}`}>{complaint.priority}</td>
                    <td>{complaint.lastUpdated}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="details-btn" onClick={() => openDetails(complaint)}>View Details</button>
                        {complaint.status === 'Resolved' && (
                          <button 
                            className="close-issue-btn"
                            onClick={() => closeIssue(complaint.id, complaint.dbId)}
                            disabled={closingIssue === complaint.id}
                          >
                            {closingIssue === complaint.id ? 'Closing...' : 'Close Issue'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

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

              <div className="modal-actions">
                {selectedComplaint.status === 'Resolved' && (
                  <button 
                    className="close-issue-btn"
                    onClick={() => closeIssue(selectedComplaint.id, selectedComplaint.dbId)}
                    disabled={closingIssue === selectedComplaint.id}
                  >
                    {closingIssue === selectedComplaint.id ? 'Closing Issue...' : '✅ Close Issue'}
                  </button>
                )}
                <button className="close-btn" onClick={closeDetails}>Close Details</button>
              </div>
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
