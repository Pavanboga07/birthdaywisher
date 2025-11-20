import React, { useState, useEffect } from 'react';
import { Save, TestTube, Eye, EyeOff, ExternalLink, Upload, Download, FileSpreadsheet } from 'lucide-react';

function Settings() {
  const [settings, setSettings] = useState({
    emailFrom: '',
    emailPassword: '',
    notificationTime: '09:00',
    emailEnabled: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [autostart, setAutostart] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadSettings();
    checkAutostart();
  }, []);

  const loadSettings = async () => {
    const allSettings = await window.electronAPI.getAllSettings();
    setSettings({
      emailFrom: allSettings.emailFrom || '',
      emailPassword: allSettings.emailPassword || '',
      notificationTime: allSettings.notificationTime || '09:00',
      emailEnabled: allSettings.emailEnabled === 'true'
    });
  };

  const checkAutostart = async () => {
    const enabled = await window.electronAPI.checkAutostart();
    setAutostart(enabled);
  };

  const handleSave = async () => {
    await window.electronAPI.setSetting('emailFrom', settings.emailFrom);
    await window.electronAPI.setSetting('emailPassword', settings.emailPassword);
    await window.electronAPI.setSetting('notificationTime', settings.notificationTime);
    await window.electronAPI.setSetting('emailEnabled', String(settings.emailEnabled));
    
    alert('Settings saved successfully!');
  };

  const handleTestEmail = async () => {
    if (!settings.emailFrom) {
      alert('Please enter your email address first');
      return;
    }
    
    setTesting(true);
    const result = await window.electronAPI.testEmail(settings.emailFrom);
    setTesting(false);
    
    if (result.success) {
      alert('✅ Test email sent successfully! Check your inbox.');
    } else {
      alert(`❌ Failed to send test email: ${result.error}`);
    }
  };

  const toggleAutostart = async () => {
    if (autostart) {
      const result = await window.electronAPI.disableAutostart();
      if (result.success) {
        setAutostart(false);
        alert('✅ Autostart disabled');
      }
    } else {
      const result = await window.electronAPI.enableAutostart();
      if (result.success) {
        setAutostart(true);
        alert('✅ Autostart enabled - App will launch at Windows startup');
      }
    }
  };

  const handleImportExcel = async () => {
    setImporting(true);
    const result = await window.electronAPI.importExcel();
    setImporting(false);
    
    if (result.success) {
      alert(`✅ ${result.message}\n\nImported: ${result.imported}\nTotal rows: ${result.total}`);
      // Trigger refresh of dashboard if needed
      window.location.reload();
    } else if (!result.canceled) {
      alert(`❌ Import failed: ${result.error}`);
    }
  };

  const handleExportExcel = async () => {
    const result = await window.electronAPI.exportExcel();
    if (result.success) {
      alert('✅ Contacts exported successfully!');
    } else if (!result.canceled) {
      alert(`❌ Export failed: ${result.error}`);
    }
  };

  const handleDownloadTemplate = async () => {
    const result = await window.electronAPI.downloadTemplate();
    if (result.success) {
      alert('✅ Template downloaded successfully!\n\nOpen the file and add your contacts:\n- Name (required)\n- Birthday (YYYY-MM-DD format)\n- Email\n- Phone\n- Notes');
    } else if (!result.canceled) {
      alert(`❌ Download failed: ${result.error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Import/Export Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          Import / Export Contacts
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleImportExcel}
            disabled={importing}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>{importing ? 'Importing...' : 'Import Excel'}</span>
          </button>
          
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Download Template</span>
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Excel Format:</strong> Name, Birthday (YYYY-MM-DD), Email, Phone, Notes
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Download the template first to see the correct format
          </p>
        </div>
      </div>

      {/* Autostart Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          🚀 Startup Settings
        </h3>
        
        <label className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Launch at Windows startup
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              App will start automatically when you log in to Windows
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={autostart}
              onChange={toggleAutostart}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </div>
        </label>
      </div>

      {/* Email Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          ⚙️ Email Settings
        </h2>

        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            📧 Gmail Configuration
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gmail Address
            </label>
            <input
              type="email"
              value={settings.emailFrom}
              onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="your-email@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gmail App Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={settings.emailPassword}
                onChange={(e) => setSettings({ ...settings, emailPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="xxxx xxxx xxxx xxxx"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              How to get Gmail App Password?
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Daily Email Time
              </label>
              <input
                type="time"
                value={settings.notificationTime}
                onChange={(e) => setSettings({ ...settings, notificationTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Birthday emails will be sent at this time every day
              </p>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-700 rounded-lg w-full">
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable automatic emails
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Send birthday wishes automatically
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleTestEmail}
            disabled={testing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <TestTube className="w-5 h-5" />
            <span>{testing ? 'Sending...' : 'Send Test Email'}</span>
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>Save All Settings</span>
        </button>
      </div>

      {/* Instructions Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          📝 Quick Setup Guide
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>Enable 2-Step Verification in your Google Account</li>
          <li>Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google App Passwords</a></li>
          <li>Generate a new app password for "Mail"</li>
          <li>Copy the 16-character password and paste above</li>
          <li>Set your preferred daily email time</li>
          <li>Enable automatic emails</li>
          <li>Click "Send Test Email" to verify</li>
          <li>Import contacts from Excel or add manually</li>
        </ol>
      </div>
    </div>
  );
}

export default Settings;
