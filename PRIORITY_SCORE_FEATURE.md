# Priority Score Display Feature

## ✅ What Was Added

### 1. **Database Storage**
- Added `priority_score` field to all database update operations
- Stores ML model confidence score (0.0 to 1.0)
- Saved alongside priority level (High/Medium/Low)

### 2. **UI Display - Two Locations**

#### A. Priority Badge (Compact)
Shows percentage next to priority level:
```
High Priority (75%)
Medium Priority (45%)
Low Priority (28%)
```

#### B. Issue Details (Detailed)
Shows full ML score information:
```
🤖 ML Score: 75.6% (Raw: 0.756)
```

---

## 📊 How It Works

### Flow:

```
1. User clicks "AI Priority" or "Prioritize All Issues"
   ↓
2. ML Model predicts score (e.g., 0.756)
   ↓
3. Backend maps to level:
   - > 0.7 = High
   - 0.4-0.7 = Medium
   - < 0.4 = Low
   ↓
4. Both saved to database:
   - priority: "High"
   - priority_score: 0.756
   ↓
5. UI displays both:
   - Badge: "High Priority (76%)"
   - Details: "🤖 ML Score: 75.6% (Raw: 0.756)"
```

---

## 🗄️ Database Schema

### Required Column:

```sql
ALTER TABLE issues 
ADD COLUMN priority_score DOUBLE PRECISION;
```

**See `ADD_PRIORITY_SCORE_COLUMN.md` for detailed setup instructions.**

---

## 📝 Code Changes

### Files Modified:

1. **`/src/gov/ReportedIssues.jsx`**
   - Added `priority_score` to all database updates
   - Added score display in priority badge
   - Added detailed score display in issue content
   - Updated local state management

### Changes Summary:

#### Single Issue Prediction:
```javascript
// Database update
.update({
  priority: result.priority,
  priority_score: parseFloat(result.priorityScore), // NEW
  updated_at: new Date().toISOString()
})

// Local state update
{
  ...issue,
  priority: result.priority,
  priority_score: parseFloat(result.priorityScore), // NEW
  updated_at: new Date().toISOString()
}
```

#### Batch Prioritization:
```javascript
// Database update (parallel)
.update({
  priority: priorityResult.priority,
  priority_score: parseFloat(priorityResult.priorityScore), // NEW
  updated_at: new Date().toISOString()
})

// Local state update
{
  ...issue,
  priority: newData.priority,
  priority_score: newData.score, // NEW
  updated_at: new Date().toISOString()
}
```

#### UI Display:
```jsx
{/* In priority badge */}
{issue.priority} Priority
{issue.priority_score && (
  <span>({(issue.priority_score * 100).toFixed(0)}%)</span>
)}

{/* In issue details */}
{issue.priority_score && (
  <p className="issue-ml-score">
    🤖 ML Score: <strong>{(issue.priority_score * 100).toFixed(1)}%</strong>
    <span>(Raw: {issue.priority_score.toFixed(3)})</span>
  </p>
)}
```

---

## 🎨 UI Examples

### Before:
```
┌─────────────────────────────────────┐
│ High Priority                       │
└─────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────┐
│ High Priority (75%)                 │
└─────────────────────────────────────┘

🤖 ML Score: 75.6% (Raw: 0.756)
```

---

## 🧪 Testing

### Test Single Issue:
1. Go to Reported Issues page
2. Click "AI Priority" on any issue
3. Check:
   - ✅ Priority badge shows percentage
   - ✅ Issue details show ML score
   - ✅ Database has priority_score value

### Test Batch:
1. Click "Prioritize All Issues"
2. Wait for completion
3. Check:
   - ✅ All issues show percentages
   - ✅ All issues show ML scores
   - ✅ Database has all priority_score values

### Verify Database:
```sql
SELECT 
  issue_id, 
  priority, 
  priority_score,
  ROUND((priority_score * 100)::numeric, 1) as percentage
FROM issues 
WHERE priority_score IS NOT NULL
ORDER BY priority_score DESC
LIMIT 10;
```

Expected output:
```
issue_id  | priority | priority_score | percentage
----------|----------|----------------|------------
CIV-1001  | High     | 0.756          | 75.6
CIV-1002  | High     | 0.723          | 72.3
CIV-1003  | Medium   | 0.567          | 56.7
CIV-1004  | Medium   | 0.445          | 44.5
CIV-1005  | Low      | 0.312          | 31.2
```

---

## 📋 Setup Checklist

- [ ] Add `priority_score` column to Supabase (see `ADD_PRIORITY_SCORE_COLUMN.md`)
- [ ] Restart Priority Model Server (`cd src/priorityModel && npm start`)
- [ ] Restart Vite Frontend (`npm run dev`)
- [ ] Test single issue prioritization
- [ ] Test batch prioritization
- [ ] Verify scores appear in UI
- [ ] Verify scores saved in database

---

## 🔍 Troubleshooting

### Score not showing in UI:
1. Check browser console for errors
2. Verify `priority_score` column exists in database
3. Check issue object has `priority_score` field
4. Hard refresh browser (Ctrl+Shift+R)

### Score not saving to database:
1. Check column exists: `\d issues` in psql
2. Check RLS policies allow UPDATE on priority_score
3. Check browser console for Supabase errors
4. Verify data type is `DOUBLE PRECISION` or `float8`

### Score shows as NaN or undefined:
1. Check ML server is returning `priorityScore` in response
2. Verify `parseFloat()` is working correctly
3. Check for null/undefined values
4. Add console.log to debug data flow

### Percentage calculation wrong:
- Score should be 0.0 to 1.0
- Percentage = score × 100
- Example: 0.756 → 75.6%

---

## 🎯 Score Interpretation

| Score Range | Priority Level | Meaning |
|-------------|----------------|---------|
| 0.90 - 1.00 | High | Critical - Immediate attention |
| 0.70 - 0.89 | High | Important - High priority |
| 0.50 - 0.69 | Medium | Moderate - Normal priority |
| 0.40 - 0.49 | Medium | Low-moderate priority |
| 0.20 - 0.39 | Low | Minor - Low priority |
| 0.00 - 0.19 | Low | Minimal - Very low priority |

---

## 📊 Score Factors

The ML model considers:
- **Issue Type** (Pothole, Garbage, Water, etc.)
- **Location** (latitude/longitude)
- **Weather** (rain increases priority)
- **Traffic** (high traffic = higher priority)
- **Image Quality** (clear images = higher priority)
- **Repeat Count** (multiple reports = higher priority)
- **Time of Day** (peak hours = higher priority)

---

## 🚀 Future Enhancements

Potential improvements:
1. **Color-coded scores** (gradient from red to green)
2. **Score history** (track changes over time)
3. **Score explanation** (show which factors contributed)
4. **Confidence intervals** (show uncertainty range)
5. **Score comparison** (compare with historical average)
6. **Score trends** (show if priority is increasing/decreasing)

---

## 📝 Summary

✅ **Added:** Priority score storage in database  
✅ **Added:** Score display in priority badge (compact)  
✅ **Added:** Score display in issue details (detailed)  
✅ **Updated:** All database operations to include score  
✅ **Updated:** Local state management to track score  
✅ **Result:** Full transparency of ML model confidence  

**Users can now see exactly how confident the ML model is about each priority prediction!** 🎉
