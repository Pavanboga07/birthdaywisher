/**
 * Elegant Professional Birthday Email Template
 * Sophisticated design with minimal emojis - perfect for all contexts
 */

/**
 * Replace placeholders in template
 */
function replacePlaceholders(template, contact) {
  let html = template;
  
  // Calculate age if birth year available
  let age = '';
  let ageDisplay = '';
  let ageText = '';
  if (contact.birthday) {
    const birthYear = parseInt(contact.birthday.split('-')[0]);
    if (birthYear > 1900 && birthYear < new Date().getFullYear()) {
      age = new Date().getFullYear() - birthYear;
      ageDisplay = `
        <tr>
          <td style="padding: 20px 50px; text-align: center; background: white;">
            <div style="font-size: 64px; font-weight: 600; background: linear-gradient(135deg, #4A5FE8 0%, #7B68EE 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              ${age}
            </div>
          </td>
        </tr>`;
      ageText = `<span style="color: #4A5FE8; font-weight: 600;">${age}</span>`;
    }
  }
  
  // Replace all placeholders
  html = html.replace(/\{name\}/g, contact.name || 'Friend');
  html = html.replace(/\{name_gradient\}/g, `<span style="background: linear-gradient(135deg, #4A5FE8 0%, #7B68EE 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${contact.name || 'Friend'}</span>`);
  html = html.replace(/\{age_display\}/g, ageDisplay);
  html = html.replace(/\{age_text\}/g, ageText || 'this milestone');
  
  return html;
}

/**
 * Elegant Professional Birthday Email Template
 */
const universalBirthdayTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday!</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Open+Sans:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #4A5FE8 0%, #7B68EE 100%); font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 50px 20px;">
    <tr>
      <td align="center">
        
        <!-- Email Card -->
        <table width="650" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15); max-width: 650px;">
          
          <!-- Header Section -->
          <tr>
            <td style="padding: 50px 50px 30px; text-align: center; background: white;">
              <h1 style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2c3e50; font-size: 38px; margin: 0 0 15px 0; font-weight: 600;">
                Happy Birthday, {name_gradient} 🎉
              </h1>
              <!-- Gradient underline -->
              <div style="width: 120px; height: 3px; background: linear-gradient(90deg, #4A5FE8 0%, #7B68EE 100%); margin: 0 auto; border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Age Display (Optional) -->
          {age_display}
          
          <!-- Main Content Section -->
          <tr>
            <td style="padding: 30px 60px; background: white;">
              
              <p style="font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 18px; color: #2c3e50; line-height: 1.8; margin: 0 0 20px 0; font-weight: 500; text-align: center;">
                Turning {age_text} is a milestone worth celebrating.
              </p>
              
              <p style="font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 17px; color: #555; line-height: 1.8; margin: 0 0 18px 0; text-align: center;">
                Wishing you a day filled with fulfillment, good health, and meaningful connections.
              </p>
              
              <p style="font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 17px; color: #555; line-height: 1.8; margin: 0 0 18px 0; text-align: center;">
                May this year open new doors of opportunity, growth, and lasting happiness.
              </p>
              
              <p style="font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 17px; color: #555; line-height: 1.8; margin: 0; text-align: center;">
                Your dedication and positivity continue to inspire everyone around you.
              </p>
              
            </td>
          </tr>
          
          <!-- Quote Block Section -->
          <tr>
            <td style="padding: 40px 60px; background: #f8f9ff;">
              <div style="background: linear-gradient(135deg, rgba(74,95,232,0.05) 0%, rgba(123,104,238,0.05) 100%); border-left: 4px solid #4A5FE8; padding: 25px 30px; border-radius: 8px;">
                <p style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 18px; color: #2c3e50; font-style: italic; margin: 0; line-height: 1.7; text-align: center;">
                  "Every year is a new chapter. May yours be written with success, gratitude, and joy."
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Action Button Section -->
          <tr>
            <td style="padding: 40px 60px 50px; background: white;">
              <table width="100%" cellpadding="0" cellspacing="15">
                <tr>
                  <td width="33%" style="text-align: center; padding: 20px 15px; background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%); border-radius: 10px;">
                    <div style="font-size: 28px; margin-bottom: 10px;">✨</div>
                    <div style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #2c3e50; font-weight: 600; letter-spacing: 0.3px; line-height: 1.4;">CELEBRATE<br>PROGRESS</div>
                  </td>
                  <td width="33%" style="text-align: center; padding: 20px 15px; background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%); border-radius: 10px;">
                    <div style="font-size: 28px; margin-bottom: 10px;">💼</div>
                    <div style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #2c3e50; font-weight: 600; letter-spacing: 0.3px; line-height: 1.4;">EMBRACE<br>GROWTH</div>
                  </td>
                  <td width="33%" style="text-align: center; padding: 20px 15px; background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%); border-radius: 10px;">
                    <div style="font-size: 28px; margin-bottom: 10px;">🌟</div>
                    <div style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #2c3e50; font-weight: 600; letter-spacing: 0.3px; line-height: 1.4;">KEEP<br>INSPIRING</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer Section -->
          <tr>
            <td style="padding: 35px 60px; background: #f8f9ff; text-align: center; border-top: 1px solid #e8ecf4;">
              <p style="font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; color: #6c757d; margin: 0; line-height: 1.6;">
                Warm wishes on your special day — may the coming year bring out your best yet.
              </p>
            </td>
          </tr>
          
          <!-- App Footer -->
          <tr>
            <td style="padding: 20px 40px; background: #2c3e50; text-align: center;">
              <p style="font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: rgba(255,255,255,0.7); margin: 0;">
                Sent with care from Birthday Reminder
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;

/**
 * Generate email with elegant professional template
 */
function generateBirthdayEmail(contact) {
  const html = replacePlaceholders(universalBirthdayTemplate, contact);
  const subject = `🎉 Happy Birthday, ${contact.name}!`;
  const text = `Happy Birthday, ${contact.name}! Wishing you a wonderful day filled with fulfillment, good health, and meaningful connections. May this year bring new opportunities, growth, and lasting happiness.`;
  
  return {
    subject,
    html,
    text
  };
}

module.exports = {
  generateBirthdayEmail
};
