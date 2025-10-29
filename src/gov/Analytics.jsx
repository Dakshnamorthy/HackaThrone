import React, { useState, useEffect } from 'react';
import GovNavbar from '../components/GovNavbar';
import { BarChart3, TrendingUp, PieChart, Calendar, Download, Filter } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/SimpleAuthContext';
import './Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalIssues: 0,
    issuesByStatus: {},
    issuesByType: {},
    issuesByMonth: {},
    resolutionTime: 0,
    departmentPerformance: {}
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      let query = supabase.from('issues').select('*');
      
      // Apply time range filter
      if (timeRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case '7days':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(now.getDate() - 90);
            break;
          case '1year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: issues, error } = await query;
      if (error) throw error;

      // Process analytics data
      const processedData = processAnalyticsData(issues || []);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (issues) => {
    const totalIssues = issues.length;
    
    // Issues by status
    const issuesByStatus = issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {});

    // Issues by type
    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});

    // Issues by month
    const issuesByMonth = issues.reduce((acc, issue) => {
      const month = new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Calculate average resolution time (for resolved issues)
    const resolvedIssues = issues.filter(issue => issue.status === 'Resolved');
    const totalResolutionTime = resolvedIssues.reduce((acc, issue) => {
      const created = new Date(issue.created_at);
      const updated = new Date(issue.updated_at);
      return acc + (updated - created);
    }, 0);
    
    const avgResolutionTime = resolvedIssues.length > 0 
      ? Math.round(totalResolutionTime / resolvedIssues.length / (1000 * 60 * 60 * 24)) 
      : 0;

    // Department performance (mock data based on issue types)
    const departmentPerformance = {
      'Electrical Department': {
        assigned: issues.filter(i => i.type === 'Electrical').length,
        resolved: issues.filter(i => i.type === 'Electrical' && i.status === 'Resolved').length
      },
      'Sanitation Department': {
        assigned: issues.filter(i => i.type === 'Garbage').length,
        resolved: issues.filter(i => i.type === 'Garbage' && i.status === 'Resolved').length
      },
      'Public Works Department': {
        assigned: issues.filter(i => ['Road', 'Infrastructure'].includes(i.type)).length,
        resolved: issues.filter(i => ['Road', 'Infrastructure'].includes(i.type) && i.status === 'Resolved').length
      }
    };

    return {
      totalIssues,
      issuesByStatus,
      issuesByType,
      issuesByMonth,
      resolutionTime: avgResolutionTime,
      departmentPerformance
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'In Progress': return '#2196f3';
      case 'Resolved': return '#4caf50';
      default: return '#757575';
    }
  };

  const getTypeColor = (type, index) => {
    const colors = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6', '#1abc9c'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <>
        <GovNavbar />
        <div className="analytics-container">
          <div className="loading">Loading analytics...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <GovNavbar />
      <div className="analytics-container">
        <div className="page-header">
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive insights into civic issue management</p>
        </div>

        <div className="analytics-controls">
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
          <button className="export-btn">
            <Download size={16} />
            Export Report
          </button>
        </div>

        <div className="analytics-grid">
          {/* Key Metrics */}
          <div className="metric-cards">
            <div className="metric-card">
              <div className="metric-icon">
                <BarChart3 size={24} />
              </div>
              <div className="metric-content">
                <h3>{analyticsData.totalIssues}</h3>
                <p>Total Issues</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">
                <TrendingUp size={24} />
              </div>
              <div className="metric-content">
                <h3>{analyticsData.resolutionTime}</h3>
                <p>Avg Resolution (Days)</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">
                <PieChart size={24} />
              </div>
              <div className="metric-content">
                <h3>{Math.round((analyticsData.issuesByStatus['Resolved'] || 0) / analyticsData.totalIssues * 100) || 0}%</h3>
                <p>Resolution Rate</p>
              </div>
            </div>
          </div>

          {/* Issues by Status Chart */}
          <div className="chart-card">
            <h3>Issues by Status</h3>
            <div className="status-chart">
              {Object.entries(analyticsData.issuesByStatus).map(([status, count]) => (
                <div key={status} className="status-bar">
                  <div className="status-info">
                    <span className="status-name">{status}</span>
                    <span className="status-count">{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(count / analyticsData.totalIssues) * 100}%`,
                        backgroundColor: getStatusColor(status)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues by Type Chart */}
          <div className="chart-card">
            <h3>Issues by Type</h3>
            <div className="type-chart">
              {Object.entries(analyticsData.issuesByType).map(([type, count], index) => (
                <div key={type} className="type-item">
                  <div 
                    className="type-color"
                    style={{ backgroundColor: getTypeColor(type, index) }}
                  ></div>
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="chart-card full-width">
            <h3>Monthly Issue Trend</h3>
            <div className="trend-chart">
              {Object.entries(analyticsData.issuesByMonth).map(([month, count]) => (
                <div key={month} className="trend-item">
                  <div className="trend-bar">
                    <div 
                      className="trend-fill"
                      style={{ 
                        height: `${(count / Math.max(...Object.values(analyticsData.issuesByMonth))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="trend-label">{month}</span>
                  <span className="trend-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Performance */}
          <div className="chart-card full-width">
            <h3>Department Performance</h3>
            <div className="department-performance">
              {Object.entries(analyticsData.departmentPerformance).map(([dept, data]) => {
                const resolutionRate = data.assigned > 0 ? Math.round((data.resolved / data.assigned) * 100) : 0;
                return (
                  <div key={dept} className="dept-item">
                    <div className="dept-info">
                      <h4>{dept}</h4>
                      <div className="dept-stats">
                        <span>Assigned: {data.assigned}</span>
                        <span>Resolved: {data.resolved}</span>
                        <span>Rate: {resolutionRate}%</span>
                      </div>
                    </div>
                    <div className="dept-progress">
                      <div 
                        className="dept-progress-fill"
                        style={{ width: `${resolutionRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;
