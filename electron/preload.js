const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Contacts
  addContact: (contact) => ipcRenderer.invoke('add-contact', contact),
  getAllContacts: () => ipcRenderer.invoke('get-all-contacts'),
  updateContact: (id, contact) => ipcRenderer.invoke('update-contact', id, contact),
  deleteContact: (id) => ipcRenderer.invoke('delete-contact', id),
  getTodaysBirthdays: () => ipcRenderer.invoke('get-todays-birthdays'),
  getUpcomingBirthdays: (days) => ipcRenderer.invoke('get-upcoming-birthdays', days),
  checkDuplicateContact: (name, email, excludeId) => ipcRenderer.invoke('check-duplicate-contact', name, email, excludeId),
  
  // Categories
  getAllCategories: () => ipcRenderer.invoke('get-all-categories'),
  bulkUpdateCategory: (contactIds, category) => ipcRenderer.invoke('bulk-update-category', contactIds, category),
  
  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
  
  // Email
  sendEmail: (contact) => ipcRenderer.invoke('send-email', contact),
  testEmail: (address) => ipcRenderer.invoke('test-email', address),
  getEmailLog: (limit) => ipcRenderer.invoke('get-email-log', limit),
  
  // Excel Import/Export
  importExcel: () => ipcRenderer.invoke('import-excel'),
  exportExcel: () => ipcRenderer.invoke('export-excel'),
  exportContactsExcel: (contacts) => ipcRenderer.invoke('export-contacts-excel', contacts),
  downloadTemplate: () => ipcRenderer.invoke('download-template'),
  getImportHistory: () => ipcRenderer.invoke('get-import-history'),
  
  // Message Templates
  getAllTemplates: () => ipcRenderer.invoke('get-all-templates'),
  addTemplate: (template) => ipcRenderer.invoke('add-template', template),
  updateTemplate: (id, template) => ipcRenderer.invoke('update-template', id, template),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),
  
  // Autostart
  enableAutostart: () => ipcRenderer.invoke('enable-autostart'),
  disableAutostart: () => ipcRenderer.invoke('disable-autostart'),
  checkAutostart: () => ipcRenderer.invoke('check-autostart'),
  
  // Backup
  createBackup: () => ipcRenderer.invoke('create-backup'),
  getBackupList: () => ipcRenderer.invoke('get-backup-list'),
  restoreBackup: (path) => ipcRenderer.invoke('restore-backup', path),
  
  // Logs
  getLogPath: () => ipcRenderer.invoke('get-log-path'),
  
  // Analytics
  getAnalyticsSummary: () => ipcRenderer.invoke('get-analytics-summary'),
  getDailyAnalytics: (days) => ipcRenderer.invoke('get-daily-analytics', days),
  getMonthlyAnalytics: (months) => ipcRenderer.invoke('get-monthly-analytics', months),
  getCurrentMonthStats: () => ipcRenderer.invoke('get-current-month-stats'),
  
  // Email Queue
  getQueueStats: () => ipcRenderer.invoke('get-queue-stats'),
  getQueueStatus: () => ipcRenderer.invoke('get-queue-status'),
  processQueueNow: () => ipcRenderer.invoke('process-queue-now'),
  clearOldQueueItems: (daysOld) => ipcRenderer.invoke('clear-old-queue-items', daysOld),
  
  // App
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body)
});

console.log('Preload script loaded successfully');
