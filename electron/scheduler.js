const cron = require('node-cron');
const { getTodaysBirthdays, getUpcomingBirthdays, getSetting, recordBirthday } = require('./database');
const { initializeEmailService } = require('./email');
const emailQueue = require('./email-queue');
const emailTemplates = require('./email-templates');
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
  
  // Start email queue processor
  emailQueue.startProcessing();
  console.log('Email queue processor started');
  
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
  
  let queued = 0;
  let skipped = 0;
  
  for (const contact of birthdays) {
    if (contact.email) {
      // Generate email with beautiful universal template
      const emailContent = emailTemplates.generateBirthdayEmail(contact);
      
      // Add to queue instead of sending directly
      const result = emailQueue.addToQueue(contact, emailContent.subject, emailContent.html, 1);
      
      if (result.success) {
        queued++;
        console.log(`✓ Queued birthday email for ${contact.name}`);
      } else {
        skipped++;
        console.log(`✗ Failed to queue email for ${contact.name}`);
      }
      
      // Record birthday in analytics
      recordBirthday();
    } else {
      skipped++;
      console.log(`⊘ Skipped ${contact.name} (no email address)`);
    }
  }
  
  if (queued > 0) {
    new Notification({
      title: '📧 Birthday Emails Queued',
      body: `${queued} beautiful birthday email(s) ready to send! ${skipped > 0 ? `${skipped} skipped.` : ''}`,
      icon: require('path').join(__dirname, '../public/wishmailer.jpeg')
    }).show();
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
      icon: require('path').join(__dirname, '../public/wishmailer.jpeg')
    }).show();
  }
  
  // Notify about tomorrow's birthdays
  const tomorrow = upcoming.filter(c => c.daysUntil === 1);
  if (tomorrow.length > 0) {
    const names = tomorrow.map(c => c.name).join(', ');
    new Notification({
      title: '📅 Birthday Tomorrow',
      body: `${names}'s birthday is tomorrow!`,
      icon: require('path').join(__dirname, '../public/wishmailer.jpeg')
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
  
  // Stop email queue processor
  emailQueue.stopProcessing();
  console.log('Email queue processor stopped');
}

module.exports = {
  startScheduler,
  stopScheduler,
  checkAndSendBirthdayEmails,
  sendUpcomingBirthdayNotifications
};
