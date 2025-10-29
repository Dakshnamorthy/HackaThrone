import React, { useState, useEffect } from 'react';
import GovNavbar from '../components/GovNavbar';
import { Search, Filter, MapPin, Calendar, User, Eye, Edit, Clock, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/SimpleAuthContext';
import './ReportedIssues.css';

const ReportedIssues = () => {
  const { user } = useAuth(); // Get current user for tracking who made changes
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Track which issue is being updated
  const [updatingAssignment, setUpdatingAssignment] = useState(null); // Track assignment updates
  const [editingIssue, setEditingIssue] = useState(null); // Track which issue is in edit mode
  const [editValues, setEditValues] = useState({}); // Store temporary edit values
  const [showingHistory, setShowingHistory] = useState(null); // Track which issue's history is being shown
  const [issueHistory, setIssueHistory] = useState([]); // Store issue change history
  const [predictingPriority, setPredictingPriority] = useState(null); // Track which issue is getting priority prediction

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, searchTerm, statusFilter, typeFilter]);

  const fetchIssues = async () => {
    try {
      // First try to fetch issues without citizen join to see if basic query works
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Fetched issues:', data);
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      // Set empty array if fetch fails
      setIssues([]);
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
    // Prevent multiple updates for the same issue
    if (updatingStatus === issueId) return;
    
    try {
      setUpdatingStatus(issueId);
      console.log('Updating issue status:', { issueId, newStatus });
      
      const { data, error } = await supabase
        .from('issues')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', issueId)
        .select('*');

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Status update successful:', data);

      // Update local state with the actual data returned from database
      if (data && data.length > 0) {
        const updatedIssue = data[0];
        setIssues(issues.map(issue =>
          issue.id === issueId ? { ...issue, ...updatedIssue } : issue
        ));
      }

      // Show success message (you can replace this with a toast notification)
      console.log(`Issue status updated to "${newStatus}" successfully!`);

    } catch (error) {
      console.error('Error updating issue status:', error);
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateIssueAssignment = async (issueId, assignedTo) => {
    // Prevent multiple updates for the same issue
    if (updatingAssignment === issueId) return;
    
    try {
      setUpdatingAssignment(issueId);
      console.log('Updating issue assignment:', { issueId, assignedTo });
      
      const { data, error } = await supabase
        .from('issues')
        .update({ 
          assigned_to: assignedTo, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', issueId)
        .select('*');

      if (error) {
        console.error('Database assignment update error:', error);
        throw error;
      }

      console.log('Assignment update successful:', data);

      // Update local state with the actual data returned from database
      if (data && data.length > 0) {
        const updatedIssue = data[0];
        setIssues(issues.map(issue =>
          issue.id === issueId ? { ...issue, ...updatedIssue } : issue
        ));
      }

      console.log(`Issue assigned to "${assignedTo}" successfully!`);

    } catch (error) {
      console.error('Error updating issue assignment:', error);
      alert(`Failed to update assignment: ${error.message}`);
    } finally {
      setUpdatingAssignment(null);
    }
  };

  const startEditing = (issue) => {
    console.log('Starting edit for issue:', issue);
    
    setEditingIssue(issue.id);
    const initialValues = {
      status: issue.status || 'Pending',
      assigned_to: issue.assigned_to || '',
      priority: issue.priority || 'Medium'
    };
    
    console.log('Setting initial edit values:', initialValues);
    setEditValues(initialValues);
  };

  const cancelEditing = () => {
    setEditingIssue(null);
    setEditValues({});
  };

  const saveChanges = async (issueId) => {
    try {
      setUpdatingStatus(issueId);
      
      // Get current issue data to compare changes
      const currentIssue = issues.find(issue => issue.id === issueId);
      
      console.log('Current issue:', currentIssue);
      console.log('Edit values:', editValues);
      console.log('Attempting to update issue ID:', issueId, 'Type:', typeof issueId);
      
      // First, let's check if the issue exists by both id and issue_id
      const { data: existingById, error: checkByIdError } = await supabase
        .from('issues')
        .select('id, issue_id, status, priority, assigned_to')
        .eq('id', issueId)
        .single();
        
      console.log('Check by ID:', { data: existingById, error: checkByIdError });
      
      const { data: existingByIssueId, error: checkByIssueIdError } = await supabase
        .from('issues')
        .select('id, issue_id, status, priority, assigned_to')
        .eq('issue_id', currentIssue?.issue_id)
        .single();
        
      console.log('Check by issue_id:', { data: existingByIssueId, error: checkByIssueIdError });
      
      let updateField = 'id';
      let updateValue = issueId;
      
      // Always use the id field since both checks succeeded
      updateField = 'id';
      updateValue = String(issueId); // Ensure it's a string to match UUID format
      
      console.log('Using id field for update. Value:', updateValue, 'Type:', typeof updateValue);
      
      // Update the main issues table directly
      console.log(`Updating with ${updateField} = ${updateValue}`);
      
      // Map to exact database field names from your issues table
      const updateData = {
        status: editValues.status,
        priority: editValues.priority,
        assigned_to: editValues.assigned_to || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('Database field mapping:');
      console.log('- status:', editValues.status);
      console.log('- priority:', editValues.priority); 
      console.log('- assigned_to:', editValues.assigned_to || null);
      console.log('- updated_at:', new Date().toISOString());
      
      console.log('Update data:', updateData);
      
      // Test RLS policies and permissions more thoroughly
      console.log('Testing RLS policies and update permissions...');
      
      // First, try to read the current data to ensure we have read access
      const { data: currentData, error: readError } = await supabase
        .from('issues')
        .select('*')
        .eq(updateField, updateValue)
        .single();
        
      console.log('Read test:', { data: currentData, error: readError });
      
      if (readError) {
        alert(`Cannot read issue data: ${readError.message}. Check RLS policies for SELECT.`);
        return;
      }
      
      // Test a simple update to see if RLS allows it
      const testUpdate = { updated_at: new Date().toISOString() };
      const { data: testResult, error: permissionError, count } = await supabase
        .from('issues')
        .update(testUpdate)
        .eq(updateField, updateValue)
        .select('updated_at');
        
      console.log('Permission test result:', { data: testResult, error: permissionError, count });
      
      if (permissionError) {
        console.error('Permission error:', permissionError);
        alert(`Permission denied: ${permissionError.message}\n\nYou need UPDATE permission on the issues table. Check your RLS policies.`);
        return;
      }
      
      if (!testResult || testResult.length === 0) {
        console.error('RLS Policy blocking update - no rows affected');
        alert(`RLS Policy Error: Update blocked by Row Level Security.\n\nThe government user needs UPDATE policy on issues table.\n\nPlease add RLS policy: ALTER TABLE issues ENABLE ROW LEVEL SECURITY; CREATE POLICY "government_can_update" ON issues FOR UPDATE TO authenticated USING (true);`);
        return;
      }
      
      console.log('✅ Update permissions confirmed - proceeding with full update');
      
      // Now try the full update with select
      const { data: updatedIssue, error: updateError } = await supabase
        .from('issues')
        .update(updateData)
        .eq(updateField, updateValue)
        .select('*');
        
      console.log('Full update response:', updatedIssue, updateError);
      
      // If that fails, try without select to see if it's a select permission issue
      if (updateError || !updatedIssue || updatedIssue.length === 0) {
        console.log('Trying update without select...');
        const { error: updateError2 } = await supabase
          .from('issues')
          .update(updateData)
          .eq(updateField, updateValue);
          
        console.log('Update without select result:', updateError2);
        
        if (updateError2) {
          console.error('Update failed even without select:', updateError2);
          alert(`Update failed: ${updateError2.message}`);
          return;
        }
        
        // Update succeeded but we don't have the returned data
        // Update local state immediately with our edit values
        console.log('Update succeeded without select, updating UI with selected data...');
        
        const updatedIssueData = {
          status: editValues.status,
          assigned_to: editValues.assigned_to || null,
          priority: editValues.priority,
          updated_at: new Date().toISOString()
        };
        
        console.log('Updating UI with:', updatedIssueData);
        
        // Update local state immediately with selected data
        setIssues(prevIssues => 
          prevIssues.map(issue =>
            issue.id === issueId ? { 
              ...issue, 
              ...updatedIssueData
            } : issue
          )
        );

        setFilteredIssues(prevFiltered =>
          prevFiltered.map(issue =>
            issue.id === issueId ? { 
              ...issue, 
              ...updatedIssueData
            } : issue
          )
        );

        // Exit edit mode immediately
        setEditingIssue(null);
        setEditValues({});
        
        // Verify the database was actually updated
        console.log('Verifying database update...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('issues')
          .select('id, status, priority, assigned_to, updated_at')
          .eq('id', issueId)
          .single();
          
        console.log('Database verification:', { data: verifyData, error: verifyError });
        
        if (verifyData) {
          console.log('Database shows:');
          console.log('- status:', verifyData.status);
          console.log('- priority:', verifyData.priority);
          console.log('- assigned_to:', verifyData.assigned_to);
          console.log('- updated_at:', verifyData.updated_at);
          
          // Check if our changes were actually saved
          const statusMatch = verifyData.status === editValues.status;
          const priorityMatch = verifyData.priority === editValues.priority;
          const assignedMatch = (verifyData.assigned_to || '') === (editValues.assigned_to || '');
          
          console.log('Update verification:');
          console.log('- Status updated:', statusMatch);
          console.log('- Priority updated:', priorityMatch);
          console.log('- Assignment updated:', assignedMatch);
          
          if (statusMatch && priorityMatch && assignedMatch) {
            alert(`✅ Issue updated successfully in database!\nNew status: ${verifyData.status}\nPriority: ${verifyData.priority}${verifyData.assigned_to ? '\nAssigned to: ' + verifyData.assigned_to : ''}`);
          } else {
            alert(`⚠️ Update partially successful. Please check the database.\nExpected: ${editValues.status}, ${editValues.priority}\nActual: ${verifyData.status}, ${verifyData.priority}`);
          }
        } else {
          alert(`Issue updated successfully! New status: ${editValues.status}, Priority: ${editValues.priority}${editValues.assigned_to ? ', Assigned to: ' + editValues.assigned_to : ''}`);
        }
        
        // Refresh from database to ensure UI consistency
        setTimeout(() => {
          fetchIssues();
        }, 500);
        return;
      }

      console.log('Database response:', { data: updatedIssue, error: updateError });

      if (updateError) {
        console.error('Database update error:', updateError);
        alert(`Database error: ${updateError.message}`);
        throw updateError;
      }

      // If we got here, the update with select worked
      if (!updatedIssue || updatedIssue.length === 0) {
        // This shouldn't happen now, but let's handle it gracefully
        console.log('Update may have succeeded but no data returned, refreshing...');
        await fetchIssues();
        setEditingIssue(null);
        setEditValues({});
        alert('Update completed - data refreshed from database');
        return;
      }

      console.log('Issue updated successfully:', updatedIssue[0]);

      // Update local state with the actual data returned from database
      const updated = updatedIssue[0];
      setIssues(prevIssues => 
        prevIssues.map(issue =>
          issue.id === issueId ? { ...issue, ...updated } : issue
        )
      );

      // Also update filtered issues
      setFilteredIssues(prevFiltered =>
        prevFiltered.map(issue =>
          issue.id === issueId ? { ...issue, ...updated } : issue
        )
      );

      // Exit edit mode
      setEditingIssue(null);
      setEditValues({});
      
      // Refresh data from database to ensure consistency
      await fetchIssues();
      
      alert(`Issue updated successfully! New status: ${updated.status}`);

    } catch (error) {
      console.error('Error saving update:', error);
      alert(`Failed to save update: ${error.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const viewIssueHistory = async (issueId) => {
    try {
      setShowingHistory(issueId);
      
      // First check if table exists by trying a simple query
      console.log('Checking issues_updates table...');
      
      const { data, error } = await supabase
        .from('issues_updates')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching issue history:', error);
        console.error('Error details:', error);
        
        if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
          alert('The issues_updates table is not accessible. Please refresh the page or restart the server.');
          return;
        }
        throw error;
      }

      console.log('History data loaded:', data);
      setIssueHistory(data || []);
    } catch (error) {
      console.error('Error loading issue history:', error);
      alert(`Failed to load history: ${error.message}`);
    }
  };

  const closeHistory = () => {
    setShowingHistory(null);
    setIssueHistory([]);
  };

  const predictPriority = async (issue) => {
    try {
      setPredictingPriority(issue.id);
      console.log('Predicting priority for issue:', issue);

      // Call the ML priority model server
      const response = await fetch('http://localhost:5001/api/calculate-priority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: issue.id,
          type: issue.type,
          latitude: issue.latitude || 11.9416, // Default to Puducherry if no coordinates
          longitude: issue.longitude || 79.8083,
          description: issue.description,
          location: issue.location
        })
      });

      if (!response.ok) {
        throw new Error(`Priority server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Priority prediction result:', result);

      if (!result.success) {
        throw new Error(result.message || 'Priority calculation failed');
      }

      // Update the issue priority in the database
      const { data: updatedIssue, error: updateError } = await supabase
        .from('issues')
        .update({
          priority: result.priority, // "High", "Medium", "Low"
          updated_at: new Date().toISOString()
        })
        .eq('id', issue.id)
        .select('*');

      console.log('Database update result:', { data: updatedIssue, error: updateError });

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      if (!updatedIssue || updatedIssue.length === 0) {
        // Try update without select
        const { error: updateError2 } = await supabase
          .from('issues')
          .update({
            priority: result.priority,
            updated_at: new Date().toISOString()
          })
          .eq('id', issue.id);

        if (updateError2) {
          throw updateError2;
        }
      }

      // Update local state
      setIssues(prevIssues =>
        prevIssues.map(i =>
          i.id === issue.id ? {
            ...i,
            priority: result.priority,
            updated_at: new Date().toISOString()
          } : i
        )
      );

      setFilteredIssues(prevFiltered =>
        prevFiltered.map(i =>
          i.id === issue.id ? {
            ...i,
            priority: result.priority,
            updated_at: new Date().toISOString()
          } : i
        )
      );

      alert(`🤖 AI Priority Calculated!\n\nIssue: ${issue.issue_id}\nPredicted Priority: ${result.priority}\nConfidence Score: ${result.priorityScore}\n\nPriority saved to database successfully!`);

    } catch (error) {
      console.error('Priority prediction error:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Priority server error')) {
        alert(`❌ Priority Model Server Error\n\nMake sure the priority model server is running:\n\n1. Open terminal\n2. cd src/priorityModel\n3. npm install\n4. npm start\n\nServer should run on http://localhost:5001`);
      } else {
        alert(`❌ Priority Prediction Failed\n\nError: ${error.message}\n\nPlease try again or check the console for details.`);
      }
    } finally {
      setPredictingPriority(null);
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
          <div className="page-header">
            <h1>Reported Issues</h1>
            <p>Loading issues from database...</p>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Fetching latest issues...</p>
          </div>
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
                    <p className="issue-reporter">
                      Reported by: {issue.citizens?.name || 'Anonymous'} 
                      {issue.citizens?.email && ` (${issue.citizens.email})`}
                    </p>
                    {issue.assigned_to && (
                      <p className="issue-assignment">
                        👤 Assigned to: {issue.assigned_to}
                      </p>
                    )}
                  </div>

                  <div className="issue-actions">
                    {editingIssue === issue.id ? (
                      // Edit Mode
                      <>
                        <div className="edit-controls">
                          <div className="edit-field">
                            <label>Status:</label>
                            <select
                              value={editValues.status}
                              onChange={(e) => setEditValues({...editValues, status: e.target.value})}
                              disabled={updatingStatus === issue.id}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </div>
                          
                          <div className="edit-field">
                            <label>Priority:</label>
                            <select
                              value={editValues.priority}
                              onChange={(e) => setEditValues({...editValues, priority: e.target.value})}
                              disabled={updatingStatus === issue.id}
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                          
                          <div className="edit-field">
                            <label>Assign to:</label>
                            <input
                              type="text"
                              placeholder="Enter staff name/ID"
                              value={editValues.assigned_to}
                              onChange={(e) => setEditValues({...editValues, assigned_to: e.target.value})}
                              disabled={updatingStatus === issue.id}
                            />
                          </div>
                        </div>
                        
                        <div className="edit-actions">
                          {updatingStatus === issue.id ? (
                            <span className="updating-status">Saving...</span>
                          ) : (
                            <>
                              <button 
                                className="btn-save"
                                onClick={() => saveChanges(issue.id)}
                              >
                                Save Changes
                              </button>
                              <button 
                                className="btn-cancel"
                                onClick={cancelEditing}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      // View Mode
                      <div className="view-actions">
                        <div className="view-info">
                          <span className="info-item">
                            <strong>Status:</strong> 
                            <span 
                              className="status-badge-small"
                              style={{ backgroundColor: getStatusColor(issue.status) }}
                            >
                              {issue.status}
                            </span>
                          </span>
                          <span className="info-item">
                            <strong>Priority:</strong> 
                            <span 
                              className="priority-badge-small"
                              style={{ backgroundColor: getPriorityColor(issue.priority) }}
                            >
                              {issue.priority}
                            </span>
                          </span>
                          {issue.assigned_to && (
                            <span className="info-item">
                              <strong>Assigned:</strong> {issue.assigned_to}
                            </span>
                          )}
                        </div>
                        
                        <div className="action-buttons">
                          <button className="btn-view">
                            <Eye size={16} />
                            View Details
                          </button>
                          <button 
                            className="btn-predict"
                            onClick={() => predictPriority(issue)}
                            disabled={predictingPriority === issue.id}
                          >
                            <Brain size={16} />
                            {predictingPriority === issue.id ? 'Predicting...' : 'AI Priority'}
                          </button>
                          <button 
                            className="btn-edit"
                            onClick={() => startEditing(issue)}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
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
