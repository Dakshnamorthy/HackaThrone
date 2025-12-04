// Quick test to verify Supabase connection
import { supabase } from './supabaseClient.js';

console.log('🔍 Testing Supabase connection...');
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL || 'Not set');

async function testConnection() {
  try {
    // Test 1: Simple select
    console.log('\n📊 Test 1: Fetching all issues...');
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Success! Fetched', data?.length, 'issue(s)');
      console.log('Sample issue:', data?.[0]);
      console.log('Has priority_score?', 'priority_score' in (data?.[0] || {}));
    }
    
    // Test 2: Check column
    if (data && data.length > 0) {
      console.log('\n📋 Available columns:', Object.keys(data[0]));
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();
