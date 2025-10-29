import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SimpleAuthContext';
import { supabase } from '../../supabaseClient';
import { User, CheckCircle, AlertCircle } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  
  // Temporary user for testing (remove in production)
  const testUser = !user ? {
    id: '2fbe79d8-a44c-45be-a921-7684f0405784',
    email: 'test@example.com',
    name: 'Test User'
  } : null;
  const [profileData, setProfileData] = useState({
    name_per_aadhaar: '',
    dob_per_aadhaar: '',
    gender: '',
    nationality: 'Indian',
    fathers_name: '',
    mobile_number: '',
    email: user?.email || '',
    aadhaar_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState({
    profile_completed: false,
    is_verified: false,
    verification_status: 'pending'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const currentUser = user || testUser;
    if (currentUser) {
      fetchProfileData();
    }
  }, [user, testUser]);

  const fetchProfileData = async () => {
    const currentUser = user || testUser;
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfileData({
          name_per_aadhaar: data.name_per_aadhaar || '',
          dob_per_aadhaar: data.dob_per_aadhaar || '',
          gender: data.gender || '',
          nationality: data.nationality || 'Indian',
          fathers_name: data.fathers_name || '',
          mobile_number: data.mobile_number || '',
          email: data.email || user.email,
          aadhaar_number: data.aadhaar_number || ''
        });
        setProfileStatus({
          profile_completed: data.profile_completed || false,
          is_verified: data.is_verified || false,
          verification_status: data.verification_status || 'pending'
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profileData.name_per_aadhaar.trim()) {
      newErrors.name_per_aadhaar = 'Name as per Aadhaar is required';
    }

    if (!profileData.dob_per_aadhaar) {
      newErrors.dob_per_aadhaar = 'Date of birth is required';
    }

    if (!profileData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!profileData.fathers_name.trim()) {
      newErrors.fathers_name = 'Father\'s name is required';
    }

    if (!profileData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(profileData.mobile_number)) {
      newErrors.mobile_number = 'Please enter a valid 10-digit mobile number';
    }

    if (!profileData.aadhaar_number.trim()) {
      newErrors.aadhaar_number = 'Aadhaar number is required';
    } else if (!/^\d{12}$/.test(profileData.aadhaar_number.replace(/\s/g, ''))) {
      newErrors.aadhaar_number = 'Please enter a valid 12-digit Aadhaar number';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Simple verification - just mark as verified when form is submitted
    console.log('Form submitted with profile data:', profileData);

    setLoading(true);
    console.log('Starting profile submission...');

    try {
      const currentUser = user || testUser;
      console.log('User ID:', currentUser.id);
      console.log('Profile data to save:', {
        name_per_aadhaar: profileData.name_per_aadhaar.trim(),
        dob_per_aadhaar: profileData.dob_per_aadhaar,
        gender: profileData.gender,
        nationality: profileData.nationality,
        fathers_name: profileData.fathers_name.trim(),
        mobile_number: profileData.mobile_number.trim(),
        aadhaar_number: profileData.aadhaar_number.replace(/\s/g, ''),
        is_verified: true, // Always mark as verified when form is submitted
        profile_completed: true
      });

      // Test database connection first
      console.log('Testing database connection...');
      try {
        const { data: testData, error: testError } = await supabase
          .from('citizens')
          .select('count')
          .limit(1);
        console.log('Database connection test:', { testData, testError });
      } catch (connError) {
        console.error('Database connection failed:', connError);
      }

      // Prepare data for database save
      console.log('Preparing profile data for database...');
      
      // Save all form fields to match your database schema
      const profileDataToSave = {
        id: currentUser.id,
        name: profileData.name_per_aadhaar.trim(),
        email: currentUser.email,
        password: null,
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // All the profile form fields
        name_per_aadhaar: profileData.name_per_aadhaar.trim(),
        dob_per_aadhaar: profileData.dob_per_aadhaar,
        gender: profileData.gender,
        nationality: profileData.nationality || 'Indian',
        fathers_name: profileData.fathers_name.trim(),
        mobile_number: profileData.mobile_number.trim(),
        aadhaar_number: profileData.aadhaar_number.replace(/\s/g, ''),
        aadhaar_image_url: null, // No image upload
        profile_completed: true
      };

      console.log('Data formatted for database schema:', profileDataToSave);

      console.log('Final data to save:', JSON.stringify(profileDataToSave, null, 2));

      // Try INSERT first (for new records)
      console.log('Attempting INSERT operation...');
      let saveSuccess = false;
      let finalError = null;

      try {
        const { data: insertData, error: insertError } = await supabase
          .from('citizens')
          .insert([profileDataToSave])
          .select('id, is_verified, profile_completed')
          .single();

        console.log('INSERT result:', { data: insertData, error: insertError });

        if (!insertError) {
          console.log('✅ INSERT successful!');
          saveSuccess = true;
        } else {
          throw insertError;
        }
      } catch (insertErr) {
        console.log('INSERT failed, trying UPDATE...', insertErr.message);
        finalError = insertErr;

        // If INSERT fails, try UPDATE
        try {
          const { data: updateData, error: updateError } = await supabase
            .from('citizens')
            .update({
              name: profileData.name_per_aadhaar.trim(),
              email: currentUser.email,
              is_verified: true,
              updated_at: new Date().toISOString(),
              // All the profile form fields
              name_per_aadhaar: profileData.name_per_aadhaar.trim(),
              dob_per_aadhaar: profileData.dob_per_aadhaar,
              gender: profileData.gender,
              nationality: profileData.nationality || 'Indian',
              fathers_name: profileData.fathers_name.trim(),
              mobile_number: profileData.mobile_number.trim(),
              aadhaar_number: profileData.aadhaar_number.replace(/\s/g, ''),
              profile_completed: true
            })
            .eq('id', currentUser.id)
            .select('id, name, email, is_verified, profile_completed')
            .single();

          console.log('UPDATE result:', { data: updateData, error: updateError });

          if (!updateError) {
            console.log('✅ UPDATE successful!');
            saveSuccess = true;
          } else {
            finalError = updateError;
          }
        } catch (updateErr) {
          console.log('UPDATE also failed:', updateErr.message);
          finalError = updateErr;
        }
      }

      if (!saveSuccess) {
        console.error('❌ All database operations failed. Final error:', finalError);
        throw new Error(`Database save failed: ${finalError?.message || 'Unknown error'}`);
      }

      console.log('Profile submission completed successfully');
      alert('✅ Profile completed and verified successfully!');
      
      // Update local state to reflect successful save
      setProfileData(prev => ({
        ...prev,
        is_verified: true,
        profile_completed: true
      }));
      
      setProfileStatus({
        profile_completed: true,
        is_verified: true,
        verification_status: 'verified'
      });

      // Force a page refresh to update verification status across the app
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`❌ Submission failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (profileStatus.is_verified) {
      return <CheckCircle className="status-icon verified" size={20} />;
    } else if (profileStatus.profile_completed) {
      return <AlertCircle className="status-icon pending" size={20} />;
    } else {
      return <User className="status-icon incomplete" size={20} />;
    }
  };

  const getStatusText = () => {
    if (profileStatus.is_verified) {
      return 'Profile Verified ✅';
    } else if (profileStatus.profile_completed) {
      return 'Verification Pending ⏳';
    } else {
      return 'Profile Incomplete ❌';
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>
          {getStatusIcon()}
          Citizen Profile
        </h2>
        <p>{getStatusText()}</p>
      </div>

      {profileData.is_verified ? (
        <div className="profile-completed">
          <div className="completion-message">
            <CheckCircle className="success-icon" size={48} />
            <h2>Profile Verified Successfully!</h2>
            <p>Your profile has been completed and verified. You can now access all features.</p>
          </div>
          <div className="profile-summary">
            <h3>Profile Summary</h3>
            <div className="profile-info">
              <div className="info-item">
                <strong>Name as per Aadhaar:</strong> {profileData.name_per_aadhaar}
              </div>
              <div className="info-item">
                <strong>Date of Birth:</strong> {profileData.dob_per_aadhaar}
              </div>
              <div className="info-item">
                <strong>Gender:</strong> {profileData.gender}
              </div>
              <div className="info-item">
                <strong>Nationality:</strong> {profileData.nationality}
              </div>
              <div className="info-item">
                <strong>Father's Name:</strong> {profileData.fathers_name}
              </div>
              <div className="info-item">
                <strong>Mobile Number:</strong> {profileData.mobile_number}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {profileData.email}
              </div>
              <div className="info-item">
                <strong>Aadhaar Number:</strong> {profileData.aadhaar_number}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3>👤 Personal Information</h3>
            <p className="section-description">Please enter your details exactly as they appear on your Aadhaar card.</p>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name_per_aadhaar">Name as per Aadhaar *</label>
                <input
                  type="text"
                  id="name_per_aadhaar"
                  name="name_per_aadhaar"
                  value={profileData.name_per_aadhaar}
                  onChange={handleInputChange}
                  className={errors.name_per_aadhaar ? 'error' : ''}
                  placeholder="Full name as printed on Aadhaar"
                />
                {errors.name_per_aadhaar && (
                  <span className="error-text">{errors.name_per_aadhaar}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dob_per_aadhaar">Date of Birth *</label>
                <input
                  type="date"
                  id="dob_per_aadhaar"
                  name="dob_per_aadhaar"
                  value={profileData.dob_per_aadhaar}
                  onChange={handleInputChange}
                  className={errors.dob_per_aadhaar ? 'error' : ''}
                />
                {errors.dob_per_aadhaar && (
                  <span className="error-text">{errors.dob_per_aadhaar}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleInputChange}
                  className={errors.gender ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <span className="error-text">{errors.gender}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="nationality">Nationality</label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={profileData.nationality}
                  onChange={handleInputChange}
                  placeholder="Indian"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fathers_name">Father's Name *</label>
                <input
                  type="text"
                  id="fathers_name"
                  name="fathers_name"
                  value={profileData.fathers_name}
                  onChange={handleInputChange}
                  className={errors.fathers_name ? 'error' : ''}
                  placeholder="Father's full name"
                />
                {errors.fathers_name && (
                  <span className="error-text">{errors.fathers_name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="mobile_number">Mobile Number *</label>
                <input
                  type="tel"
                  id="mobile_number"
                  name="mobile_number"
                  value={profileData.mobile_number}
                  onChange={handleInputChange}
                  className={errors.mobile_number ? 'error' : ''}
                  placeholder="10-digit mobile number"
                  maxLength="10"
                />
                {errors.mobile_number && (
                  <span className="error-text">{errors.mobile_number}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label htmlFor="aadhaar_number">Aadhaar Number *</label>
                <input
                  type="text"
                  id="aadhaar_number"
                  name="aadhaar_number"
                  value={profileData.aadhaar_number}
                  onChange={handleInputChange}
                  className={errors.aadhaar_number ? 'error' : ''}
                  placeholder="12-digit Aadhaar number"
                  maxLength="12"
                />
                {errors.aadhaar_number && (
                  <span className="error-text">{errors.aadhaar_number}</span>
                )}
              </div>
            </div>
          </div>


          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Submitting...' : 'Complete Profile & Verify'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
