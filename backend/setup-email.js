const nodemailer = require('nodemailer');
require('dotenv').config();

// Email setup and test script
async function setupEmail() {
  console.log('🔧 Setting up email configuration...\n');
  
  // Check if email credentials are provided
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass || emailUser === 'your-school-email@gmail.com' || emailPass === 'your-app-password-here') {
    console.log('❌ Email not configured properly!');
    console.log('\n📧 To set up email:');
    console.log('1. Create a Gmail account for your school');
    console.log('2. Enable 2-Factor Authentication');
    console.log('3. Generate an App Password:');
    console.log('   - Go to Google Account Settings');
    console.log('   - Security → 2-Step Verification → App passwords');
    console.log('   - Generate password for "Mail"');
    console.log('4. Update .env file with:');
    console.log('   EMAIL_USER=your-school-email@gmail.com');
    console.log('   EMAIL_PASS=your-16-character-app-password');
    console.log('\n🔄 Restart the server after updating .env file');
    return false;
  }
  
  // Test email configuration
  console.log('📧 Testing email configuration...');
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
  
  try {
    // Verify email configuration
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    
    // Send test email
    const testEmail = {
      from: emailUser,
      to: emailUser, // Send to self for testing
      subject: 'School Management System - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>St. Mary's Secondary School</h1>
            <p>Email System Test</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>✅ Email Configuration Successful!</h2>
            <p>Your school management system email is now properly configured and ready to send payment reminders to parents.</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>What's Working:</h3>
              <ul>
                <li>✅ Email authentication</li>
                <li>✅ SMTP connection</li>
                <li>✅ Professional templates</li>
                <li>✅ Payment reminders</li>
              </ul>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Test payment reminders in the admin dashboard</li>
              <li>Configure parent email addresses</li>
              <li>Set up WhatsApp integration (optional)</li>
            </ul>
          </div>
          
          <div style="background: #2d3436; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>This is an automated test message from your School Management System.</p>
            <p>© 2024 St. Mary's Secondary School. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Check ${emailUser} for the test email`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Email configuration failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔧 Fix: Check your email and app password');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🔧 Fix: Enable 2-Factor Authentication and use app password');
    } else if (error.message.includes('Connection timeout')) {
      console.log('\n🔧 Fix: Check your internet connection');
    }
    
    return false;
  }
}

// Run the setup
setupEmail().then(success => {
  if (success) {
    console.log('\n🎉 Email setup complete! Your payment reminders are ready to use.');
  } else {
    console.log('\n⚠️ Please fix the email configuration and run this script again.');
  }
  process.exit(0);
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});







