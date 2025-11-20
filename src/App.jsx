import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Templates from './components/Templates';
import { Moon, Sun, Settings as SettingsIcon, Home, FileText } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load dark mode preference
    window.electronAPI.getSetting('darkMode').then(value => {
      setDarkMode(value === 'true');
    });
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    window.electronAPI.setSetting('darkMode', String(newMode));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                <img 
                  src="/wishmailer.jpeg" 
                  alt="WishMailer Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  WishMailer
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Never forget a birthday again
                </p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="hidden md:inline font-medium">Dashboard</span>
              </button>
              
              <button
                onClick={() => setCurrentView('templates')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === 'templates'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="hidden md:inline font-medium">Templates</span>
              </button>
              
              <button
                onClick={() => setCurrentView('settings')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === 'settings'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="hidden md:inline font-medium">Settings</span>
              </button>
            </nav>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <Sun className="w-6 h-6 text-yellow-500" />
              ) : (
                <Moon className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'templates' && <Templates />}
          {currentView === 'settings' && <Settings />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <p>© 2025 WishMailer. Made with ❤️</p>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>App Running</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
