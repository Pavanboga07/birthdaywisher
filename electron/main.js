const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const db = require('./database');
const email = require('./email');
const scheduler = require('./scheduler');
const excelImport = require('./excel-import');
const autostart = require('./autostart');
const logger = require('./logger');
const backup = require('./backup');
const updater = require('./updater');

let mainWindow;
let tray;

// Handle crashes
process.on('uncaughtException', (error) => {
  logger.logError('CRASH', error.stack);
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.logError('UNHANDLED_REJECTION', `${reason}`);
  console.error('Unhandled Rejection:', reason);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logger.logInfo('Main window shown');
  });

  // Load app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
  }

  // System tray
  createTray();
  
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      new Notification({
        title: 'Birthday Reminder',
        body: 'App is still running in the system tray'
      }).show();
    }
  });

  // Auto-updater
  if (process.env.NODE_ENV !== 'development') {
    updater.initAutoUpdater(mainWindow);
  }
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '../public/icon.png');
    
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
    } else {
      logger.logWarning('Tray icon not found');
      tray = new Tray(path.join(__dirname, '../public/icon.png'));
    }
    
    updateTrayMenu();
    
    tray.setToolTip('Birthday Reminder');
    
    tray.on('click', () => {
      mainWindow.show();
    });
    
    logger.logInfo('System tray created');
  } catch (error) {
    logger.logError('TRAY_CREATE', error.toString());
  }
}

function updateTrayMenu() {
  const todaysBirthdays = db.getTodaysBirthdays();
  const upcoming = db.getUpcomingBirthdays(7);
  
  const menuItems = [
    {
      label: 'Show App',
      click: () => mainWindow.show()
    },
    { type: 'separator' }
  ];
  
  if (todaysBirthdays.length > 0) {
    menuItems.push({
      label: `🎉 ${todaysBirthdays.length} Birthday${todaysBirthdays.length > 1 ? 's' : ''} Today`,
      enabled: false
    });
    todaysBirthdays.forEach(contact => {
      menuItems.push({
        label: `   ${contact.name}`,
        enabled: false
      });
    });
    menuItems.push({ type: 'separator' });
  }
  
  if (upcoming.length > 0) {
    menuItems.push({
      label: `📅 ${upcoming.length} Upcoming This Week`,
      enabled: false
    });
  }
  
  menuItems.push(
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: () => updater.checkForUpdates()
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  );
  
  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
}

// Update tray menu every 5 minutes
setInterval(() => {
  if (tray) {
    updateTrayMenu();
  }
}, 5 * 60 * 1000);

// IPC Handlers
function setupIPC() {
  // Contacts
  ipcMain.handle('add-contact', async (event, contact) => {
    try {
      const result = db.addContact(contact);
      logger.logInfo(`Contact added: ${contact.name}`);
      updateTrayMenu();
      return result;
    } catch (error) {
      logger.logError('ADD_CONTACT', error.toString());
      throw error;
    }
  });

  ipcMain.handle('get-all-contacts', async () => {
    return db.getAllContacts();
  });

  ipcMain.handle('update-contact', async (event, id, contact) => {
    try {
      const result = db.updateContact(id, contact);
      logger.logInfo(`Contact updated: ${contact.name}`);
      updateTrayMenu();
      return result;
    } catch (error) {
      logger.logError('UPDATE_CONTACT', error.toString());
      throw error;
    }
  });

  ipcMain.handle('delete-contact', async (event, id) => {
    try {
      const result = db.deleteContact(id);
      logger.logInfo(`Contact deleted: ${id}`);
      updateTrayMenu();
      return result;
    } catch (error) {
      logger.logError('DELETE_CONTACT', error.toString());
      throw error;
    }
  });

  ipcMain.handle('get-todays-birthdays', async () => {
    return db.getTodaysBirthdays();
  });

  ipcMain.handle('get-upcoming-birthdays', async (event, days) => {
    return db.getUpcomingBirthdays(days);
  });

  // Settings
  ipcMain.handle('get-setting', async (event, key) => {
    return db.getSetting(key);
  });

  ipcMain.handle('set-setting', async (event, key, value) => {
    try {
      const result = db.setSetting(key, value);
      logger.logInfo(`Setting updated: ${key}`);
      
      if (key === 'notificationTime') {
        scheduler.stopScheduler();
        scheduler.startScheduler();
      }
      
      if (key === 'emailFrom' || key === 'emailPassword') {
        email.resetEmailService();
      }
      
      return result;
    } catch (error) {
      logger.logError('SET_SETTING', error.toString());
      throw error;
    }
  });

  ipcMain.handle('get-all-settings', async () => {
    return db.getAllSettings();
  });

  // Email
  ipcMain.handle('send-email', async (event, contact) => {
    try {
      const result = await email.sendBirthdayEmail(contact);
      logger.logInfo(`Email sent to: ${contact.name} - ${result.success ? 'Success' : 'Failed'}`);
      return result;
    } catch (error) {
      logger.logError('SEND_EMAIL', error.toString());
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('test-email', async (event, address) => {
    try {
      const result = await email.testEmail(address);
      logger.logInfo(`Test email: ${result.success ? 'Success' : 'Failed'}`);
      return result;
    } catch (error) {
      logger.logError('TEST_EMAIL', error.toString());
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-email-log', async (event, limit) => {
    return db.getEmailLog(limit);
  });

  // Excel Import/Export
  ipcMain.handle('import-excel', async (event) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
      });
      
      if (result.canceled) return { success: false, canceled: true };
      
      const importResult = excelImport.importFromExcel(result.filePaths[0]);
      logger.logInfo(`Excel import: ${importResult.imported} contacts`);
      updateTrayMenu();
      return importResult;
    } catch (error) {
      logger.logError('IMPORT_EXCEL', error.toString());
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('export-excel', async (event) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'birthday-contacts.xlsx',
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
      });
      
      if (result.canceled) return { success: false, canceled: true };
      
      const contacts = db.getAllContacts();
      const exportResult = excelImport.exportToExcel(contacts, result.filePath);
      logger.logInfo('Excel export successful');
      return exportResult;
    } catch (error) {
      logger.logError('EXPORT_EXCEL', error.toString());
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('download-template', async (event) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'birthday-template.xlsx',
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
      });
      
      if (result.canceled) return { success: false, canceled: true };
      
      return excelImport.generateTemplate(result.filePath);
    } catch (error) {
      logger.logError('DOWNLOAD_TEMPLATE', error.toString());
      return { success: false, error: error.message };
    }
  });

  // Message Templates
  ipcMain.handle('get-all-templates', async () => {
    return db.getAllTemplates();
  });

  ipcMain.handle('add-template', async (event, template) => {
    return db.addTemplate(template);
  });

  ipcMain.handle('update-template', async (event, id, template) => {
    return db.updateTemplate(id, template);
  });

  ipcMain.handle('delete-template', async (event, id) => {
    return db.deleteTemplate(id);
  });

  // Autostart
  ipcMain.handle('enable-autostart', async () => {
    return await autostart.enableAutoStart();
  });

  ipcMain.handle('disable-autostart', async () => {
    return await autostart.disableAutoStart();
  });

  ipcMain.handle('check-autostart', async () => {
    return await autostart.isAutoStartEnabled();
  });

  // Backup & Recovery
  ipcMain.handle('create-backup', async () => {
    return backup.createBackup();
  });

  ipcMain.handle('get-backup-list', async () => {
    return backup.getBackupList();
  });

  ipcMain.handle('restore-backup', async (event, backupPath) => {
    return backup.restoreBackup(backupPath);
  });

  // Logs
  ipcMain.handle('get-log-path', async () => {
    return logger.getLogFilePath();
  });

  // Import History
  ipcMain.handle('get-import-history', async () => {
    return db.getImportHistory();
  });

  // App
  ipcMain.on('minimize-to-tray', () => {
    mainWindow.hide();
  });

  ipcMain.on('show-notification', (event, title, body) => {
    new Notification({ title, body }).show();
  });
}

// App lifecycle
app.whenReady().then(() => {
  logger.initLogger();
  logger.logInfo('=== Application Starting ===');
  logger.logInfo(`Version: ${app.getVersion()}`);
  logger.logInfo(`Platform: ${process.platform}`);
  
  try {
    db.initDatabase();
    setupIPC();
    createWindow();
    scheduler.startScheduler();
    email.initializeEmailService();
    autostart.initAutoLaunch();
    backup.startAutoBackup();
    logger.cleanOldLogs();
    
    logger.logInfo('All systems initialized successfully');
  } catch (error) {
    logger.logError('STARTUP', error.toString());
    dialog.showErrorBox('Startup Error', 'Failed to initialize application. Check logs for details.');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit, just hide to tray
  }
});

app.on('before-quit', () => {
  logger.logInfo('Application shutting down');
  scheduler.stopScheduler();
  backup.stopAutoBackup();
});

// Graceful shutdown
app.on('will-quit', () => {
  logger.logInfo('=== Application Stopped ===');
});
