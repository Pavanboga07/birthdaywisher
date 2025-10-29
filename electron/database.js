const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    CREATE INDEX IF NOT EXISTS idx_birthday ON contacts(birthday);
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
  return db;
}

// Contact operations
function addContact(contact) {
  const stmt = db.prepare(`
    INSERT INTO contacts (id, name, birthday, email, phone, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  stmt.run(id, contact.name, contact.birthday, contact.email || null, contact.phone || null, contact.notes || null);
  return { success: true, id };
}

function getAllContacts() {
  const stmt = db.prepare('SELECT * FROM contacts ORDER BY name ASC');
  return stmt.all();
}

function updateContact(id, contact) {
  const stmt = db.prepare(`
    UPDATE contacts 
    SET name = ?, birthday = ?, email = ?, phone = ?, notes = ?
    WHERE id = ?
  `);
  stmt.run(contact.name, contact.birthday, contact.email, contact.phone, contact.notes, id);
  return { success: true };
}

function deleteContact(id) {
  const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
  stmt.run(id);
  return { success: true };
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
  return result ? result.value : null;
}

function setSetting(key, value) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
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
  return stmt.all();
}

function addTemplate(template) {
  const stmt = db.prepare(`
    INSERT INTO message_templates (name, subject, message, is_default)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(template.name, template.subject, template.message, template.isDefault ? 1 : 0);
  return { success: true };
}

function updateTemplate(id, template) {
  const stmt = db.prepare(`
    UPDATE message_templates 
    SET name = ?, subject = ?, message = ?, is_default = ?
    WHERE id = ?
  `);
  stmt.run(template.name, template.subject, template.message, template.isDefault ? 1 : 0, id);
  return { success: true };
}

function deleteTemplate(id) {
  const stmt = db.prepare('DELETE FROM message_templates WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

function getDefaultTemplate() {
  const stmt = db.prepare('SELECT * FROM message_templates WHERE is_default = 1 LIMIT 1');
  return stmt.get();
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
    INSERT INTO contacts (id, name, birthday, email, phone, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  let imported = 0;
  const transaction = db.transaction((contactsList) => {
    for (const contact of contactsList) {
      try {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        stmt.run(id, contact.name, contact.birthday, contact.email || null, contact.phone || null, contact.notes || null);
        imported++;
      } catch (error) {
        console.error('Error importing contact:', contact.name, error);
      }
    }
  });
  
  transaction(contacts);
  return { success: true, imported };
}

module.exports = {
  initDatabase,
  addContact,
  getAllContacts,
  updateContact,
  deleteContact,
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
  getDefaultTemplate,
  logImport,
  getImportHistory,
  bulkAddContacts
};
