# Email Setup for Payment Reminders

## Quick Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Create .env file** in backend folder:
```
EMAIL_USER=your-school-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Alternative Email Services

### Outlook/Hotmail:
```
EMAIL_USER=your-school@outlook.com
EMAIL_PASS=your-app-password
```

### Yahoo:
```
EMAIL_USER=your-school@yahoo.com
EMAIL_PASS=your-app-password
```

## Test Email Setup

After setting up, test with:
```bash
curl -X POST http://localhost:5000/api/reminders/send-email-reminder \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Test Student","parentName":"Test Parent","parentEmail":"test@example.com","balance":800000,"class":"Senior 1"}'
```

## Troubleshooting

- **"Invalid login"**: Check email and app password
- **"Authentication failed"**: Enable 2FA and use app password
- **"Connection timeout"**: Check internet connection
- **"SMTP error"**: Try different email service

## Production Setup

For production, consider:
- Dedicated email service (SendGrid, Mailgun)
- SMTP server configuration
- Email templates customization
- Delivery tracking







