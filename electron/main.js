const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const db = require('./database');
const email = require('./email');
const scheduler = require('./scheduler');
const excelImport = require('./excel-import');
const autostart = require('./autostart');
const logger = require('./logger');
const backup = require('./backup');
const updater = require('./updater');
const emailQueue = require('./email-queue');
const emailTemplates = require('./email-templates');

let mainWindow;
let tray;
let isQuitting = false;

// Handle crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (logger && logger.logError) {
    logger.logError('CRASH', error.stack);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  if (logger && logger.logError) {
    logger.logError('UNHANDLED_REJECTION', `${reason}`);
  }
});

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../public/wishmailer.jpeg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    },
    show: false
  });

  // Listen for preload errors
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('Window crashed!', killed);
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.error('Window unresponsive!');
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Window shown');
    if (logger && logger.logInfo) {
      logger.logInfo('Main window shown');
    }
  });

  // Load app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
  }

  // Create system tray after window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    createTray();
  });
  
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      new Notification({
        title: 'Birthday Reminder',
        body: 'App is still running in the system tray'
      }).show();
    }
  });

  // Auto-updater
  if (process.env.NODE_ENV !== 'development' && updater) {
    updater.initAutoUpdater(mainWindow);
  }
}

function createTray() {
  try {
    // Don't create tray if it already exists
    if (tray && !tray.isDestroyed()) {
      return;
    }

    const iconPath = path.join(__dirname, '../public/wishmailer.jpeg');
    
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
    } else {
      // Try alternative paths for production
      const altIconPath = path.join(process.resourcesPath, 'public', 'wishmailer.jpeg');
      if (fs.existsSync(altIconPath)) {
        tray = new Tray(altIconPath);
      } else {
        console.log('Tray icon not found, using default');
        tray = new Tray(iconPath);
      }
    }
    
    updateTrayMenu();
    
    tray.setToolTip('Birthday Reminder');
    
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
      }
    });
    
    console.log('System tray created');
    if (logger && logger.logInfo) {
      logger.logInfo('System tray created');
    }
  } catch (error) {
    console.error('Failed to create tray:', error);
    if (logger && logger.logError) {
      logger.logError('TRAY_CREATE', error.toString());
    }
  }
}

function updateTrayMenu() {
  if (!tray || tray.isDestroyed()) {
    console.log('Tray not available for menu update');
    return;
  }

  try {
    const todaysBirthdays = db.getTodaysBirthdays();
    const upcoming = db.getUpcomingBirthdays(7);
    
    const menuItems = [
      {
        label: 'Show App',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
          }
        }
      },
      { type: 'separator' }
    ];
    
    if (todaysBirthdays && todaysBirthdays.length > 0) {
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
    
    if (upcoming && upcoming.length > 0) {
      menuItems.push({
        label: `📅 ${upcoming.length} Upcoming This Week`,
        enabled: false
      });
    }
    
    menuItems.push(
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => {
          if (updater) {
            updater.checkForUpdates();
          }
        }
      },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    );
    
    const contextMenu = Menu.buildFromTemplate(menuItems);
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error('Failed to update tray menu:', error);
    if (logger && logger.logError) {
      logger.logError('TRAY_UPDATE', error.toString());
    }
  }
}

// Update tray menu every 5 minutes
setInterval(() => {
  updateTrayMenu();
}, 5 * 60 * 1000);

// IPC Handlers
function setupIPC() {
  // Contacts
  ipcMain.handle('add-contact', async (event, contact) => {
  try {
    const result = db.addContact(contact);
    console.log('Contact added:', contact.name);
    if (logger && logger.logInfo) {
      logger.logInfo(`Contact added: ${contact.name}`);
    }
    
    // Record in analytics
    db.recordContactAdded();
    
    // Safe tray update with delay - don't let errors bubble up
    setTimeout(() => {
      try {
        if (tray && !tray.isDestroyed()) {
          updateTrayMenu();
        }
      } catch (trayError) {
        console.log('Tray update failed (non-critical):', trayError.message);
      }
    }, 500);
    
    return result;
  } catch (error) {
    console.error('Add contact error:', error);
    if (logger && logger.logError) {
      logger.logError('ADD_CONTACT', error.toString());
    }
    throw error;
  }
});


  ipcMain.handle('get-all-contacts', async () => {
    try {
      return db.getAllContacts();
    } catch (error) {
      console.error('Get contacts error:', error);
      if (logger && logger.logError) {
        logger.logError('GET_CONTACTS', error.toString());
      }
      return [];
    }
  });

ipcMain.handle('update-contact', async (event, id, contact) => {
  try {
    const result = db.updateContact(id, contact);
    console.log('Contact updated:', contact.name);
    if (logger && logger.logInfo) {
      logger.logInfo(`Contact updated: ${contact.name}`);
    }
    
    // Safe tray update - non-critical
    setTimeout(() => {
      try {
        if (tray && !tray.isDestroyed()) {
          updateTrayMenu();
        }
      } catch (trayError) {
        console.log('Tray update failed (non-critical):', trayError.message);
      }
    }, 500);
    
    return result;
  } catch (error) {
    console.error('Update contact error:', error);
    if (logger && logger.logError) {
      logger.logError('UPDATE_CONTACT', error.toString());
    }
    throw error;
  }
});

ipcMain.handle('delete-contact', async (event, id) => {
  try {
    const result = db.deleteContact(id);
    console.log('Contact deleted:', id);
    if (logger && logger.logInfo) {
      logger.logInfo(`Contact deleted: ${id}`);
    }
    
    // Safe tray update - non-critical
    setTimeout(() => {
      try {
        if (tray && !tray.isDestroyed()) {
          updateTrayMenu();
        }
      } catch (trayError) {
        console.log('Tray update failed (non-critical):', trayError.message);
      }
    }, 500);
    
    return result;
  } catch (error) {
    console.error('Delete contact error:', error);
    if (logger && logger.logError) {
      logger.logError('DELETE_CONTACT', error.toString());
    }
    throw error;
  }
});


  ipcMain.handle('get-todays-birthdays', async () => {
    try {
      return db.getTodaysBirthdays();
    } catch (error) {
      console.error('Get today error:', error);
      return [];
    }
  });

  ipcMain.handle('get-upcoming-birthdays', async (event, days) => {
    try {
      return db.getUpcomingBirthdays(days);
    } catch (error) {
      console.error('Get upcoming error:', error);
      return [];
    }
  });

  // Settings
  ipcMain.handle('get-setting', async (event, key) => {
    try {
      return db.getSetting(key);
    } catch (error) {
      console.error('Get setting error:', error);
      return null;
    }
  });

  ipcMain.handle('set-setting', async (event, key, value) => {
    try {
      const result = db.setSetting(key, value);
      console.log('Setting updated:', key);
      if (logger && logger.logInfo) {
        logger.logInfo(`Setting updated: ${key}`);
      }
      
      if (key === 'notificationTime') {
        scheduler.stopScheduler();
        scheduler.startScheduler();
      }
      
      if (key === 'emailFrom' || key === 'emailPassword') {
        email.resetEmailService();
      }
      
      return result;
    } catch (error) {
      console.error('Set setting error:', error);
      throw error;
    }
  });

  ipcMain.handle('get-all-settings', async () => {
    try {
      return db.getAllSettings();
    } catch (error) {
      console.error('Get all settings error:', error);
      return {};
    }
  });

  // Email
  ipcMain.handle('send-email', async (event, contact) => {
    try {
      const result = await email.sendBirthdayEmail(contact);
      console.log('Email sent:', contact.name, result.success);
      
      // Update last contact date if email was successful
      if (result.success && contact.id) {
        db.updateLastContactDate(contact.id);
      }
      
      if (logger && logger.logInfo) {
        logger.logInfo(`Email sent to: ${contact.name} - ${result.success ? 'Success' : 'Failed'}`);
      }
      return result;
    } catch (error) {
      console.error('Send email error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('test-email', async (event, address) => {
    try {
      const result = await email.testEmail(address);
      console.log('Test email:', result.success);
      if (logger && logger.logInfo) {
        logger.logInfo(`Test email: ${result.success ? 'Success' : 'Failed'}`);
      }
      return result;
    } catch (error) {
      console.error('Test email error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-email-log', async (event, limit) => {
    try {
      return db.getEmailLog(limit);
    } catch (error) {
      console.error('Get email log error:', error);
      return [];
    }
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
      console.log('Excel import:', importResult.imported, 'contacts');
      if (logger && logger.logInfo) {
        logger.logInfo(`Excel import: ${importResult.imported} contacts`);
      }
      
      // Safe tray update with delay
      setTimeout(() => {
        if (tray && !tray.isDestroyed()) {
          updateTrayMenu();
        }
      }, 500);
      
      return importResult;
    } catch (error) {
      console.error('Import excel error:', error);
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
      console.log('Excel export successful');
      if (logger && logger.logInfo) {
        logger.logInfo('Excel export successful');
      }
      return exportResult;
    } catch (error) {
      console.error('Export excel error:', error);
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
      console.error('Download template error:', error);
      return { success: false, error: error.message };
    }
  });

  // Message Templates
  ipcMain.handle('get-all-templates', async () => {
    try {
      const templates = db.getAllTemplates();
      // Log if any template contains image tags
      templates.forEach(t => {
        if (t.html && t.html.includes('<img')) {
          console.warn(`Template "${t.name}" contains <img> tag - needs cleanup`);
        }
        if (t.message && t.message.includes('<img')) {
          console.warn(`Template "${t.name}" message contains <img> tag - needs cleanup`);
        }
      });
      return templates;
    } catch (error) {
      console.error('Get templates error:', error);
      return [];
    }
  });

  ipcMain.handle('add-template', async (event, template) => {
    try {
      console.log('IPC: add-template called with:', {
        name: template?.name,
        subject: template?.subject,
        messageLength: template?.message?.length
      });
      const result = db.addTemplate(template);
      console.log('IPC: add-template result:', result);
      return result;
    } catch (error) {
      console.error('Add template error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-template', async (event, id, template) => {
    try {
      console.log('IPC: update-template called with id:', id, {
        name: template?.name,
        subject: template?.subject,
        messageLength: template?.message?.length
      });
      const result = db.updateTemplate(id, template);
      console.log('IPC: update-template result:', result);
      return result;
    } catch (error) {
      console.error('Update template error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-template', async (event, id) => {
    try {
      return db.deleteTemplate(id);
    } catch (error) {
      console.error('Delete template error:', error);
      throw error;
    }
  });

  // Duplicate Detection
  ipcMain.handle('check-duplicate-contact', async (event, name, email, excludeId = null) => {
    try {
      return db.checkDuplicateContact(name, email, excludeId);
    } catch (error) {
      console.error('Check duplicate error:', error);
      return [];
    }
  });

  // Category Management
  ipcMain.handle('get-all-categories', async () => {
    try {
      return db.getAllCategories();
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  });

  ipcMain.handle('bulk-update-category', async (event, contactIds, category) => {
    try {
      return db.bulkUpdateCategory(contactIds, category);
    } catch (error) {
      console.error('Bulk update category error:', error);
      return { success: false, error: error.message };
    }
  });

  // Excel Export
  ipcMain.handle('export-contacts-excel', async (event, contacts) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Contacts to Excel',
        defaultPath: path.join(app.getPath('downloads'), `contacts-${new Date().toISOString().split('T')[0]}.xlsx`),
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      // Prepare data for Excel
      const excelData = contacts.map(contact => ({
        'Name': contact.name,
        'Birthday': contact.birthday,
        'Email': contact.email || '',
        'Phone': contact.phone || '',
        'Category': contact.category || 'Uncategorized',
        'Last Contact': contact.last_contact_date || 'Never',
        'Notes': contact.notes || '',
        'Template ID': contact.template_id || 'Default'
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Name
        { wch: 12 }, // Birthday
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 15 }, // Category
        { wch: 20 }, // Last Contact
        { wch: 30 }, // Notes
        { wch: 12 }  // Template ID
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
      XLSX.writeFile(wb, result.filePath);

      if (logger && logger.logInfo) {
        logger.logInfo(`Exported ${contacts.length} contacts to ${result.filePath}`);
      }

      return { success: true, path: result.filePath, count: contacts.length };
    } catch (error) {
      console.error('Export contacts error:', error);
      if (logger && logger.logError) {
        logger.logError('EXPORT_ERROR', error.stack);
      }
      return { success: false, error: error.message };
    }
  });

  // Autostart
  ipcMain.handle('enable-autostart', async () => {
    try {
      return await autostart.enableAutoStart();
    } catch (error) {
      console.error('Enable autostart error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('disable-autostart', async () => {
    try {
      return await autostart.disableAutoStart();
    } catch (error) {
      console.error('Disable autostart error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('check-autostart', async () => {
    try {
      return await autostart.isAutoStartEnabled();
    } catch (error) {
      console.error('Check autostart error:', error);
      return false;
    }
  });

  // Backup & Recovery
  ipcMain.handle('create-backup', async () => {
    try {
      return backup.createBackup();
    } catch (error) {
      console.error('Create backup error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-backup-list', async () => {
    try {
      return backup.getBackupList();
    } catch (error) {
      console.error('Get backup list error:', error);
      return [];
    }
  });

  ipcMain.handle('restore-backup', async (event, backupPath) => {
    try {
      return backup.restoreBackup(backupPath);
    } catch (error) {
      console.error('Restore backup error:', error);
      return { success: false, error: error.message };
    }
  });

  // Logs
  ipcMain.handle('get-log-path', async () => {
    try {
      return logger.getLogFilePath();
    } catch (error) {
      return '';
    }
  });

  // Import History
  ipcMain.handle('get-import-history', async () => {
    try {
      return db.getImportHistory();
    } catch (error) {
      console.error('Get import history error:', error);
      return [];
    }
  });

  // App
  ipcMain.on('minimize-to-tray', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.on('show-notification', (event, title, body) => {
    new Notification({ title, body }).show();
  });

  // Analytics
  ipcMain.handle('get-analytics-summary', async () => {
    try {
      return db.getAnalyticsSummary();
    } catch (error) {
      console.error('Get analytics summary error:', error);
      return null;
    }
  });

  ipcMain.handle('get-daily-analytics', async (event, days = 30) => {
    try {
      return db.getDailyAnalytics(days);
    } catch (error) {
      console.error('Get daily analytics error:', error);
      return [];
    }
  });

  ipcMain.handle('get-monthly-analytics', async (event, months = 12) => {
    try {
      return db.getMonthlyAnalytics(months);
    } catch (error) {
      console.error('Get monthly analytics error:', error);
      return [];
    }
  });

  ipcMain.handle('get-current-month-stats', async () => {
    try {
      return db.getCurrentMonthStats();
    } catch (error) {
      console.error('Get current month stats error:', error);
      return null;
    }
  });

  // Email Queue
  ipcMain.handle('get-queue-stats', async () => {
    try {
      return emailQueue.getStats();
    } catch (error) {
      console.error('Get queue stats error:', error);
      return null;
    }
  });

  ipcMain.handle('get-queue-status', async () => {
    try {
      return emailQueue.getStatus();
    } catch (error) {
      console.error('Get queue status error:', error);
      return null;
    }
  });

  ipcMain.handle('process-queue-now', async () => {
    try {
      await emailQueue.processNow();
      return { success: true };
    } catch (error) {
      console.error('Process queue error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('clear-old-queue-items', async (event, daysOld = 30) => {
    try {
      return emailQueue.cleanupOldItems(daysOld);
    } catch (error) {
      console.error('Clear queue error:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('IPC handlers registered');
}

// App lifecycle
app.whenReady().then(() => {
  try {
    console.log('=== Application Starting ===');
    console.log('Version:', app.getVersion());
    console.log('Platform:', process.platform);
    
    logger.initLogger();
    if (logger && logger.logInfo) {
      logger.logInfo('=== Application Starting ===');
      logger.logInfo(`Version: ${app.getVersion()}`);
      logger.logInfo(`Platform: ${process.platform}`);
    }
    
    db.initDatabase();
    console.log('Database initialized');
    
    setupIPC();
    console.log('IPC setup complete');
    
    createWindow();
    console.log('Window created');
    
    scheduler.startScheduler();
    console.log('Scheduler started');
    
    email.initializeEmailService();
    console.log('Email service initialized');
    
    autostart.initAutoLaunch();
    console.log('Autostart initialized');
    
    backup.startAutoBackup();
    console.log('Backup service started');
    
    logger.cleanOldLogs();
    
    if (logger && logger.logInfo) {
      logger.logInfo('All systems initialized successfully');
    }
    console.log('=== Application Started Successfully ===');
  } catch (error) {
    console.error('Startup error:', error);
    dialog.showErrorBox('Startup Error', 'Failed to initialize application: ' + error.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close - stay in tray
  if (process.platform !== 'darwin') {
    // App continues running
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  console.log('Application shutting down');
  if (logger && logger.logInfo) {
    logger.logInfo('Application shutting down');
  }
  scheduler.stopScheduler();
  backup.stopAutoBackup();
});

app.on('will-quit', () => {
  console.log('=== Application Stopped ===');
  if (logger && logger.logInfo) {
    logger.logInfo('=== Application Stopped ===');
  }
});
