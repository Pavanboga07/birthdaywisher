const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let backupInterval;

function startAutoBackup() {
  const userDataPath = app.getPath('userData');
  const backupDir = path.join(userDataPath, 'backups');
  
  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Auto-backup every hour
  backupInterval = setInterval(() => {
    createBackup();
  }, 60 * 60 * 1000); // 1 hour
  
  console.log('Auto-backup started (every 1 hour)');
  
  // Create initial backup
  createBackup();
}

function createBackup() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'birthdays.db');
    
    if (!fs.existsSync(dbPath)) {
      console.log('Database file not found, skipping backup');
      return;
    }
    
    const backupDir = path.join(userDataPath, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `birthdays-backup-${timestamp}.db`);
    
    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    console.log('Database backup created:', backupPath);
    
    // Clean old backups (keep last 10)
    cleanOldBackups(backupDir);
    
    return { success: true, path: backupPath };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: error.message };
  }
}

function cleanOldBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('birthdays-backup-'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    // Keep only the 10 most recent backups
    if (files.length > 10) {
      files.slice(10).forEach(file => {
        fs.unlinkSync(file.path);
        console.log('Deleted old backup:', file.name);
      });
    }
  } catch (error) {
    console.error('Failed to clean old backups:', error);
  }
}

function restoreBackup(backupPath) {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'birthdays.db');
    
    // Create backup of current database before restore
    if (fs.existsSync(dbPath)) {
      const emergencyBackup = path.join(userDataPath, 'birthdays-before-restore.db');
      fs.copyFileSync(dbPath, emergencyBackup);
    }
    
    // Restore from backup
    fs.copyFileSync(backupPath, dbPath);
    console.log('Database restored from:', backupPath);
    
    return { success: true };
  } catch (error) {
    console.error('Restore failed:', error);
    return { success: false, error: error.message };
  }
}

function stopAutoBackup() {
  if (backupInterval) {
    clearInterval(backupInterval);
    console.log('Auto-backup stopped');
  }
}

function getBackupList() {
  try {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('birthdays-backup-'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stats.size,
          date: stats.mtime
        };
      })
      .sort((a, b) => b.date - a.date);
    
    return files;
  } catch (error) {
    console.error('Failed to get backup list:', error);
    return [];
  }
}

module.exports = {
  startAutoBackup,
  createBackup,
  restoreBackup,
  stopAutoBackup,
  getBackupList
};
