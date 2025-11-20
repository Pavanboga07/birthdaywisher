const { sendBirthdayEmail } = require('./email');
const db = require('./database');
const { Notification } = require('electron');

/**
 * Email Queue Manager with Rate Limiting
 * Prevents email service abuse and ensures reliable delivery
 */

class EmailQueueManager {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    
    // Rate limiting configuration
    this.config = {
      maxEmailsPerMinute: 10,     // Max 10 emails per minute
      maxEmailsPerHour: 100,      // Max 100 emails per hour
      processingInterval: 6000,   // Process queue every 6 seconds
      retryDelay: 300000,         // 5 minutes retry delay
    };
    
    // Rate limiting trackers
    this.emailsThisMinute = [];
    this.emailsThisHour = [];
  }

  /**
   * Add an email to the queue
   */
  addToQueue(contact, subject, message, priority = 0) {
    try {
      const result = db.addToEmailQueue(contact, subject, message, priority);
      console.log(`✓ Added email to queue for ${contact.name} (ID: ${result.queueId})`);
      return result;
    } catch (error) {
      console.error('Error adding to queue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start processing the email queue
   */
  startProcessing() {
    if (this.isProcessing) {
      console.log('Queue processor already running');
      return;
    }

    this.isProcessing = true;
    console.log('📧 Email queue processor started');
    
    // Process immediately
    this.processQueue();
    
    // Then process at intervals
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);
    
    // Clean up rate limit trackers every minute
    setInterval(() => {
      this.cleanupRateLimitTrackers();
    }, 60000);
  }

  /**
   * Stop processing the queue
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('📧 Email queue processor stopped');
  }

  /**
   * Check if we can send more emails based on rate limits
   */
  canSendEmail() {
    const now = Date.now();
    
    // Clean up old entries
    this.emailsThisMinute = this.emailsThisMinute.filter(time => now - time < 60000);
    this.emailsThisHour = this.emailsThisHour.filter(time => now - time < 3600000);
    
    // Check limits
    if (this.emailsThisMinute.length >= this.config.maxEmailsPerMinute) {
      console.log('⚠️ Rate limit: Max emails per minute reached');
      return false;
    }
    
    if (this.emailsThisHour.length >= this.config.maxEmailsPerHour) {
      console.log('⚠️ Rate limit: Max emails per hour reached');
      return false;
    }
    
    return true;
  }

  /**
   * Record that an email was sent (for rate limiting)
   */
  recordEmailSent() {
    const now = Date.now();
    this.emailsThisMinute.push(now);
    this.emailsThisHour.push(now);
  }

  /**
   * Clean up rate limit tracking arrays
   */
  cleanupRateLimitTrackers() {
    const now = Date.now();
    this.emailsThisMinute = this.emailsThisMinute.filter(time => now - time < 60000);
    this.emailsThisHour = this.emailsThisHour.filter(time => now - time < 3600000);
  }

  /**
   * Process queued emails
   */
  async processQueue() {
    if (!this.canSendEmail()) {
      console.log('⏸️ Queue processing paused due to rate limits');
      return;
    }

    try {
      // Get pending emails from queue
      const queuedEmails = db.getQueuedEmails('pending', 5);
      
      if (queuedEmails.length === 0) {
        return; // Nothing to process
      }

      console.log(`📬 Processing ${queuedEmails.length} queued email(s)...`);

      for (const queueItem of queuedEmails) {
        // Check rate limit before each email
        if (!this.canSendEmail()) {
          console.log('⏸️ Rate limit reached, pausing queue processing');
          break;
        }

        await this.sendQueuedEmail(queueItem);
        
        // Small delay between emails
        await this.delay(1000);
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    }
  }

  /**
   * Send a single queued email
   */
  async sendQueuedEmail(queueItem) {
    try {
      console.log(`📤 Sending email to ${queueItem.contact_name}...`);
      
      // Reconstruct contact object
      const contact = {
        id: queueItem.contact_id,
        name: queueItem.contact_name,
        email: queueItem.contact_email
      };

      // Send the email
      const result = await sendBirthdayEmail(contact);

      if (result.success) {
        // Mark as sent
        db.updateEmailQueueStatus(queueItem.id, 'sent', null);
        db.recordEmailSent(true);
        this.recordEmailSent();
        
        console.log(`✅ Email sent to ${queueItem.contact_name}`);
        
        // Show notification
        new Notification({
          title: '✅ Email Sent',
          body: `Birthday email sent to ${queueItem.contact_name}`,
        }).show();
      } else {
        // Handle failure
        this.handleEmailFailure(queueItem, result.error);
      }
    } catch (error) {
      console.error('Error sending queued email:', error);
      this.handleEmailFailure(queueItem, error.message);
    }
  }

  /**
   * Handle email sending failure
   */
  handleEmailFailure(queueItem, error) {
    console.error(`❌ Failed to send email to ${queueItem.contact_name}: ${error}`);
    
    if (queueItem.retry_count < queueItem.max_retries - 1) {
      // Increment retry count and keep in pending state
      db.incrementQueueRetry(queueItem.id);
      db.recordEmailSent(false);
      
      console.log(`🔄 Will retry email to ${queueItem.contact_name} (Attempt ${queueItem.retry_count + 2}/${queueItem.max_retries})`);
    } else {
      // Max retries reached, mark as failed
      db.updateEmailQueueStatus(queueItem.id, 'failed', error);
      db.recordEmailSent(false);
      
      console.log(`💔 Max retries reached for ${queueItem.contact_name}`);
      
      new Notification({
        title: '❌ Email Failed',
        body: `Failed to send email to ${queueItem.contact_name} after ${queueItem.max_retries} attempts`,
      }).show();
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const stats = db.getQueueStats();
    return {
      ...stats,
      rateLimits: {
        emailsThisMinute: this.emailsThisMinute.length,
        maxPerMinute: this.config.maxEmailsPerMinute,
        emailsThisHour: this.emailsThisHour.length,
        maxPerHour: this.config.maxEmailsPerHour
      }
    };
  }

  /**
   * Clear old completed/failed queue items
   */
  cleanupOldItems(daysOld = 30) {
    return db.clearOldQueueItems(daysOld);
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update rate limiting configuration
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    console.log('📧 Queue configuration updated:', this.config);
  }

  /**
   * Process queue immediately (manual trigger)
   */
  async processNow() {
    console.log('🚀 Manual queue processing triggered');
    await this.processQueue();
  }

  /**
   * Get current processing status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      config: this.config,
      stats: this.getStats()
    };
  }
}

// Create singleton instance
const emailQueue = new EmailQueueManager();

module.exports = emailQueue;
