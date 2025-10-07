const nodemailer = require('nodemailer');
require('dotenv').config();

// Real email setup for live payment reminders
async function setupRealEmail() {
  console.log('🚀 Setting up REAL email for live payment reminders...\n');
  
  // Get email credentials from user
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  try {
    console.log('📧 To send REAL emails to parents, we need your email credentials:');
    console.log('\n🔧 Gmail Setup Instructions:');
    console.log('1. Create a Gmail account for your school');
    console.log('2. Enable 2-Factor Authentication');
    console.log('3. Generate App Password:');
    console.log('   - Go to Google Account Settings');
    console.log('   - Security → 2-Step Verification → App passwords');
    console.log('   - Generate password for "Mail"');
    console.log('\n📝 Enter your email details:');
    
    const emailUser = await question('Gmail address: ');
    const emailPass = await question('App password (16 characters): ');
    
    if (!emailUser || !emailPass) {
      console.log('❌ Email credentials required!');
      rl.close();
      return false;
    }
    
    // Test the email configuration
    console.log('\n🔍 Testing email configuration...');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    
    // Send test email to yourself
    const testEmail = {
      from: emailUser,
      to: emailUser, // Send to yourself first
      subject: 'St. Mary\'s School - Payment Reminder System Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>St. Mary's Secondary School</h1>
            <p>Payment Reminder System - LIVE TEST</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>🎉 Email System is LIVE!</h2>
            <p>Your school management system is now configured to send REAL payment reminders to parents.</p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>✅ What's Working:</h3>
              <ul>
                <li>✅ Real email delivery to parents</li>
                <li>✅ Professional payment reminder templates</li>
                <li>✅ School branding and contact information</li>
                <li>✅ Bulk email processing</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>📧 Sample Payment Reminder:</h3>
              <p><strong>Student:</strong> John Doe</p>
              <p><strong>Class:</strong> Senior 1</p>
              <p><strong>Outstanding Balance:</strong> UGX 800,000</p>
              <p><strong>Payment Methods:</strong> Bank Transfer, Mobile Money, Cash</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Test payment reminders in admin dashboard</li>
              <li>Ensure parent email addresses are correct</li>
              <li>Monitor email delivery in console logs</li>
            </ul>
          </div>
          
          <div style="background: #2d3436; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>This is a test email from your School Management System.</p>
            <p>© 2024 St. Mary's Secondary School. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Check ${emailUser} for the test email`);
    
    // Update .env file
    const fs = require('fs');
    const envContent = `# Real Email Configuration for Live Payment Reminders
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPass}

# School Information
SCHOOL_NAME=St. Mary's Secondary School
SCHOOL_EMAIL=school@stmarys.ac.ug
SCHOOL_PHONE=+256 700 123 456
SCHOOL_ADDRESS=Mukono, Uganda

# WhatsApp Configuration
WHATSAPP_API_URL=https://api.whatsapp.com/send
WHATSAPP_TOKEN=your-whatsapp-business-token

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/sms

# Server Configuration
PORT=5000
NODE_ENV=production
`;
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ Updated .env file with real email credentials');
    
    console.log('\n🎉 REAL EMAIL SETUP COMPLETE!');
    console.log('📧 Parents will now receive actual payment reminder emails');
    console.log('🔄 Restart your server to activate real email sending');
    
    rl.close();
    return true;
    
  } catch (error) {
    console.log('❌ Email setup failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔧 Fix: Check your email and app password');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Fix: Enable 2-Factor Authentication and use app password');
    }
    
    rl.close();
    return false;
  }
}

// Run the setup
setupRealEmail().then(success => {
  if (success) {
    console.log('\n🚀 Your payment reminder system is now LIVE!');
    console.log('📧 Parents will receive real emails in real-time');
  } else {
    console.log('\n⚠️ Please fix the email configuration and try again.');
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});







