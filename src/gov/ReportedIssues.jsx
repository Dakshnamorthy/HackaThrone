import React, { useState, useEffect } from 'react';
import GovNavbar from '../components/GovNavbar';
import { Search, Filter, Eye, Edit, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/SimpleAuthContext';
import './ReportedIssues.css';

const ReportedIssues = () => {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, searchTerm, statusFilter, typeFilter]);

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          citizens (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIssues = () => {
    let filtered = issues;

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.issue_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(issue => issue.type === typeFilter);
    }

    setFilteredIssues(filtered);
  };

  const updateIssueStatus = async (issueId, newStatus) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', issueId);

      if (error) throw error;

      // Update local state
      setIssues(issues.map(issue =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'In Progress': return '#2196f3';
      case 'Resolved': return '#4caf50';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#f44336';
      case 'Medium': return '#ff9800';
      case 'Low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return Clock;
      case 'In Progress': return AlertTriangle;
      case 'Resolved': return CheckCircle;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <>
        <GovNavbar />
        <div className="reported-issues-container">
          <div className="loading">Loading issues...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <GovNavbar />
      <div className="reported-issues-container">
        <div className="page-header">
          <h1>Reported Issues</h1>
          <p>Manage and track all citizen-reported issues</p>
        </div>

        <div className="filters-section">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by ID, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Electrical">Electrical</option>
              <option value="Garbage">Garbage</option>
              <option value="Road">Road</option>
              <option value="Water">Water</option>
              <option value="Infrastructure">Infrastructure</option>
            </select>
          </div>
        </div>

        <div className="issues-stats">
          <div className="stat-item">
            <span className="stat-number">{filteredIssues.length}</span>
            <span className="stat-label">Total Issues</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {filteredIssues.filter(issue => issue.status === 'Pending').length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {filteredIssues.filter(issue => issue.status === 'In Progress').length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {filteredIssues.filter(issue => issue.status === 'Resolved').length}
            </span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>

        <div className="issues-table">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => {
              const StatusIcon = getStatusIcon(issue.status);
              return (
                <div key={issue.id} className="issue-card">
                  <div className="issue-header">
                    <div className="issue-id-section">
                      <h3>{issue.issue_id}</h3>
                      <span className="issue-type">{issue.type}</span>
                    </div>
                    <div className="issue-status-section">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(issue.priority) }}
                      >
                        {issue.priority} Priority
                      </span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(issue.status) }}
                      >
                        <StatusIcon size={14} />
                        {issue.status}
                      </span>
                    </div>
                  </div>

                  <div className="issue-content">
                    <p className="issue-description">{issue.description}</p>
                    <p className="issue-location">📍 {issue.location}</p>
                    {issue.citizens && (
                      <p className="issue-reporter">
                        Reported by: {issue.citizens.name} ({issue.citizens.email})
                      </p>
                    )}
                  </div>

                  <div className="issue-actions">
                    <div className="status-controls">
                      <label>Update Status:</label>
                      <select
                        value={issue.status}
                        onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    <div className="action-buttons">
                      <button className="btn-view">
                        <Eye size={16} />
                        View Details
                      </button>
                      <button className="btn-edit">
                        <Edit size={16} />
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="issue-footer">
                    <small>Created: {new Date(issue.created_at).toLocaleDateString()}</small>
                    <small>Updated: {new Date(issue.updated_at).toLocaleDateString()}</small>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-issues">
              <p>No issues found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReportedIssues;
