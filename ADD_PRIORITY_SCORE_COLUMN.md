# Add Priority Score Column to Supabase

## Overview
This guide shows how to add the `priority_score` column to your Supabase `issues` table to store the ML model's confidence score.

---

## Option 1: Using Supabase Dashboard (Easiest)

### Steps:

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project: `lksrqjyinjhsodnnudfm`

2. **Navigate to Table Editor**
   - Click on "Table Editor" in the left sidebar
   - Select the `issues` table

3. **Add New Column**
   - Click the "+" button or "Add Column"
   - Fill in the details:
     - **Name:** `priority_score`
     - **Type:** `float8` (or `double precision`)
     - **Default value:** `null` (leave empty)
     - **Is nullable:** ✅ Yes (checked)
     - **Is unique:** ❌ No
     - **Is primary key:** ❌ No

4. **Save**
   - Click "Save" or "Create Column"

---

## Option 2: Using SQL Editor (Recommended)

### Steps:

1. **Go to SQL Editor**
   - In Supabase Dashboard, click "SQL Editor" in the left sidebar

2. **Run This SQL:**

```sql
-- Add priority_score column to issues table
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS priority_score DOUBLE PRECISION;

-- Add comment to document the column
COMMENT ON COLUMN issues.priority_score IS 'ML model confidence score (0.0 to 1.0)';

-- Optional: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_issues_priority_score 
ON issues(priority_score DESC);

-- Optional: Add constraint to ensure score is between 0 and 1
ALTER TABLE issues 
ADD CONSTRAINT priority_score_range 
CHECK (priority_score IS NULL OR (priority_score >= 0 AND priority_score <= 1));
```

3. **Click "Run"**

4. **Verify**
   - You should see: "Success. No rows returned"
   - Check the Table Editor to confirm the column exists

---

## Option 3: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Create migration file
supabase migration new add_priority_score_column

# Edit the migration file and add:
```

```sql
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS priority_score DOUBLE PRECISION;

COMMENT ON COLUMN issues.priority_score IS 'ML model confidence score (0.0 to 1.0)';

CREATE INDEX IF NOT EXISTS idx_issues_priority_score 
ON issues(priority_score DESC);

ALTER TABLE issues 
ADD CONSTRAINT priority_score_range 
CHECK (priority_score IS NULL OR (priority_score >= 0 AND priority_score <= 1));
```

```bash
# Apply migration
supabase db push
```

---

## Verify the Column Was Added

### Using SQL Editor:

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'issues' 
  AND column_name = 'priority_score';
```

Expected result:
```
column_name     | data_type         | is_nullable
----------------|-------------------|------------
priority_score  | double precision  | YES
```

### Test Update:

```sql
-- Test updating a record (replace with actual issue ID)
UPDATE issues 
SET priority_score = 0.75 
WHERE id = 'your-issue-id-here';

-- Verify
SELECT issue_id, priority, priority_score 
FROM issues 
WHERE priority_score IS NOT NULL 
LIMIT 5;
```

---

## What This Column Stores

- **Type:** `DOUBLE PRECISION` (float)
- **Range:** 0.0 to 1.0
- **Meaning:** ML model confidence score
  - `0.0` = Lowest priority
  - `1.0` = Highest priority
  - Example: `0.756` = 75.6% confidence

### Priority Mapping:
- **High:** score > 0.7 (70%+)
- **Medium:** score 0.4 - 0.7 (40%-70%)
- **Low:** score < 0.4 (<40%)

---

## UI Display

After adding the column, the UI will show:

### In Priority Badge:
```
High Priority (75%)
```

### In Issue Details:
```
🤖 ML Score: 75.6% (Raw: 0.756)
```

---

## Troubleshooting

### Error: "column already exists"
- Column is already added, you're good to go!

### Error: "permission denied"
- Make sure you're logged in as the database owner
- Check RLS policies don't block ALTER TABLE

### Column not showing in UI
1. Refresh the Supabase dashboard
2. Clear browser cache
3. Restart your Vite dev server

### Scores not saving
1. Check browser console for errors
2. Verify RLS policies allow UPDATE on `priority_score` column
3. Check the column type is `float8` or `double precision`

---

## RLS Policy (If Needed)

If you have Row Level Security enabled and updates are failing:

```sql
-- Allow government users to update priority_score
CREATE POLICY "Government can update priority scores"
ON issues
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

Or update existing policy:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'issues';

-- Modify as needed based on your setup
```

---

## Summary

✅ **Column Name:** `priority_score`  
✅ **Type:** `DOUBLE PRECISION` (float8)  
✅ **Nullable:** Yes  
✅ **Range:** 0.0 to 1.0  
✅ **Purpose:** Store ML model confidence scores  

**After adding this column, restart your servers and test the prioritization feature!**
