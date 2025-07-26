# Daniel Authentication Troubleshooting Guide

## 🚨 Current Issue: "Invalid Login Credentials" Error

Daniel is getting an "invalid login credentials" error when trying to use password authentication. This typically happens when:

1. Password wasn't set correctly in the `auth.users` table
2. User exists in `public.users` but not in `auth.users` 
3. ID mismatch between `auth.users` and `public.users`
4. Password encryption issues

## 🔧 Immediate Solutions

### ✅ **Solution 1: Use Magic Link (Recommended)**
Daniel should **try the magic link first** - this should work regardless of password issues:

1. Go to login page
2. Leave it on "Magic Link" tab (default)
3. Enter: `daniel@hcqc.co.uk`
4. Click "Send Magic Link"
5. Check email for the login link

**This should work immediately and bypass any password issues.**

### 🛠️ **Solution 2: Fix Password Authentication**

Run these SQL scripts in order to diagnose and fix the password issue:

#### Step 1: Diagnose the Problem
```sql
-- Run: diagnose-daniel-auth.sql
```
This will show exactly what's wrong with Daniel's setup.

#### Step 2: Quick Password Reset (Try First)
```sql
-- Run: reset-daniel-password-simple.sql
```
This does a simple password reset - fixes most issues.

#### Step 3: Comprehensive Fix (If Quick Reset Fails)
```sql
-- Run: fix-daniel-password-auth.sql
```
This handles complex issues like missing users or ID mismatches.

## 🔍 Common Problems & Solutions

### Problem 1: Password Not Set
**Symptoms**: User exists but password authentication fails
**Solution**: Run `reset-daniel-password-simple.sql`

### Problem 2: User Missing from auth.users
**Symptoms**: Daniel exists in app but not in Supabase auth
**Solution**: Run `fix-daniel-password-auth.sql`

### Problem 3: ID Mismatch
**Symptoms**: Different IDs in `auth.users` vs `public.users`
**Solution**: Run `fix-daniel-password-auth.sql`

### Problem 4: Email Case Sensitivity
**Symptoms**: Email stored with different case
**Solution**: Scripts handle this with `LOWER(email)` comparisons

## 📋 Step-by-Step Resolution

### For Daniel (User):
1. **Try Magic Link First**
   - Use `daniel@hcqc.co.uk` 
   - Click "Magic Link" tab (should be default)
   - Check email and click the link

2. **If Magic Link Works**
   - You're logged in! Password can be fixed later
   - Continue using magic links or wait for password fix

3. **If Magic Link Doesn't Work**
   - Contact admin - there's a bigger authentication issue

### For Admin (You):
1. **Run Diagnostic Script**
   ```sql
   -- In Supabase SQL Editor, run:
   -- diagnose-daniel-auth.sql
   ```

2. **Try Quick Fix**
   ```sql
   -- Run: reset-daniel-password-simple.sql
   ```

3. **Test Login**
   - Ask Daniel to try password login again
   - Email: `daniel@hcqc.co.uk`
   - Password: `mJtXkqWmChC5`

4. **If Still Failing, Run Full Fix**
   ```sql
   -- Run: fix-daniel-password-auth.sql
   ```

## 🎯 Expected Results

### After Magic Link:
- ✅ Daniel should be logged in immediately
- ✅ Full Super Admin access to all features
- ✅ Can see all practices and data

### After Password Fix:
- ✅ Both authentication methods work
- ✅ Magic link: `daniel@hcqc.co.uk` → email link
- ✅ Password: `daniel@hcqc.co.uk` + `mJtXkqWmChC5`

## 🚨 If Nothing Works

### Nuclear Option: Complete Recreation
If all else fails, this script completely recreates Daniel:

```sql
-- Delete existing records
DELETE FROM users WHERE LOWER(email) = 'daniel@hcqc.co.uk';
DELETE FROM auth.users WHERE LOWER(email) = 'daniel@hcqc.co.uk';

-- Recreate with force-create-daniel.sql
-- (But try other solutions first!)
```

### Contact Points:
1. **Check Supabase logs** for authentication errors
2. **Verify email sending** is working for magic links
3. **Test with different browser** to rule out caching issues

## 📊 Success Indicators

### Daniel Can Log In When:
- ✅ Magic link email arrives within 2-3 minutes
- ✅ Password authentication accepts `mJtXkqWmChC5`
- ✅ After login, sees Super Admin interface
- ✅ Can access all practices and user management

### Scripts Show Success When:
- ✅ `diagnose-daniel-auth.sql` shows "PASSWORD SET" 
- ✅ `fix-daniel-password-auth.sql` shows "SUCCESS" message
- ✅ ID consistency check shows "MATCH ✅"

---

## 🔑 Quick Reference

**Daniel's Credentials:**
- Email: `daniel@hcqc.co.uk`
- Password: `mJtXkqWmChC5`
- Role: Super Admin
- Should work with both magic link AND password

**Scripts to Run (in order):**
1. `diagnose-daniel-auth.sql` (identify problem)
2. `reset-daniel-password-simple.sql` (quick fix)
3. `fix-daniel-password-auth.sql` (comprehensive fix if needed)

**Most Likely Fix:** Simple password reset will solve 90% of cases! 