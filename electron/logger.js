const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let logFilePath;

function initLogger() {
  const userDataPath = app.getPath('userData');
  const logsDir = path.join(userDataPath, 'logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Create log file with date
  const date = new Date().toISOString().split('T')[0];
  logFilePath = path.join(logsDir, `app-${date}.log`);
  
  console.log('Logger initialized:', logFilePath);
  
  // Redirect console.error to log file
  const originalError = console.error;
  console.error = function(...args) {
    originalError.apply(console, args);
    logError('ERROR', args.join(' '));
  };
  
  // Log startup
  logInfo('Application started');
}

function logInfo(message) {
  writeLog('INFO', message);
}

function logError(type, message) {
  writeLog(type, message);
}

function logWarning(message) {
  writeLog('WARNING', message);
}

function writeLog(level, message) {
  if (!logFilePath) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  try {
    fs.appendFileSync(logFilePath, logEntry);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

function getLogFilePath() {
  return logFilePath;
}

// Clean old logs (keep last 30 days)
function cleanOldLogs() {
  try {
    const logsDir = path.join(app.getPath('userData'), 'logs');
    const files = fs.readdirSync(logsDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log('Deleted old log:', file);
      }
    });
  } catch (error) {
    console.error('Failed to clean old logs:', error);
  }
}

module.exports = {
  initLogger,
  logInfo,
  logError,
  logWarning,
  getLogFilePath,
  cleanOldLogs
};
