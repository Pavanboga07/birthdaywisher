const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');
const encryption = require('./encryption');

let db;

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'birthdays.db');
  
  console.log('Database path:', dbPath);
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Create tables - NO COMMENTS IN SQL
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      nickname TEXT,
      relation TEXT,
      email_theme TEXT DEFAULT 'balloons',
      custom_message TEXT,
      template_id INTEGER,
      category TEXT DEFAULT 'Uncategorized',
      last_contact_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(template_id) REFERENCES message_templates(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT,
      error TEXT,
      FOREIGN KEY(contact_id) REFERENCES contacts(id)
    );

    CREATE TABLE IF NOT EXISTS message_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS import_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      records_imported INTEGER,
      imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT,
      contact_name TEXT,
      contact_email TEXT,
      subject TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contact_id) REFERENCES contacts(id)
    );

    CREATE TABLE IF NOT EXISTS analytics_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      emails_sent INTEGER DEFAULT 0,
      emails_failed INTEGER DEFAULT 0,
      birthdays_count INTEGER DEFAULT 0,
      contacts_added INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analytics_monthly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      emails_sent INTEGER DEFAULT 0,
      emails_failed INTEGER DEFAULT 0,
      birthdays_count INTEGER DEFAULT 0,
      contacts_added INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(year, month)
    );

    CREATE INDEX IF NOT EXISTS idx_birthday ON contacts(birthday);
    CREATE INDEX IF NOT EXISTS idx_queue_status ON email_queue(status);
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_daily(date);
    CREATE INDEX IF NOT EXISTS idx_analytics_month ON analytics_monthly(year, month);
  `);

  // Initialize default settings
  const checkSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  if (!checkSetting.get('emailEnabled')) {
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('emailEnabled', 'false');
    insertSetting.run('emailFrom', '');
    insertSetting.run('emailPassword', '');
    insertSetting.run('notificationTime', '09:00');
    insertSetting.run('darkMode', 'false');
    insertSetting.run('emailTemplate', 'Happy Birthday {name}! 🎂 Wishing you an amazing day!');
  }

  // Insert default template if not exists
  const checkTemplate = db.prepare('SELECT * FROM message_templates WHERE id = 1');
  if (!checkTemplate.get()) {
    const insertTemplate = db.prepare(`
      INSERT INTO message_templates (id, name, subject, message, is_default) 
      VALUES (?, ?, ?, ?, ?)
    `);
    insertTemplate.run(
      1, 
      'Default Birthday', 
      'Happy Birthday {name}! 🎉', 
      'Happy Birthday {name}! 🎂 Wishing you an amazing day filled with joy and happiness!', 
      1
    );
  }

  console.log('Database initialized successfully');
  
  // Migrate existing passwords to encrypted format
  try {
    encryption.migrateToEncrypted(db, ['emailPassword']);
  } catch (error) {
    console.error('Encryption migration error:', error);
  }

  // Add columns for visual templates if they don't exist
  try {
    const tableInfo = db.pragma('table_info(message_templates)');
    const hasType = tableInfo.some(col => col.name === 'type');
    
    if (!hasType) {
      db.exec("ALTER TABLE message_templates ADD COLUMN type TEXT DEFAULT 'text'");
      db.exec("ALTER TABLE message_templates ADD COLUMN config TEXT");
      db.exec("ALTER TABLE message_templates ADD COLUMN html TEXT");
      console.log('Added visual template columns to message_templates');
    }
  } catch (error) {
    console.error('Schema update error:', error);
  }
  
  return db;
}

// Contact operations
function addContact(contact) {
  const stmt = db.prepare(`
    INSERT INTO contacts (id, name, birthday, email, phone, notes, template_id, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  stmt.run(
    id, 
    contact.name, 
    contact.birthday, 
    contact.email || null, 
    contact.phone || null, 
    contact.notes || null,
    contact.template_id || null,
    contact.category || 'Uncategorized'
  );
  return { success: true, id };
}

function getAllContacts() {
  const stmt = db.prepare('SELECT * FROM contacts ORDER BY name ASC');
  return stmt.all();
}

function updateContact(id, contact) {
  const stmt = db.prepare(`
    UPDATE contacts 
    SET name = ?, birthday = ?, email = ?, phone = ?, notes = ?, template_id = ?, category = ?
    WHERE id = ?
  `);
  stmt.run(
    contact.name, 
    contact.birthday, 
    contact.email, 
    contact.phone, 
    contact.notes,
    contact.template_id || null,
    contact.category || 'Uncategorized',
    id
  );
  return { success: true };
}

function deleteContact(id) {
  try {
    // Use a transaction to delete contact and all related records
    const deleteTransaction = db.transaction(() => {
      // Delete related email logs
      const deleteEmailLog = db.prepare('DELETE FROM email_log WHERE contact_id = ?');
      const emailLogResult = deleteEmailLog.run(id);
      console.log(`Deleted ${emailLogResult.changes} email log entries for contact ${id}`);
      
      // Delete related email queue items
      const deleteEmailQueue = db.prepare('DELETE FROM email_queue WHERE contact_id = ?');
      const queueResult = deleteEmailQueue.run(id);
      console.log(`Deleted ${queueResult.changes} email queue entries for contact ${id}`);
      
      // Finally delete the contact
      const deleteContactStmt = db.prepare('DELETE FROM contacts WHERE id = ?');
      const contactResult = deleteContactStmt.run(id);
      console.log(`Deleted ${contactResult.changes} contact(s) with id ${id}`);
    });
    
    deleteTransaction();
    console.log('Delete transaction completed successfully for contact:', id);
    return { success: true };
  } catch (error) {
    console.error('Error in deleteContact:', error);
    throw error;
  }
}

function checkDuplicateContact(name, email, excludeId = null) {
  let query = 'SELECT * FROM contacts WHERE (LOWER(name) = LOWER(?) OR LOWER(email) = LOWER(?))';
  const params = [name, email];
  
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const stmt = db.prepare(query);
  const duplicates = stmt.all(...params);
  return duplicates;
}

function updateLastContactDate(contactId) {
  const stmt = db.prepare('UPDATE contacts SET last_contact_date = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(contactId);
  return { success: true };
}

function bulkUpdateCategory(contactIds, category) {
  const placeholders = contactIds.map(() => '?').join(',');
  const stmt = db.prepare(`UPDATE contacts SET category = ? WHERE id IN (${placeholders})`);
  stmt.run(category, ...contactIds);
  return { success: true };
}

function getAllCategories() {
  const stmt = db.prepare('SELECT DISTINCT category FROM contacts WHERE category IS NOT NULL ORDER BY category ASC');
  return stmt.all().map(row => row.category);
}

function getTodaysBirthdays() {
  const today = new Date();
  const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const stmt = db.prepare('SELECT * FROM contacts WHERE substr(birthday, 6) = ?');
  return stmt.all(monthDay);
}

function getUpcomingBirthdays(days = 7) {
  const contacts = getAllContacts();
  const today = new Date();
  const upcoming = [];

  contacts.forEach(contact => {
    const [year, month, day] = contact.birthday.split('-');
    const birthdayThisYear = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
    
    if (birthdayThisYear < today) {
      birthdayThisYear.setFullYear(today.getFullYear() + 1);
    }
    
    const daysUntil = Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil >= 0 && daysUntil <= days) {
      upcoming.push({ ...contact, daysUntil });
    }
  });

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

// Settings operations
function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key);
  
  // Decrypt sensitive settings
  if (result && result.value && key === 'emailPassword') {
    return encryption.decryptData(result.value);
  }
  
  return result ? result.value : null;
}

function setSetting(key, value) {
  // Encrypt sensitive settings
  let valueToStore = value;
  if (key === 'emailPassword') {
    valueToStore = encryption.encryptData(value);
  }
  
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, valueToStore);
  return { success: true };
}

function getAllSettings() {
  const stmt = db.prepare('SELECT * FROM settings');
  const rows = stmt.all();
  const settings = {};
  rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

// Email log
function logEmail(contactId, status, error = null) {
  const stmt = db.prepare(`
    INSERT INTO email_log (contact_id, status, error)
    VALUES (?, ?, ?)
  `);
  stmt.run(contactId, status, error);
  
  // Record in analytics
  if (status === 'sent') {
    recordEmailSent(true);
  } else if (status === 'failed') {
    recordEmailSent(false);
  }
}

function getEmailLog(limit = 50) {
  const stmt = db.prepare(`
    SELECT el.*, c.name as contact_name
    FROM email_log el
    LEFT JOIN contacts c ON el.contact_id = c.id
    ORDER BY el.sent_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

// Template operations
function getAllTemplates() {
  const stmt = db.prepare('SELECT * FROM message_templates ORDER BY is_default DESC, created_at DESC');
  const templates = stmt.all();
  return templates.map(t => {
    if (t.config && typeof t.config === 'string') {
      try {
        t.config = JSON.parse(t.config);
      } catch (e) {
        console.error('Error parsing template config:', e);
      }
    }
    return t;
  });
}

function addTemplate(template) {
  try {
    console.log('Database: Adding template:', {
      name: template.name,
      subject: template.subject,
      messageLength: template.message?.length,
      isDefault: template.isDefault,
      type: template.type
    });
    
    const stmt = db.prepare(`
      INSERT INTO message_templates (name, subject, message, is_default, type, config, html)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      template.name, 
      template.subject, 
      template.message, 
      template.isDefault ? 1 : 0,
      template.type || 'text',
      template.config ? JSON.stringify(template.config) : null,
      template.html || null
    );
    console.log('Database: Template added successfully, id:', result.lastInsertRowid);
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('Database: Error adding template:', error);
    return { success: false, error: error.message };
  }
}

function updateTemplate(id, template) {
  try {
    console.log('Database: Updating template:', id, {
      name: template.name,
      subject: template.subject,
      messageLength: template.message?.length,
      isDefault: template.isDefault,
      type: template.type
    });
    
    // Use transaction to ensure only one default template exists
    const updateTransaction = db.transaction(() => {
      // If setting this as default, unset all others first
      if (template.isDefault) {
        const unsetDefault = db.prepare('UPDATE message_templates SET is_default = 0 WHERE id != ?');
        unsetDefault.run(id);
        console.log('Database: Cleared default flag from all other templates');
      }
      
      // Now update this template
      const stmt = db.prepare(`
        UPDATE message_templates 
        SET name = ?, subject = ?, message = ?, is_default = ?, type = ?, config = ?, html = ?
        WHERE id = ?
      `);
      const result = stmt.run(
        template.name, 
        template.subject, 
        template.message, 
        template.isDefault ? 1 : 0, 
        template.type || 'text',
        template.config ? JSON.stringify(template.config) : null,
        template.html || null,
        id
      );
      return result;
    });
    
    const result = updateTransaction();
    console.log('Database: Template updated successfully, changes:', result.changes);
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Database: Error updating template:', error);
    return { success: false, error: error.message };
  }
}

function deleteTemplate(id) {
  try {
    // Use a transaction to safely delete the template
    const deleteTransaction = db.transaction(() => {
      // First, set all contacts using this template to NULL (no template)
      const updateContacts = db.prepare('UPDATE contacts SET template_id = NULL WHERE template_id = ?');
      const result = updateContacts.run(id);
      console.log(`Cleared template reference from ${result.changes} contact(s)`);
      
      // Now delete the template
      const deleteStmt = db.prepare('DELETE FROM message_templates WHERE id = ?');
      deleteStmt.run(id);
      console.log(`Deleted template with id ${id}`);
    });
    
    deleteTransaction();
    return { success: true };
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    throw error;
  }
}

function getTemplate(id) {
  const stmt = db.prepare('SELECT * FROM message_templates WHERE id = ?');
  const template = stmt.get(id);
  if (template && template.config && typeof template.config === 'string') {
    try {
      template.config = JSON.parse(template.config);
    } catch (e) {
      console.error('Error parsing template config:', e);
    }
  }
  return template;
}

function getDefaultTemplate() {
  const stmt = db.prepare('SELECT * FROM message_templates WHERE is_default = 1 LIMIT 1');
  const template = stmt.get();
  if (template && template.config && typeof template.config === 'string') {
    try {
      template.config = JSON.parse(template.config);
    } catch (e) {
      console.error('Error parsing template config:', e);
    }
  }
  return template;
}

// Import history
function logImport(filename, recordsImported) {
  const stmt = db.prepare('INSERT INTO import_history (filename, records_imported) VALUES (?, ?)');
  stmt.run(filename, recordsImported);
}

function getImportHistory(limit = 10) {
  const stmt = db.prepare('SELECT * FROM import_history ORDER BY imported_at DESC LIMIT ?');
  return stmt.all(limit);
}

// Bulk import contacts
function bulkAddContacts(contacts) {
  const stmt = db.prepare(`
    INSERT INTO contacts (id, name, birthday, email, phone, notes, category, template_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let imported = 0;
  const transaction = db.transaction((contactsList) => {
    for (const contact of contactsList) {
      try {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        stmt.run(
          id, 
          contact.name, 
          contact.birthday, 
          contact.email || null, 
          contact.phone || null, 
          contact.notes || null,
          contact.category || 'Uncategorized',
          contact.template_id || null
        );
        imported++;
      } catch (error) {
        console.error('Error importing contact:', contact.name, error);
      }
    }
  });
  
  transaction(contacts);
  return { success: true, imported };
}

// Email Queue operations
function addToEmailQueue(contact, subject, message, priority = 0) {
  const stmt = db.prepare(`
    INSERT INTO email_queue (contact_id, contact_name, contact_email, subject, message, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(contact.id, contact.name, contact.email, subject, message, priority);
  return { success: true, queueId: result.lastInsertRowid };
}

function getQueuedEmails(status = 'pending', limit = 10) {
  const stmt = db.prepare(`
    SELECT * FROM email_queue 
    WHERE status = ? AND retry_count < max_retries
    ORDER BY priority DESC, created_at ASC
    LIMIT ?
  `);
  return stmt.all(status, limit);
}

function updateEmailQueueStatus(id, status, error = null) {
  const stmt = db.prepare(`
    UPDATE email_queue 
    SET status = ?, sent_at = CURRENT_TIMESTAMP, error = ?
    WHERE id = ?
  `);
  stmt.run(status, error, id);
  return { success: true };
}

function incrementQueueRetry(id) {
  const stmt = db.prepare(`
    UPDATE email_queue 
    SET retry_count = retry_count + 1, status = 'pending'
    WHERE id = ?
  `);
  stmt.run(id);
  return { success: true };
}

function getQueueStats() {
  const stmt = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM email_queue
    GROUP BY status
  `);
  const results = stmt.all();
  const stats = {
    pending: 0,
    sent: 0,
    failed: 0,
    total: 0
  };
  
  results.forEach(row => {
    stats[row.status] = row.count;
    stats.total += row.count;
  });
  
  return stats;
}

function clearOldQueueItems(daysOld = 30) {
  const stmt = db.prepare(`
    DELETE FROM email_queue 
    WHERE status IN ('sent', 'failed') 
    AND datetime(created_at) < datetime('now', '-' || ? || ' days')
  `);
  const result = stmt.run(daysOld);
  return { success: true, deleted: result.changes };
}

// Analytics operations
function updateDailyAnalytics(date, field, increment = 1) {
  const checkStmt = db.prepare('SELECT id FROM analytics_daily WHERE date = ?');
  const existing = checkStmt.get(date);
  
  if (existing) {
    const updateStmt = db.prepare(`UPDATE analytics_daily SET ${field} = ${field} + ? WHERE date = ?`);
    updateStmt.run(increment, date);
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO analytics_daily (date, ${field}) VALUES (?, ?)
    `);
    insertStmt.run(date, increment);
  }
}

function updateMonthlyAnalytics(year, month, field, increment = 1) {
  const checkStmt = db.prepare('SELECT id FROM analytics_monthly WHERE year = ? AND month = ?');
  const existing = checkStmt.get(year, month);
  
  if (existing) {
    const updateStmt = db.prepare(`UPDATE analytics_monthly SET ${field} = ${field} + ? WHERE year = ? AND month = ?`);
    updateStmt.run(increment, year, month);
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO analytics_monthly (year, month, ${field}) VALUES (?, ?, ?)
    `);
    insertStmt.run(year, month, increment);
  }
}

function recordEmailSent(success = true) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const field = success ? 'emails_sent' : 'emails_failed';
  updateDailyAnalytics(today, field);
  updateMonthlyAnalytics(year, month, field);
}

function recordBirthday() {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  updateDailyAnalytics(today, 'birthdays_count');
  updateMonthlyAnalytics(year, month, 'birthdays_count');
}

function recordContactAdded() {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  updateDailyAnalytics(today, 'contacts_added');
  updateMonthlyAnalytics(year, month, 'contacts_added');
}

function getDailyAnalytics(days = 30) {
  const stmt = db.prepare(`
    SELECT * FROM analytics_daily 
    WHERE date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC
  `);
  return stmt.all(days);
}

function getMonthlyAnalytics(months = 12) {
  const stmt = db.prepare(`
    SELECT * FROM analytics_monthly 
    ORDER BY year DESC, month DESC
    LIMIT ?
  `);
  return stmt.all(months);
}

function getCurrentMonthStats() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const stmt = db.prepare('SELECT * FROM analytics_monthly WHERE year = ? AND month = ?');
  const result = stmt.get(year, month);
  
  return result || {
    emails_sent: 0,
    emails_failed: 0,
    birthdays_count: 0,
    contacts_added: 0
  };
}

function getAnalyticsSummary() {
  // Total stats
  const totalStmt = db.prepare(`
    SELECT 
      SUM(emails_sent) as total_emails_sent,
      SUM(emails_failed) as total_emails_failed,
      SUM(birthdays_count) as total_birthdays,
      SUM(contacts_added) as total_contacts_added
    FROM analytics_monthly
  `);
  const totals = totalStmt.get() || {};
  
  // Current month
  const currentMonth = getCurrentMonthStats();
  
  // Last 7 days
  const last7DaysStmt = db.prepare(`
    SELECT 
      SUM(emails_sent) as emails_sent,
      SUM(emails_failed) as emails_failed,
      SUM(birthdays_count) as birthdays_count
    FROM analytics_daily
    WHERE date >= date('now', '-7 days')
  `);
  const last7Days = last7DaysStmt.get() || {};
  
  // Success rate
  const totalEmails = (totals.total_emails_sent || 0) + (totals.total_emails_failed || 0);
  const successRate = totalEmails > 0 
    ? ((totals.total_emails_sent || 0) / totalEmails * 100).toFixed(1)
    : 0;
  
  return {
    totals: {
      emailsSent: totals.total_emails_sent || 0,
      emailsFailed: totals.total_emails_failed || 0,
      birthdays: totals.total_birthdays || 0,
      contactsAdded: totals.total_contacts_added || 0,
      successRate: parseFloat(successRate)
    },
    currentMonth: {
      emailsSent: currentMonth.emails_sent || 0,
      emailsFailed: currentMonth.emails_failed || 0,
      birthdays: currentMonth.birthdays_count || 0,
      contactsAdded: currentMonth.contacts_added || 0
    },
    last7Days: {
      emailsSent: last7Days.emails_sent || 0,
      emailsFailed: last7Days.emails_failed || 0,
      birthdays: last7Days.birthdays_count || 0
    }
  };
}

module.exports = {
  initDatabase,
  addContact,
  getAllContacts,
  updateContact,
  deleteContact,
  checkDuplicateContact,
  updateLastContactDate,
  bulkUpdateCategory,
  getAllCategories,
  getTodaysBirthdays,
  getUpcomingBirthdays,
  getSetting,
  setSetting,
  getAllSettings,
  logEmail,
  getEmailLog,
  getAllTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplate,
  getDefaultTemplate,
  logImport,
  getImportHistory,
  bulkAddContacts,
  // Email Queue
  addToEmailQueue,
  getQueuedEmails,
  updateEmailQueueStatus,
  incrementQueueRetry,
  getQueueStats,
  clearOldQueueItems,
  // Analytics
  recordEmailSent,
  recordBirthday,
  recordContactAdded,
  getDailyAnalytics,
  getMonthlyAnalytics,
  getCurrentMonthStats,
  getAnalyticsSummary
};
