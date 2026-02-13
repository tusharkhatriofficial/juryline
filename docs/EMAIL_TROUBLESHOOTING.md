# 📧 Email Sending Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Emails Not Being Sent

#### Check Supabase Email Configuration

1. **Go to Supabase Dashboard** → Your Project → Settings → Authentication

2. **SMTP Settings** (scroll down):
   ```
   Host: smtp-relay.brevo.com
   Port: 587
   User: Your Brevo login email
   Password: Your Brevo SMTP API key (NOT your account password)
   Sender Email: verified@yourdomain.com
   Sender Name: Juryline
   ```

3. **Enable Email Confirmations**:
   - Toggle "Enable email confirmations" ON
   - This sends verification emails on signup

4. **Email Templates**:
   - Customize the email templates if needed
   - Test with "Send test email" button

#### Check Brevo Configuration

1. **Login to Brevo** (app.brevo.com)

2. **Verify Sender Email**:
   - Go to "Senders & IP"
   - Verify your sender email address
   - ✅ Status must be "Verified"

3. **Get SMTP Key**:
   - Go to "SMTP & API"
   - Copy your SMTP key (starts with `xsmtpsib-...`)
   - Use THIS key in Supabase SMTP password field

4. **Check Quota**:
   - Free plan: 300 emails/day
   - Check "Statistics" for usage

### Issue 2: Rate Limiting

**Supabase Default Rate Limits:**
- 4 emails per hour per email address
- Wait 60 seconds between retries

**Solution:**
- Space out your email sends
- Use the invite link manually if rate limited
- Contact Supabase support for higher limits on paid plans

### Issue 3: Emails Going to Spam

**Solutions:**
1. Use a custom domain for sender email
2. Add SPF/DKIM records to your domain
3. Verify sender in Brevo
4. Warm up your sender reputation

### Issue 4: Wrong Environment Variables

**Check backend/.env:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Service role key, NOT anon key
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000  # Or production URL
```

## Testing Email Flow

### Run the Email Diagnostic Tool

```bash
cd backend
python test_email.py
```

This will:
- ✅ Test OTP endpoint connectivity
- ✅ Verify environment variables
- ✅ Check email sending capability
- ✅ Provide detailed error messages

### Manual Email Test

1. **Test Signup Email:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPassword123!",
       "name": "Test User",
       "role": "participant"
     }'
   ```

2. **Test Judge Invite:**
   - Create an event via frontend
   - Go to Judges tab
   - Invite a judge
   - Check backend logs for email errors

### Check Logs

#### Backend Logs (Development):
```bash
# Terminal where uvicorn is running
# Look for lines like:
# INFO:app.routers.judges:Successfully sent magic link email to judge@example.com
# ERROR:app.routers.judges:Failed to send email to judge@example.com: ...
```

#### Backend Logs (Production - Heroku):
```bash
heroku logs --tail --app your-app-name | grep email
```

#### Supabase Logs:
1. Go to Supabase Dashboard
2. Your Project → Logs → Auth Logs
3. Filter by "Error" or search for email address
4. Look for SMTP errors or authentication failures

## Error Messages Explained

### "Rate limit exceeded"
- **Cause**: Too many emails sent to same address
- **Solution**: Wait 60 seconds, or use invite link manually

### "Email service timeout"
- **Cause**: Supabase couldn't reach SMTP server
- **Solution**: Check Brevo status, verify SMTP settings

### "Email service returned status 400"
- **Cause**: Invalid email format or configuration
- **Solution**: Verify email address format, check SMTP settings

### "Email service connection error"
- **Cause**: Network issue or wrong SMTP host
- **Solution**: Verify SMTP host is `smtp-relay.brevo.com` and port is `587`

### "Invalid SMTP credentials"
- **Cause**: Wrong SMTP password
- **Solution**: 
  1. Go to Brevo → SMTP & API
  2. Copy the SMTP key (NOT your account password)
  3. Update in Supabase SMTP settings

## Quick Fixes

### 1. Reset SMTP Configuration

```sql
-- Run in Supabase SQL Editor to check auth config
SELECT * FROM auth.config WHERE name = 'smtp';
```

### 2. Test with Supabase Dashboard

1. Authentication → Email Templates
2. Click "Send test email"
3. Enter your email
4. Check if it arrives

### 3. Use Fallback: Manual Invite Links

If emails aren't working, you can:
1. Invite judge in frontend
2. Copy the `invite_link` from API response
3. Manually send link via separate email/Slack

## Verification Checklist

- [ ] Brevo account created
- [ ] Sender email verified in Brevo
- [ ] SMTP key copied from Brevo
- [ ] SMTP settings added to Supabase
- [ ] "Enable email confirmations" toggled ON in Supabase
- [ ] Environment variables correct in backend/.env
- [ ] Backend restarted after env changes
- [ ] Test email sent successfully

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth/auth-smtp)
- [Brevo SMTP Guide](https://developers.brevo.com/docs/send-emails-with-smtp)
- [Email Deliverability Guide](https://supabase.com/docs/guides/platform/going-into-prod#email-deliverability)

## Still Having Issues?

Run the diagnostic tool and share the output:
```bash
cd backend
python test_email.py > email_diagnostic.log 2>&1
```

Then check the log for specific errors.
