import React, { useState, useEffect } from 'react';
import GovNavbar from '../components/GovNavbar';
import { BarChart3, Users, FileText, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/SimpleAuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalIssues: 0,
    pendingIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    totalStaff: 6,
    recentIssues: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch issues statistics
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalIssues = issues?.length || 0;
      const pendingIssues = issues?.filter(issue => issue.status === 'Pending').length || 0;
      const inProgressIssues = issues?.filter(issue => issue.status === 'In Progress').length || 0;
      const resolvedIssues = issues?.filter(issue => issue.status === 'Resolved').length || 0;
      const recentIssues = issues?.slice(0, 5) || [];

      setStats({
        totalIssues,
        pendingIssues,
        inProgressIssues,
        resolvedIssues,
        totalStaff: 6,
        recentIssues
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ backgroundColor: bgColor }}>
        <Icon size={24} color={color} />
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'In Progress': return '#2196f3';
      case 'Resolved': return '#4caf50';
      default: return '#757575';
    }
  };

  return (
    <>
      <GovNavbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Government Staff Dashboard</h1>
          <p>Monitor and manage civic issues across the city</p>
        </div>

        <div className="stats-grid">
          <StatCard
            icon={FileText}
            title="Total Issues"
            value={stats.totalIssues}
            color="#2196f3"
            bgColor="#e3f2fd"
          />
          <StatCard
            icon={Clock}
            title="Pending Issues"
            value={stats.pendingIssues}
            color="#ff9800"
            bgColor="#fff3e0"
          />
          <StatCard
            icon={TrendingUp}
            title="In Progress"
            value={stats.inProgressIssues}
            color="#2196f3"
            bgColor="#e3f2fd"
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved Issues"
            value={stats.resolvedIssues}
            color="#4caf50"
            bgColor="#e8f5e8"
          />
          <StatCard
            icon={Users}
            title="Active Staff"
            value={stats.totalStaff}
            color="#9c27b0"
            bgColor="#f3e5f5"
          />
          <StatCard
            icon={AlertTriangle}
            title="High Priority"
            value={stats.recentIssues.filter(issue => issue.priority === 'High').length}
            color="#f44336"
            bgColor="#ffebee"
          />
        </div>

        <div className="dashboard-content">
          <div className="recent-issues">
            <h2>Recent Issues</h2>
            <div className="issues-list">
              {stats.recentIssues.length > 0 ? (
                stats.recentIssues.map((issue) => (
                  <div key={issue.id} className="issue-item">
                    <div className="issue-info">
                      <h4>{issue.issue_id}</h4>
                      <p>{issue.description}</p>
                      <small>{issue.location}</small>
                    </div>
                    <div className="issue-meta">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(issue.status) }}
                      >
                        {issue.status}
                      </span>
                      <span className="issue-type">{issue.type}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-issues">No issues reported yet</p>
              )}
            </div>
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <button className="action-btn">
                <FileText size={20} />
                View All Issues
              </button>
              <button className="action-btn">
                <Users size={20} />
                Manage Staff
              </button>
              <button className="action-btn">
                <BarChart3 size={20} />
                View Analytics
              </button>
              <button className="action-btn">
                <AlertTriangle size={20} />
                Priority Issues
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
