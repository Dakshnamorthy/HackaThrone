import React, { useState, useEffect } from 'react';
import GovNavbar from '../components/GovNavbar';
import { Users, Mail, Phone, MapPin, Calendar, Building } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/SimpleAuthContext';
import './StaffManagement.css';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('government_staff')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'All' || member.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(staff.map(member => member.department))];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <>
        <GovNavbar />
        <div className="staff-management-container">
          <div className="loading">Loading staff...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <GovNavbar />
      <div className="staff-management-container">
        <div className="page-header">
          <h1>Staff Management</h1>
          <p>Manage government staff members and their information</p>
        </div>

        <div className="staff-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <h3>{staff.length}</h3>
              <p>Total Staff</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Building size={24} />
            </div>
            <div className="stat-info">
              <h3>{departments.length}</h3>
              <p>Departments</p>
            </div>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-controls">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="staff-grid">
          {filteredStaff.map((member) => (
            <div key={member.id} className="staff-card">
              <div className="staff-avatar">
                {getInitials(member.name)}
              </div>
              
              <div className="staff-info">
                <h3>{member.name}</h3>
                <p className="staff-id">ID: {member.unique_id}</p>
                
                <div className="staff-details">
                  <div className="detail-item">
                    <Building size={16} />
                    <span>{member.department}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Mail size={16} />
                    <span>{member.email}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Phone size={16} />
                    <span>{member.contact}</span>
                  </div>
                  
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{member.address}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>DOB: {formatDate(member.dob)}</span>
                  </div>
                </div>

                <div className="staff-meta">
                  <span className={`gender-badge ${member.gender.toLowerCase()}`}>
                    {member.gender}
                  </span>
                  <span className="join-date">
                    Joined: {formatDate(member.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="no-staff">
            <p>No staff members found matching your criteria.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default StaffManagement;
