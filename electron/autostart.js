const AutoLaunch = require('auto-launch');
const { app } = require('electron');
const path = require('path');

let autoLauncher;

function initAutoLaunch() {
  autoLauncher = new AutoLaunch({
    name: 'Birthday Reminder',
    path: app.getPath('exe'),
    isHidden: false // Set to true to start minimized
  });
}

async function enableAutoStart() {
  try {
    if (!autoLauncher) initAutoLaunch();
    await autoLauncher.enable();
    return { success: true, message: 'Autostart enabled' };
  } catch (error) {
    console.error('Enable autostart error:', error);
    return { success: false, error: error.message };
  }
}

async function disableAutoStart() {
  try {
    if (!autoLauncher) initAutoLaunch();
    await autoLauncher.disable();
    return { success: true, message: 'Autostart disabled' };
  } catch (error) {
    console.error('Disable autostart error:', error);
    return { success: false, error: error.message };
  }
}

async function isAutoStartEnabled() {
  try {
    if (!autoLauncher) initAutoLaunch();
    const isEnabled = await autoLauncher.isEnabled();
    return isEnabled;
  } catch (error) {
    console.error('Check autostart error:', error);
    return false;
  }
}

module.exports = {
  initAutoLaunch,
  enableAutoStart,
  disableAutoStart,
  isAutoStartEnabled
};
