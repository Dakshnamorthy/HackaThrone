# Diagnose Priority Score Issue

## 🔍 Step-by-Step Diagnosis

### Step 1: Verify Column Exists in Supabase

**Go to Supabase SQL Editor:**
https://supabase.com/dashboard/project/lksrqjyinjhsodnnudfm/sql/new

**Run this query:**
```sql
-- Check if priority_score column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'issues' 
  AND column_name = 'priority_score';
```

**Expected Result:**
```
column_name     | data_type         | is_nullable | column_default
----------------|-------------------|-------------|----------------
priority_score  | double precision  | YES         | NULL
```

**If NO ROWS returned:**
- Column doesn't exist! Run:
```sql
ALTER TABLE issues ADD COLUMN priority_score DOUBLE PRECISION;
```

---

### Step 2: Check RLS Policies

**Run this query:**
```sql
-- Check Row Level Security policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'issues';
```

**Look for UPDATE policies that might be blocking the column.**

**If policies are too restrictive, temporarily disable RLS:**
```sql
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;
```

**Or create a permissive policy:**
```sql
CREATE POLICY "Allow all updates for testing"
ON issues
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### Step 3: Test Direct Update

**Try updating a record directly:**
```sql
-- Get a sample issue ID
SELECT id, issue_id, priority, priority_score 
FROM issues 
LIMIT 1;

-- Try to update it (replace with actual ID)
UPDATE issues 
SET priority_score = 0.75 
WHERE id = 'your-issue-id-here';

-- Verify the update
SELECT id, issue_id, priority, priority_score 
FROM issues 
WHERE id = 'your-issue-id-here';
```

**If this fails, check the error message carefully.**

---

### Step 4: Check Data Type

**Verify the column accepts DOUBLE PRECISION:**
```sql
-- Try inserting a test value
UPDATE issues 
SET priority_score = 0.756::double precision
WHERE issue_id = (SELECT issue_id FROM issues LIMIT 1);
```

---

### Step 5: Check Browser Console

**After running "Prioritize All Issues":**

1. Open browser console (F12)
2. Look for these logs:
   - `Sample update payload:` - Shows what we're trying to save
   - `Database update result:` - Shows if update succeeded
   - `❌ Failed updates:` - Shows any errors
   - `Error details:` - Shows detailed error information

**Copy and share any error messages you see.**

---

### Step 6: Check Supabase Dashboard

**Go to Table Editor:**
https://supabase.com/dashboard/project/lksrqjyinjhsodnnudfm/editor

1. Click on `issues` table
2. Look for `priority_score` column
3. Check if it's visible in the column list
4. Try manually editing a row to add a score

---

## 🐛 Common Issues and Fixes

### Issue 1: Column Doesn't Exist
**Symptom:** Error mentions "column" or "does not exist"

**Fix:**
```sql
ALTER TABLE issues ADD COLUMN priority_score DOUBLE PRECISION;
```

---

### Issue 2: RLS Policy Blocking
**Symptom:** Error mentions "policy" or "permission denied"

**Fix:**
```sql
-- Temporarily disable RLS
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- Or add permissive policy
CREATE POLICY "Allow priority score updates"
ON issues
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### Issue 3: Wrong Data Type
**Symptom:** Error mentions "type" or "cast"

**Fix:**
```sql
-- Drop and recreate with correct type
ALTER TABLE issues DROP COLUMN IF EXISTS priority_score;
ALTER TABLE issues ADD COLUMN priority_score DOUBLE PRECISION;
```

---

### Issue 4: API Key Permissions
**Symptom:** Updates work in SQL editor but not from app

**Fix:**
- Check you're using the correct Supabase URL and anon key in `.env`
- Verify RLS policies allow updates from the anon key
- Try using service role key for testing (not for production!)

---

## 📋 Checklist

Run through this checklist:

- [ ] Column exists in database (Step 1)
- [ ] Column is DOUBLE PRECISION type
- [ ] RLS policies allow UPDATE (Step 2)
- [ ] Direct SQL update works (Step 3)
- [ ] Browser console shows detailed errors (Step 5)
- [ ] Supabase dashboard shows the column (Step 6)
- [ ] `.env` file has correct Supabase credentials
- [ ] Frontend server restarted after code changes
- [ ] Backend ML server is running

---

## 🔧 Quick Fix Commands

**If you want to start fresh:**

```sql
-- Drop and recreate the column
ALTER TABLE issues DROP COLUMN IF EXISTS priority_score;
ALTER TABLE issues ADD COLUMN priority_score DOUBLE PRECISION;

-- Disable RLS temporarily for testing
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- Test update
UPDATE issues 
SET priority_score = 0.75 
WHERE issue_id = (SELECT issue_id FROM issues LIMIT 1);

-- Verify
SELECT issue_id, priority, priority_score 
FROM issues 
WHERE priority_score IS NOT NULL;
```

---

## 📞 What to Share

If still having issues, share:

1. **SQL query results from Step 1** (does column exist?)
2. **Browser console errors** (from Step 5)
3. **Supabase error message** (from alert dialog)
4. **Screenshot of Supabase table editor** showing columns

This will help identify the exact problem!
