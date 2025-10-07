import express from 'express';
import nodemailer from 'nodemailer';
import axios from 'axios';

const router = express.Router();

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your preferred email service
  auth: {
    user: process.env.EMAIL_USER || 'your-school-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Check if email is properly configured
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && 
         process.env.EMAIL_PASS && 
         process.env.EMAIL_USER !== 'your-school-email@gmail.com' &&
         process.env.EMAIL_PASS !== 'your-app-password' &&
         process.env.EMAIL_USER !== 'demo.school.system@gmail.com' &&
         process.env.EMAIL_PASS !== 'demo-app-password-12345';
};

// Mock email sending for demo purposes
const sendMockEmail = async (mailOptions: any) => {
  console.log(`📧 MOCK EMAIL SENT:`);
  console.log(`   To: ${mailOptions.to}`);
  console.log(`   Subject: ${mailOptions.subject}`);
  console.log(`   From: ${mailOptions.from}`);
  console.log(`   Content: Professional payment reminder template`);
  console.log(`   Status: ✅ Successfully delivered (simulated)`);
  
  // Simulate email delivery delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    messageId: `mock-${Date.now()}@school.system`,
    accepted: [mailOptions.to],
    rejected: [],
    pending: [],
    response: '250 OK - Mock email delivered'
  };
};

// WhatsApp API configuration (using WhatsApp Business API or Twilio)
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'your-whatsapp-token';

// Professional email template
const createPaymentReminderEmail = (studentName, parentName, balance, className) => {
  return {
    subject: `Payment Reminder - ${studentName} (${className})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .balance-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #d63031; }
          .footer { background: #2d3436; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .button { background: #00b894; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>St. Mary's Secondary School</h1>
          <p>Payment Reminder Notice</p>
        </div>
        
        <div class="content">
          <p>Dear ${parentName},</p>
          
          <p>We hope this message finds you well. This is a friendly reminder regarding the outstanding school fees for your child.</p>
          
          <div class="balance-box">
            <h3>Student Information:</h3>
            <p><strong>Student Name:</strong> ${studentName}</p>
            <p><strong>Class:</strong> ${className}</p>
            <p><strong>Outstanding Balance:</strong> <span class="amount">UGX ${balance.toLocaleString()}</span></p>
          </div>
          
          <p>To ensure uninterrupted academic progress for ${studentName}, we kindly request that the outstanding balance be settled at your earliest convenience.</p>
          
          <p><strong>Payment Methods Available:</strong></p>
          <ul>
            <li>Bank Transfer to School Account</li>
            <li>Mobile Money (MTN, Airtel)</li>
            <li>Cash Payment at School Office</li>
          </ul>
          
          <p>For any questions or to discuss payment arrangements, please contact our finance office:</p>
          <p><strong>Phone:</strong> +256 700 123 456</p>
          <p><strong>Email:</strong> finance@stmarys.ac.ug</p>
          
          <p>Thank you for your continued support of our educational mission.</p>
          
          <p>Best regards,<br>
          <strong>Finance Department</strong><br>
          St. Mary's Secondary School</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 St. Mary's Secondary School. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  };
};

// Professional WhatsApp message template
const createPaymentReminderWhatsApp = (studentName, parentName, balance, className) => {
  return `🏫 *St. Mary's Secondary School* - Payment Reminder

Dear ${parentName},

This is a friendly reminder regarding outstanding school fees for your child.

📚 *Student Details:*
• Name: ${studentName}
• Class: ${className}
• Outstanding Balance: *UGX ${balance.toLocaleString()}*

💳 *Payment Methods:*
• Bank Transfer
• Mobile Money (MTN/Airtel)
• Cash at School Office

📞 *Contact Finance Office:*
• Phone: +256 700 123 456
• Email: finance@stmarys.ac.ug

Please settle the outstanding balance to ensure uninterrupted academic progress.

Thank you for your cooperation.

*Finance Department*
St. Mary's Secondary School

---
This is an automated message.`;
};

// Send email reminder
router.post('/send-email-reminder', async (req, res) => {
  try {
    const { studentName, parentName, parentEmail, balance, className } = req.body;
    
    if (!parentEmail) {
      return res.status(400).json({ error: 'Parent email not provided' });
    }
    
    const emailContent = createPaymentReminderEmail(studentName, parentName, balance, className);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'school@stmarys.ac.ug',
      to: parentEmail,
      subject: emailContent.subject,
      html: emailContent.html
    };
    
    // Check if email is configured, use mock service if not
    if (!isEmailConfigured()) {
      console.log(`📧 Using mock email service for ${parentName} (${parentEmail}) - ${studentName}`);
      await sendMockEmail(mailOptions);
      
      res.json({ 
        success: true, 
        message: `Email reminder sent to ${parentName} (Demo Mode)`,
        recipient: parentEmail,
        configured: false,
        demo: true
      });
    } else {
      await emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${parentName} (${parentEmail}) for ${studentName}`);
      
      res.json({ 
        success: true, 
        message: `Email reminder sent to ${parentName}`,
        recipient: parentEmail,
        configured: true,
        demo: false
      });
    }
    
  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
});

// Send WhatsApp reminder
router.post('/send-whatsapp-reminder', async (req, res) => {
  try {
    const { studentName, parentName, parentPhone, balance, className } = req.body;
    
    if (!parentPhone) {
      return res.status(400).json({ error: 'Parent phone number not provided' });
    }
    
    // Clean phone number (remove spaces, add country code if needed)
    let cleanPhone = parentPhone.replace(/\s+/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+256' + cleanPhone.replace(/^0/, '');
    }
    
    const message = createPaymentReminderWhatsApp(studentName, parentName, balance, className);
    
    // Using WhatsApp Web API (you can replace this with WhatsApp Business API)
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    
    // For production, you would use WhatsApp Business API:
    /*
    const response = await axios.post('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: message }
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    */
    
    console.log(`✅ WhatsApp message prepared for ${parentName} (${cleanPhone}) for ${studentName}`);
    console.log(`📱 WhatsApp URL: ${whatsappUrl}`);
    
    res.json({ 
      success: true, 
      message: `WhatsApp reminder prepared for ${parentName}`,
      recipient: cleanPhone,
      whatsappUrl: whatsappUrl // For development - opens WhatsApp Web
    });
    
  } catch (error) {
    console.error('❌ WhatsApp sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send WhatsApp message', 
      details: error.message 
    });
  }
});

// Send bulk reminders
router.post('/send-bulk-reminders', async (req, res) => {
  try {
    const { students, reminderType } = req.body; // reminderType: 'email' or 'whatsapp'
    
    const results = [];
    
    for (const student of students) {
      try {
        if (reminderType === 'email' && student.parentEmail) {
          const emailContent = createPaymentReminderEmail(
            student.name, 
            student.parentName || 'Parent', 
            student.balance, 
            student.class
          );
          
          const mailOptions = {
            from: process.env.EMAIL_USER || 'school@stmarys.ac.ug',
            to: student.parentEmail,
            subject: emailContent.subject,
            html: emailContent.html
          };
          
          // Check if email is configured, use mock service if not
          if (!isEmailConfigured()) {
            console.log(`📧 Using mock email service for ${student.parentName || 'Parent'} (${student.parentEmail}) - ${student.name}`);
            await sendMockEmail(mailOptions);
            results.push({ student: student.name, status: 'sent', type: 'email', configured: false, demo: true });
          } else {
            await emailTransporter.sendMail(mailOptions);
            results.push({ student: student.name, status: 'sent', type: 'email', configured: true, demo: false });
          }
          
        } else if (reminderType === 'whatsapp' && student.parentPhone) {
          const message = createPaymentReminderWhatsApp(
            student.name, 
            student.parentName || 'Parent', 
            student.balance, 
            student.class
          );
          
          let cleanPhone = student.parentPhone.replace(/\s+/g, '');
          if (!cleanPhone.startsWith('+')) {
            cleanPhone = '+256' + cleanPhone.replace(/^0/, '');
          }
          
          const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
          results.push({ student: student.name, status: 'prepared', type: 'whatsapp', url: whatsappUrl });
        }
        
        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({ student: student.name, status: 'failed', error: error.message });
      }
    }
    
    res.json({ 
      success: true, 
      message: `Bulk ${reminderType} reminders processed`,
      results: results
    });
    
  } catch (error) {
    console.error('❌ Bulk reminder error:', error);
    res.status(500).json({ 
      error: 'Failed to send bulk reminders', 
      details: error.message 
    });
  }
});

export default router;
