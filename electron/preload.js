const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Contacts
  addContact: (contact) => ipcRenderer.invoke('add-contact', contact),
  getAllContacts: () => ipcRenderer.invoke('get-all-contacts'),
  updateContact: (id, contact) => ipcRenderer.invoke('update-contact', id, contact),
  deleteContact: (id) => ipcRenderer.invoke('delete-contact', id),
  getTodaysBirthdays: () => ipcRenderer.invoke('get-todays-birthdays'),
  getUpcomingBirthdays: (days) => ipcRenderer.invoke('get-upcoming-birthdays', days),
  
  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
  
  // Email
  sendEmail: (contact) => ipcRenderer.invoke('send-email', contact),
  testEmail: (address) => ipcRenderer.invoke('test-email', address),
  getEmailLog: (limit) => ipcRenderer.invoke('get-email-log', limit),
  
  // Excel Import/Export - NEW
  importExcel: () => ipcRenderer.invoke('import-excel'),
  exportExcel: () => ipcRenderer.invoke('export-excel'),
  downloadTemplate: () => ipcRenderer.invoke('download-template'),
  getImportHistory: () => ipcRenderer.invoke('get-import-history'),
  
  // Message Templates - NEW
  getAllTemplates: () => ipcRenderer.invoke('get-all-templates'),
  addTemplate: (template) => ipcRenderer.invoke('add-template', template),
  updateTemplate: (id, template) => ipcRenderer.invoke('update-template', id, template),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),
  
  // Autostart - NEW
  enableAutostart: () => ipcRenderer.invoke('enable-autostart'),
  disableAutostart: () => ipcRenderer.invoke('disable-autostart'),
  checkAutostart: () => ipcRenderer.invoke('check-autostart'),
  
  // App
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body)
});
