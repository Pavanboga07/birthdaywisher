const nodemailer = require('nodemailer');
const { getSetting, logEmail, getTemplate, getDefaultTemplate } = require('./database');
const emailTemplates = require('./email-templates');

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
    
    // 1. Try to get assigned template or default template
    let template = null;
    if (contact.template_id) {
      template = getTemplate(contact.template_id);
    }
    
    if (!template) {
      template = getDefaultTemplate();
    }

    let mailOptions = {};

    if (template) {
      // FIX: Check if message is actually a JSON string (legacy/bugged save)
      if (template.message && template.message.trim().startsWith('{"type":"visual"')) {
        try {
          const parsed = JSON.parse(template.message);
          if (parsed.type === 'visual' && parsed.html) {
            template.type = 'visual';
            template.html = parsed.html;
            template.config = parsed.config;
            // Construct a fallback text message from the config
            if (parsed.config) {
               template.message = `${parsed.config.greeting || 'Happy Birthday'}, {name}!\n\n${parsed.config.mainMessage || ''}\n\n${parsed.config.footerMessage || ''}`;
            }
          }
        } catch (e) {
          console.error('Failed to parse legacy visual template message:', e);
        }
      }

      // Use the found template
      let subject = template.subject;
      let htmlContent = '';
      let textContent = '';

      // Calculate age
      let age = '';
      if (contact.birthday) {
        const birthYear = parseInt(contact.birthday.split('-')[0]);
        if (birthYear > 1900 && birthYear < new Date().getFullYear()) {
          age = new Date().getFullYear() - birthYear;
        }
      }

      // Replace placeholders
      subject = subject.replace(/\{name\}/g, contact.name).replace(/\{age\}/g, age);

      let attachments = [];

      if (template.type === 'visual' && template.html) {
        // Visual template
        htmlContent = template.html
          .replace(/\{name\}/g, contact.name)
          .replace(/\{age\}/g, age);
        
        textContent = template.message 
          ? template.message.replace(/\{name\}/g, contact.name).replace(/\{age\}/g, age)
          : `Happy Birthday ${contact.name}!`;
      } else {
        // Text template - wrap in default styling
        const message = template.message
          .replace(/\{name\}/g, contact.name)
          .replace(/\{age\}/g, age);
        
        textContent = message;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 32px;">🎂 ${subject}</h1>
              <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin-top: 20px;">
                <p style="font-size: 18px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
              <div style="margin-top: 30px; font-size: 40px;">
                🎉 🎈 🎁 🎊
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>Sent with love from Birthday Reminder App</p>
            </div>
          </div>
        `;
      }

      mailOptions = {
        from: emailFrom,
        to: contact.email,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: attachments
      };
      
      console.log(`Using template: ${template.name} (${template.type || 'text'})`);

    } else {
      // Fallback to default template
      const emailContent = emailTemplates.generateBirthdayEmail(contact);

      mailOptions = {
        from: emailFrom,
        to: contact.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };
      
      console.log(`Using legacy theme: ${emailTheme}`);
    }

    await transporter.sendMail(mailOptions);
    logEmail(contact.id, 'sent');
    
    // Update last contact date
    const { updateLastContactDate } = require('./database');
    updateLastContactDate(contact.id);
    
    console.log(`✓ Birthday email sent to ${contact.name}`);
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
  testEmail,
  resetEmailService
};
