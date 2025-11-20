const { safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Encryption utilities using Electron's safeStorage API
 * This provides OS-level encryption using the system's credential store
 */

/**
 * Encrypts sensitive text data
 * @param {string} plainText - The text to encrypt
 * @returns {string} Base64 encoded encrypted data
 */
function encryptData(plainText) {
  if (!plainText) {
    return '';
  }

  try {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('Encryption not available, storing as base64');
      // Fallback to base64 encoding (not secure, but better than plain text)
      return 'base64:' + Buffer.from(plainText).toString('base64');
    }

    const encrypted = safeStorage.encryptString(plainText);
    return 'encrypted:' + encrypted.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to base64
    return 'base64:' + Buffer.from(plainText).toString('base64');
  }
}

/**
 * Decrypts encrypted data
 * @param {string} encryptedData - The encrypted data (base64 encoded)
 * @returns {string} Decrypted plain text
 */
function decryptData(encryptedData) {
  if (!encryptedData) {
    return '';
  }

  try {
    // Check if data is encrypted or base64 encoded
    if (encryptedData.startsWith('encrypted:')) {
      const encryptedBuffer = Buffer.from(encryptedData.substring(10), 'base64');
      return safeStorage.decryptString(encryptedBuffer);
    } else if (encryptedData.startsWith('base64:')) {
      // Decode base64 fallback
      return Buffer.from(encryptedData.substring(7), 'base64').toString('utf8');
    } else {
      // Legacy plain text - return as is but should be re-encrypted
      console.warn('Found unencrypted data, should be migrated');
      return encryptedData;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    // Return empty string on decryption failure
    return '';
  }
}

/**
 * Checks if encryption is available on the system
 * @returns {boolean}
 */
function isEncryptionAvailable() {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch (error) {
    return false;
  }
}

/**
 * Migrates plain text settings to encrypted format
 * @param {Object} db - Database instance
 * @param {Array} sensitiveKeys - Keys that should be encrypted
 */
function migrateToEncrypted(db, sensitiveKeys = ['emailPassword']) {
  console.log('Starting encryption migration...');
  
  try {
    const getSetting = db.prepare('SELECT key, value FROM settings WHERE key = ?');
    const updateSetting = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    
    sensitiveKeys.forEach(key => {
      const result = getSetting.get(key);
      if (result && result.value && !result.value.startsWith('encrypted:') && !result.value.startsWith('base64:')) {
        const encrypted = encryptData(result.value);
        updateSetting.run(encrypted, key);
        console.log(`✓ Migrated ${key} to encrypted storage`);
      }
    });
    
    console.log('Encryption migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

module.exports = {
  encryptData,
  decryptData,
  isEncryptionAvailable,
  migrateToEncrypted
};
