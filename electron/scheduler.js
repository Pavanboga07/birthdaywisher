const cron = require('node-cron');
const { getTodaysBirthdays, getUpcomingBirthdays, getSetting } = require('./database');
const { sendBirthdayEmail, initializeEmailService } = require('./email');
const { Notification } = require('electron');

let scheduledTask = null;
let notificationTask = null;

function startScheduler() {
  // Stop existing tasks if any
  if (scheduledTask) {
    scheduledTask.stop();
  }
  if (notificationTask) {
    notificationTask.stop();
  }

  const notificationTime = getSetting('notificationTime') || '09:00';
  const [hour, minute] = notificationTime.split(':');

  // Schedule daily email check at specified time
  scheduledTask = cron.schedule(`${minute} ${hour} * * *`, async () => {
    console.log('Running scheduled birthday check...');
    await checkAndSendBirthdayEmails();
  });

  // Check for upcoming birthdays every hour and send notifications
  notificationTask = cron.schedule('0 * * * *', async () => {
    await sendUpcomingBirthdayNotifications();
  });

  console.log(`Scheduler started - will run daily at ${notificationTime}`);
  console.log('Notification checker running hourly');
  
  // Run immediate check on startup
  setTimeout(() => {
    sendUpcomingBirthdayNotifications();
  }, 5000);
}

async function checkAndSendBirthdayEmails() {
  const emailEnabled = getSetting('emailEnabled') === 'true';
  if (!emailEnabled) {
    console.log('Email sending is disabled');
    return;
  }

  initializeEmailService();
  const birthdays = getTodaysBirthdays();
  
  console.log(`Found ${birthdays.length} birthdays today`);
  
  for (const contact of birthdays) {
    if (contact.email) {
      console.log(`Sending birthday email to ${contact.name}...`);
      const result = await sendBirthdayEmail(contact);
      
      if (result.success) {
        console.log(`✓ Email sent to ${contact.name}`);
        
        // Show success notification
        new Notification({
          title: '🎉 Birthday Email Sent',
          body: `Birthday wishes sent to ${contact.name}!`,
          icon: require('path').join(__dirname, '../public/icon.png')
        }).show();
      } else {
        console.error(`✗ Failed to send email to ${contact.name}:`, result.error);
        
        // Retry mechanism - wait 5 minutes and try again
        setTimeout(async () => {
          console.log(`Retrying email to ${contact.name}...`);
          const retryResult = await sendBirthdayEmail(contact);
          if (retryResult.success) {
            console.log(`✓ Retry successful for ${contact.name}`);
          } else {
            console.error(`✗ Retry failed for ${contact.name}`);
            
            // Show error notification
            new Notification({
              title: '❌ Email Failed',
              body: `Failed to send birthday email to ${contact.name}`,
              icon: require('path').join(__dirname, '../public/icon.png')
            }).show();
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    }
  }
}

async function sendUpcomingBirthdayNotifications() {
  const upcoming = getUpcomingBirthdays(7);
  const today = getTodaysBirthdays();
  
  // Notify about today's birthdays
  if (today.length > 0) {
    const names = today.map(c => c.name).join(', ');
    new Notification({
      title: '🎂 Birthday Today!',
      body: `Today is ${names}'s birthday! Don't forget to wish them!`,
      icon: require('path').join(__dirname, '../public/icon.png')
    }).show();
  }
  
  // Notify about tomorrow's birthdays
  const tomorrow = upcoming.filter(c => c.daysUntil === 1);
  if (tomorrow.length > 0) {
    const names = tomorrow.map(c => c.name).join(', ');
    new Notification({
      title: '📅 Birthday Tomorrow',
      body: `${names}'s birthday is tomorrow!`,
      icon: require('path').join(__dirname, '../public/icon.png')
    }).show();
  }
}

function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    console.log('Email scheduler stopped');
  }
  if (notificationTask) {
    notificationTask.stop();
    console.log('Notification scheduler stopped');
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  checkAndSendBirthdayEmails,
  sendUpcomingBirthdayNotifications
};
