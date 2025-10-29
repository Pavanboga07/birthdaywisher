const nodemailer = require('nodemailer');
const { getSetting, logEmail } = require('./database');

let transporter = null;

function initializeEmailService() {
  const emailFrom = getSetting('emailFrom');
  const emailPassword = getSetting('emailPassword');
  
  if (!emailFrom || !emailPassword) {
    console.log('Email not configured');
    return false;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailFrom,
      pass: emailPassword
    }
  });

  console.log('Email service initialized');
  return true;
}

async function sendBirthdayEmail(contact) {
  if (!transporter) {
    const initialized = initializeEmailService();
    if (!initialized) {
      return { success: false, error: 'Email not configured' };
    }
  }

  if (!contact.email) {
    return { success: false, error: 'No email address for contact' };
  }

  try {
    const emailFrom = getSetting('emailFrom');
    const template = getSetting('emailTemplate') || 'Happy Birthday {name}! 🎂';
    const message = template.replace('{name}', contact.name);

    const mailOptions = {
      from: emailFrom,
      to: contact.email,
      subject: `Happy Birthday ${contact.name}! 🎉`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
          <h1 style="margin: 0 0 20px 0;">🎂 ${message}</h1>
          <p style="font-size: 16px; margin: 0;">Have a wonderful day filled with joy and happiness!</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logEmail(contact.id, 'sent');
    
    console.log(`✓ Birthday email sent to ${contact.name}`);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    logEmail(contact.id, 'failed', error.message);
    return { success: false, error: error.message };
  }
}

async function sendBirthdayEmailWithTemplate(contact, templateId = null) {
  if (!transporter) {
    const initialized = initializeEmailService();
    if (!initialized) {
      return { success: false, error: 'Email not configured' };
    }
  }

  if (!contact.email) {
    return { success: false, error: 'No email address for contact' };
  }

  try {
    const emailFrom = getSetting('emailFrom');
    
    // Get template
    let template;
    if (templateId) {
      // Get specific template by ID
      const Database = require('better-sqlite3');
      const path = require('path');
      const { app } = require('electron');
      const dbPath = path.join(app.getPath('userData'), 'birthdays.db');
      const db = new Database(dbPath);
      
      const stmt = db.prepare('SELECT * FROM message_templates WHERE id = ?');
      template = stmt.get(templateId);
      db.close();
    } else {
      // Get default template
      const Database = require('better-sqlite3');
      const path = require('path');
      const { app } = require('electron');
      const dbPath = path.join(app.getPath('userData'), 'birthdays.db');
      const db = new Database(dbPath);
      
      const stmt = db.prepare('SELECT * FROM message_templates WHERE is_default = 1 LIMIT 1');
      template = stmt.get();
      db.close();
    }
    
    // Fallback to simple template if none found
    if (!template) {
      template = {
        subject: 'Happy Birthday {name}! 🎉',
        message: 'Happy Birthday {name}! 🎂 Wishing you an amazing day!'
      };
    }
    
    // Replace placeholders
    const subject = template.subject.replace(/\{name\}/g, contact.name);
    const message = template.message.replace(/\{name\}/g, contact.name);
    
    // Calculate age if birthday year is available
    let age = '';
    if (contact.birthday) {
      const birthYear = parseInt(contact.birthday.split('-')[0]);
      if (birthYear > 1900 && birthYear < new Date().getFullYear()) {
        age = new Date().getFullYear() - birthYear;
      }
    }
    
    const finalMessage = message.replace(/\{age\}/g, age);

    const mailOptions = {
      from: emailFrom,
      to: contact.email,
      subject: subject,
      text: finalMessage,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0 0 20px 0; font-size: 32px;">🎂 ${subject}</h1>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin-top: 20px;">
              <p style="font-size: 18px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${finalMessage}</p>
            </div>
            <div style="margin-top: 30px; font-size: 40px;">
              🎉 🎈 🎁 🎊
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>Sent with love from Birthday Reminder App</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logEmail(contact.id, 'sent');
    
    console.log(`✓ Birthday email sent to ${contact.name} using template`);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    logEmail(contact.id, 'failed', error.message);
    return { success: false, error: error.message };
  }
}

async function testEmail(testAddress) {
  if (!transporter) {
    const initialized = initializeEmailService();
    if (!initialized) {
      return { success: false, error: 'Email not configured' };
    }
  }

  try {
    const emailFrom = getSetting('emailFrom');
    
    const mailOptions = {
      from: emailFrom,
      to: testAddress,
      subject: '✅ Test Email from Birthday Reminder',
      text: 'If you received this, your email configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0 0 20px 0;">✅ Success!</h1>
            <p style="font-size: 18px; margin: 0;">Your email configuration is working correctly.</p>
            <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 8px;">
              <p style="margin: 0; font-size: 14px;">
                <strong>From:</strong> ${emailFrom}<br>
                <strong>To:</strong> ${testAddress}<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>Birthday Reminder App is ready to send birthday wishes! 🎉</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Test email sent to ${testAddress}`);
    return { success: true };
  } catch (error) {
    console.error('Test email error:', error);
    return { success: false, error: error.message };
  }
}

function resetEmailService() {
  transporter = null;
  console.log('Email service reset');
}

module.exports = {
  initializeEmailService,
  sendBirthdayEmail,
  sendBirthdayEmailWithTemplate,
  testEmail,
  resetEmailService
};
