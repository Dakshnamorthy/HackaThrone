# 🐛 Form Submission Debug Guide

## 🚨 **Common Reasons Form Won't Submit:**

### **1. Database Table Missing (Most Likely)**
**Error**: `relation "issues" does not exist`
**Solution**: Run the SQL script to create the table

### **2. User Not Logged In**
**Error**: `Please log in to report an issue`
**Solution**: Make sure you're logged in as a citizen

### **3. Missing Required Fields**
**Error**: `Please fill in all required fields`
**Solution**: Fill in Issue Type, Description, and Location

### **4. Permission Issues**
**Error**: `permission denied` or `violates row-level security`
**Solution**: Check RLS policies and user authentication

## 🔧 **Step-by-Step Fix:**

### **Step 1: Create the Database Table**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste **`CREATE_ISSUES_TABLE.sql`**
3. Click **Run**
4. Should see: "Issues table created successfully!"

### **Step 2: Test Form Submission**
1. **Log in** as a citizen (not government staff)
2. Go to **Report Issue** page
3. Fill in **all required fields**:
   - ✅ Issue Type (dropdown)
   - ✅ Description (text area)
   - ✅ Location (text input)
4. Click **Submit Issue**

### **Step 3: Check Browser Console**
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Try submitting the form
4. Look for error messages

## 🔍 **Debug Information Added:**

The form now logs detailed information:
```javascript
// What gets logged:
console.log('Submitting issue with data:', { ... });
console.log('Supabase response:', { issueData, issueError });
```

## 📋 **Specific Error Messages:**

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Database table not found" | `issues` table doesn't exist | Run `CREATE_ISSUES_TABLE.sql` |
| "Permission error" | Not logged in | Log in as citizen |
| "Security policy error" | RLS policy issue | Check user authentication |
| "Please fill in all required fields" | Missing form data | Fill all required fields |

## ✅ **Quick Test Checklist:**

1. **✅ Logged in?** Check if profile dropdown appears in navbar
2. **✅ Table exists?** Run the SQL script in Supabase
3. **✅ All fields filled?** Issue Type, Description, Location
4. **✅ Console errors?** Check browser DevTools console
5. **✅ Network requests?** Check Network tab for failed requests

## 🎯 **Expected Behavior:**

When form submits successfully:
1. **Console logs** show submission data
2. **Success alert** with ticket number
3. **Form resets** to empty state
4. **Redirect** to complaint status page after 2 seconds

## 🚀 **Try This Now:**

1. **Run** `CREATE_ISSUES_TABLE.sql` in Supabase
2. **Log in** as a citizen
3. **Fill the form** completely
4. **Submit** and check console for logs
5. **Report back** what error message you see

The form should work after creating the database table! 🎉
