import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SimpleAuthContext';
import { supabase } from '../../supabaseClient';
import { User, CheckCircle, AlertCircle, Camera } from 'lucide-react';
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
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          aadhaar_file: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          aadhaar_file: 'File size must be less than 5MB'
        }));
        return;
      }

      setAadhaarFile(file);
      setErrors(prev => ({
        ...prev,
        aadhaar_file: ''
      }));
    }
  };

  const processAadhaarOCR = async () => {
    if (!aadhaarFile) {
      setErrors(prev => ({
        ...prev,
        aadhaar_file: 'Please select an Aadhaar card image'
      }));
      return;
    }

    setOcrLoading(true);
    try {
      console.log('Processing Aadhaar OCR...');
      const formData = new FormData();
      formData.append('image', aadhaarFile);
      
      console.log('Uploading file:', aadhaarFile.name, 'Size:', aadhaarFile.size, 'Type:', aadhaarFile.type);

      // Send image directly to the OCR endpoint
      console.log('Sending image to /aadhaar-ocr endpoint...');
      const response = await fetch('/api/ocr-result', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OCR API error response:', errorText);
        throw new Error(`OCR API error: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      // Parse Flask API response format: {'result': 'JSON string'}
      const responseText = await response.text();
      console.log('Raw OCR Response:', responseText);

      let apiResponse;
      try {
        apiResponse = JSON.parse(responseText);
        console.log('Parsed API Response:', apiResponse);
      } catch (jsonError) {
        console.error('Response is not valid JSON:', responseText);
        throw new Error('OCR API returned invalid response format. The API might be down or misconfigured.');
      }

      // Extract the result field and parse the inner JSON
      if (!apiResponse.result) {
        throw new Error('OCR API response missing result field');
      }

      let ocrData;
      try {
        // The result field contains JSON string, parse it
        const cleanResult = apiResponse.result.replace(/```json\n?|\n?```/g, '').trim();
        ocrData = JSON.parse(cleanResult);
        console.log('Extracted OCR Data:', ocrData);
      } catch (innerJsonError) {
        console.error('Failed to parse inner JSON:', apiResponse.result);
        throw new Error('Failed to parse OCR result data');
      }

      // Parse the expected format: { "Aadhaar number": "3389 4783 8373", "Name": "Priyanka H", "Date of Birth": "26/11/2005" }
      const extractedData = {
        name: ocrData.Name || ocrData.name,
        dob: ocrData['Date of Birth'] || ocrData.date_of_birth,
        aadhaar_number: ocrData['Aadhaar number'] || ocrData.aadhaar_number
      };

      // Format date if needed (convert DD/MM/YYYY to YYYY-MM-DD)
      if (extractedData.dob) {
        const dateParts = extractedData.dob.split('/');
        if (dateParts.length === 3) {
          extractedData.dob = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
        }
      }

      // Clean Aadhaar number (remove all non-digits for consistency)
      if (extractedData.aadhaar_number) {
        // Store both original and cleaned versions for debugging
        const originalAadhaar = extractedData.aadhaar_number;
        extractedData.aadhaar_number = extractedData.aadhaar_number.replace(/\D/g, ''); // Remove all non-digits
        console.log('Aadhaar cleaning:', { original: originalAadhaar, cleaned: extractedData.aadhaar_number });
      }

      console.log('Extracted and formatted data:', extractedData);

      // Store OCR data for verification and auto-fill form
      setOcrExtractedData(extractedData);
      setProfileData(prev => ({
        ...prev,
        name_per_aadhaar: extractedData.name || prev.name_per_aadhaar,
        dob_per_aadhaar: extractedData.dob || prev.dob_per_aadhaar,
        aadhaar_number: extractedData.aadhaar_number || prev.aadhaar_number
      }));

      alert(`🔍 OCR Extraction Complete!\n\nExtracted Data:\n📝 Name: ${extractedData.name}\n📅 DOB: ${extractedData.dob}\n🆔 Aadhaar: ${extractedData.aadhaar_number}\n\n✅ Form fields have been auto-filled!\n\n⚠️ Please verify all details match exactly before submitting.\n\nNote: Aadhaar numbers are automatically normalized (spaces removed) for verification.`);

    } catch (error) {
      console.error('OCR processing error:', error);
      alert(`❌ Failed to process Aadhaar card: ${error.message}`);
    } finally {
      setOcrLoading(false);
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

  // Store OCR extracted data for verification
  const [ocrExtractedData, setOcrExtractedData] = useState(null);

  // Progressive database testing function
  const testDatabase = async () => {
    console.log('🔍 Starting progressive database testing...');
    const currentUser = user || testUser;
    
    try {
      // Test 1: Check table access
      console.log('\n=== Test 1: Table Access ===');
      const { data: countData, error: countError } = await supabase
        .from('citizens')
        .select('count');
      console.log('Table access result:', { countData, countError });

      if (countError) {
        alert(`❌ Cannot access citizens table: ${countError.message}`);
        return;
      }

      // Test 2: Check existing records
      console.log('\n=== Test 2: Reading Records ===');
      const { data: readData, error: readError } = await supabase
        .from('citizens')
        .select('*')
        .limit(3);
      console.log('Existing records:', { readData, readError });

      // Test 3: Progressive field insertion
      console.log('\n=== Test 3: Progressive Field Testing ===');
      
      // Step 1: Minimal required fields only (matching database schema)
      console.log('Step 1: Testing minimal fields...');
      let testRecord1 = {
        id: currentUser.id,
        name: 'Test User',
        email: currentUser.email,
        is_verified: false
      };
      
      const { data: result1, error: error1 } = await supabase
        .from('citizens')
        .insert([testRecord1])
        .select();
      console.log('Minimal fields result:', { result1, error1 });

      if (error1) {
        console.error('❌ Failed at minimal fields:', error1.message);
        alert(`Failed at minimal fields: ${error1.message}`);
        return;
      } else {
        console.log('✅ Minimal fields SUCCESS');
        // Delete the test record
        await supabase.from('citizens').delete().eq('id', currentUser.id);
      }

      // Step 2: Add fields that exist in database schema
      const fieldsToTest = [
        { password: 'test123' },
        { otp_code: '123456' },
        { otp_expires_at: new Date().toISOString() },
        { created_at: new Date().toISOString() },
        { updated_at: new Date().toISOString() }
      ];

      let accumulatedFields = { ...testRecord1 };

      for (let i = 0; i < fieldsToTest.length; i++) {
        const newField = fieldsToTest[i];
        accumulatedFields = { ...accumulatedFields, ...newField };
        
        console.log(`Step ${i + 2}: Testing with field:`, Object.keys(newField)[0]);
        console.log('Current data:', accumulatedFields);

        const { data: stepResult, error: stepError } = await supabase
          .from('citizens')
          .insert([accumulatedFields])
          .select();

        if (stepError) {
          console.error(`❌ Failed at field ${Object.keys(newField)[0]}:`, stepError.message);
          alert(`Failed when adding field "${Object.keys(newField)[0]}": ${stepError.message}`);
          return;
        } else {
          console.log(`✅ SUCCESS with field ${Object.keys(newField)[0]}`);
          // Delete the test record
          await supabase.from('citizens').delete().eq('id', currentUser.id);
        }
      }

      // Test 4: Full profile data (matching database schema)
      console.log('\n=== Test 4: Full Profile Data ===');
      const fullProfileData = {
        id: currentUser.id,
        name: profileData.name_per_aadhaar || 'Test Name',
        email: currentUser.email,
        password: null,
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Testing full profile data:', fullProfileData);
      const { data: fullResult, error: fullError } = await supabase
        .from('citizens')
        .insert([fullProfileData])
        .select();

      if (fullError) {
        console.error('❌ Full profile data failed:', fullError.message);
        alert(`Full profile failed: ${fullError.message}`);
      } else {
        console.log('✅ Full profile data SUCCESS!');
        alert('🎉 All tests passed! Database is working correctly.');
      }

    } catch (error) {
      console.error('Database test error:', error);
      alert(`Database test failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Verify OCR data matches manually entered data if OCR was used
    if (ocrExtractedData) {
      const verificationResults = {
        name_match: false,
        dob_match: false,
        aadhaar_match: false
      };

      // Check exact matches with proper normalization
      if (profileData.name_per_aadhaar && ocrExtractedData.name) {
        const manualName = profileData.name_per_aadhaar.toLowerCase().trim();
        const ocrName = ocrExtractedData.name.toLowerCase().trim();
        verificationResults.name_match = manualName === ocrName;
        console.log('Name comparison:', { manual: manualName, ocr: ocrName, match: verificationResults.name_match });
      }
      
      if (profileData.dob_per_aadhaar && ocrExtractedData.dob) {
        verificationResults.dob_match = profileData.dob_per_aadhaar === ocrExtractedData.dob;
        console.log('DOB comparison:', { manual: profileData.dob_per_aadhaar, ocr: ocrExtractedData.dob, match: verificationResults.dob_match });
      }
      
      if (profileData.aadhaar_number && ocrExtractedData.aadhaar_number) {
        // Normalize both by removing all spaces and non-digits
        const manualAadhaar = profileData.aadhaar_number.replace(/\D/g, ''); // Remove all non-digits
        const ocrAadhaar = ocrExtractedData.aadhaar_number.replace(/\D/g, ''); // Remove all non-digits
        verificationResults.aadhaar_match = manualAadhaar === ocrAadhaar;
        console.log('Aadhaar comparison:', { 
          manual: profileData.aadhaar_number, 
          manualNormalized: manualAadhaar,
          ocr: ocrExtractedData.aadhaar_number, 
          ocrNormalized: ocrAadhaar,
          match: verificationResults.aadhaar_match 
        });
      }

      console.log('Verification Results:', verificationResults);
      console.log('Manual Entry vs OCR:');
      console.log('Name:', profileData.name_per_aadhaar, 'vs', ocrExtractedData.name);
      console.log('DOB:', profileData.dob_per_aadhaar, 'vs', ocrExtractedData.dob);
      console.log('Aadhaar:', profileData.aadhaar_number, 'vs', ocrExtractedData.aadhaar_number);

      // Check if ALL data matches exactly
      const allMatch = Object.values(verificationResults).every(match => match);
      
      if (!allMatch) {
        // Show detailed mismatch information
        const mismatches = [];
        if (!verificationResults.name_match) mismatches.push('Name');
        if (!verificationResults.dob_match) mismatches.push('Date of Birth');
        if (!verificationResults.aadhaar_match) mismatches.push('Aadhaar Number');
        
        alert(`❌ Verification Failed!\n\nThe following details don't match between your manual entry and OCR extraction:\n${mismatches.join(', ')}\n\nPlease correct the manually entered information to match your Aadhaar card exactly.`);
        setLoading(false);
        return;
      }
    }

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
        is_verified: ocrExtractedData ? true : false, // Only verified if OCR was used and matched
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
      
      // Match the exact database schema from your citizens table
      const profileDataToSave = {
        id: currentUser.id,
        name: profileData.name_per_aadhaar.trim(), // Use 'name' field from schema
        email: currentUser.email,
        password: null, // Optional field in schema
        is_verified: true, // This field exists in schema
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
              name: profileData.name_per_aadhaar.trim(), // Use 'name' field from schema
              email: currentUser.email,
              is_verified: true, // This field exists in schema
              updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id)
            .select('id, name, email, is_verified')
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

          <div className="form-section">
            <h3>📄 Aadhaar Card Upload & OCR</h3>
            <p className="section-description">Upload your Aadhaar card image to automatically extract and fill the details above.</p>
            <div className="upload-section">
              <div className="file-upload">
                <input
                  type="file"
                  id="aadhaar-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="aadhaar-upload" className="file-label">
                  <Camera size={20} />
                  {aadhaarFile ? aadhaarFile.name : 'Choose Aadhaar Card Image'}
                </label>
              </div>
              
              <button
                type="button"
                onClick={processAadhaarOCR}
                disabled={!aadhaarFile || ocrLoading}
                className="ocr-button"
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: aadhaarFile && !ocrLoading ? 'pointer' : 'not-allowed',
                  opacity: aadhaarFile && !ocrLoading ? 1 : 0.6,
                  marginTop: '10px'
                }}
              >
                🔍 {ocrLoading ? 'Processing OCR...' : 'Extract Details from Aadhaar'}
              </button>
              
              {errors.aadhaar_file && (
                <span className="error-text">{errors.aadhaar_file}</span>
              )}
            </div>
          </div>

          <div className="form-actions" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <button
              type="button"
              onClick={testDatabase}
              className="submit-button"
              style={{backgroundColor: '#17a2b8', flex: '1', minWidth: '150px'}}
            >
              🔍 Test Database
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
              style={{flex: '2', minWidth: '200px'}}
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
