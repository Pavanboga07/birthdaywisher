const { autoUpdater } = require('electron-updater');
const { dialog, Notification } = require('electron');
const logger = require('./logger');

function initAutoUpdater(mainWindow) {
  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Check for updates on startup
  setTimeout(() => {
    checkForUpdates();
  }, 10000); // 10 seconds after startup
  
  // Check for updates every 6 hours
  setInterval(() => {
    checkForUpdates();
  }, 6 * 60 * 60 * 1000);
  
  autoUpdater.on('update-available', (info) => {
    logger.logInfo(`Update available: ${info.version}`);
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      buttons: ['Download Now', 'Later'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        
        new Notification({
          title: 'Downloading Update',
          body: 'Birthday Reminder is downloading the latest version...'
        }).show();
      }
    });
  });
  
  autoUpdater.on('update-not-available', () => {
    logger.logInfo('No updates available');
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    logger.logInfo(`Download progress: ${percent}%`);
  });
  
  autoUpdater.on('update-downloaded', () => {
    logger.logInfo('Update downloaded');
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update has been downloaded. The app will restart to install the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
  
  autoUpdater.on('error', (error) => {
    logger.logError('AUTO_UPDATE', error.toString());
  });
}

function checkForUpdates() {
  try {
    autoUpdater.checkForUpdates();
  } catch (error) {
    logger.logError('UPDATE_CHECK', error.toString());
  }
}

module.exports = {
  initAutoUpdater,
  checkForUpdates
};
