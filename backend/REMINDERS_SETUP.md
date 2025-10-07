# Email & WhatsApp Configuration Guide

## 📧 Email Setup (Required for Email Reminders)

### Gmail Setup (Recommended):
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Add to your `.env` file:
```
EMAIL_USER=your-school-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### Alternative Email Services:
- **Outlook**: Use your Outlook email and app password
- **Yahoo**: Use your Yahoo email and app password
- **Custom SMTP**: Configure with your email provider's SMTP settings

## 📱 WhatsApp Setup (Optional)

### WhatsApp Web (Current Implementation):
- Uses WhatsApp Web URLs (opens in browser)
- No additional setup required
- Works immediately for testing

### WhatsApp Business API (Production):
1. Register for WhatsApp Business API
2. Get your access token
3. Add to `.env` file:
```
WHATSAPP_TOKEN=your-business-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

## 🚀 Testing the System

### Test Email Reminders:
1. Go to Financial Management → Smart Balance Reminders
2. Select a balance range (e.g., "UGX 800,000+")
3. Click "📧 Email Reminders"
4. Check console for success/failure messages

### Test WhatsApp Reminders:
1. Select a balance range
2. Click "💬 WhatsApp Messages"
3. WhatsApp Web windows will open automatically
4. Messages are pre-formatted and ready to send

## 📋 Professional Templates Included

### Email Template Features:
- School branding and colors
- Student details in highlighted box
- Outstanding balance prominently displayed
- Payment methods clearly listed
- Contact information for follow-up
- Professional footer

### WhatsApp Template Features:
- School branding with emojis
- Clean, readable format
- Student information clearly structured
- Payment options listed
- Contact details included
- Professional closing

## 🔧 Troubleshooting

### Email Issues:
- Check email credentials in `.env` file
- Verify app password is correct
- Check spam folder for test emails
- Ensure 2FA is enabled on email account

### WhatsApp Issues:
- WhatsApp Web should open automatically
- Check if WhatsApp is installed on system
- Verify phone numbers are in correct format (+256...)

## 📞 Support

For technical support with email/WhatsApp setup:
- Check server logs for detailed error messages
- Verify all environment variables are set correctly
- Test with a single student first before bulk sending







