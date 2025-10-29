import React, { useState, useEffect } from 'react';
import { Plus, Mail, Calendar, Users, Send, RefreshCw } from 'lucide-react';
import AddContact from './AddContact';
import ContactTable from './ContactTable';

function Dashboard() {
  const [todaysBirthdays, setTodaysBirthdays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const today = await window.electronAPI.getTodaysBirthdays();
    const upcoming = await window.electronAPI.getUpcomingBirthdays(7);
    const all = await window.electronAPI.getAllContacts();
    
    setTodaysBirthdays(today);
    setUpcomingBirthdays(upcoming);
    setAllContacts(all);
  };

  const sendAllTodayEmails = async () => {
    setSending(true);
    let sent = 0;
    let failed = 0;

    for (const contact of todaysBirthdays) {
      if (contact.email) {
        const result = await window.electronAPI.sendEmail(contact);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }
    
    setSending(false);
    alert(`✅ Emails sent: ${sent}\n❌ Failed: ${failed}`);
  };

  const sendSingleEmail = async (contact) => {
    if (!contact.email) {
      alert('❌ No email address for this contact');
      return;
    }

    const result = await window.electronAPI.sendEmail(contact);
    if (result.success) {
      alert(`✅ Birthday email sent to ${contact.name}!`);
    } else {
      alert(`❌ Failed to send email: ${result.error}`);
    }
  };

  const sendMissedEmails = async () => {
    const confirmed = window.confirm(
      'This will send birthday emails to all contacts whose birthdays were in the past 7 days.\n\nContinue?'
    );
    
    if (!confirmed) return;

    setSending(true);
    let sent = 0;
    const today = new Date();
    
    for (const contact of allContacts) {
      if (!contact.email) continue;
      
      const [year, month, day] = contact.birthday.split('-');
      const birthdayThisYear = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
      const daysSince = Math.floor((today - birthdayThisYear) / (1000 * 60 * 60 * 24));
      
      // If birthday was 1-7 days ago
      if (daysSince > 0 && daysSince <= 7) {
        const result = await window.electronAPI.sendEmail(contact);
        if (result.success) sent++;
      }
    }
    
    setSending(false);
    alert(`✅ Sent ${sent} missed birthday emails!`);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={sendMissedEmails}
            disabled={sending}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Send Missed Emails</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Birthdays */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              🎉 Today's Birthdays
            </h3>
            <span className="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-3 py-1 rounded-full text-sm font-bold">
              {todaysBirthdays.length}
            </span>
          </div>
          
          {todaysBirthdays.length > 0 ? (
            <div className="space-y-2">
              {todaysBirthdays.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-pink-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-white">{contact.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email || 'No email'}</p>
                  </div>
                  {contact.email && (
                    <button
                      onClick={() => sendSingleEmail(contact)}
                      className="ml-2 p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                      title="Send birthday email"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {todaysBirthdays.some(c => c.email) && (
                <button
                  onClick={sendAllTodayEmails}
                  disabled={sending}
                  className="w-full mt-3 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
                >
                  <Mail className="w-5 h-5" />
                  <span>{sending ? 'Sending...' : 'Send All Emails'}</span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No birthdays today</p>
          )}
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              📅 This Week
            </h3>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-bold">
              {upcomingBirthdays.length}
            </span>
          </div>
          
          {upcomingBirthdays.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {upcomingBirthdays.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-white">{contact.name}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {contact.daysUntil === 0 ? 'Today' : `in ${contact.daysUntil} day${contact.daysUntil > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {contact.email && (
                    <button
                      onClick={() => sendSingleEmail(contact)}
                      className="ml-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      title="Send birthday email"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No upcoming birthdays</p>
          )}
        </div>

        {/* Total Contacts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              👥 Total Contacts
            </h3>
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-bold">
              {allContacts.length}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">With Email</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {allContacts.filter(c => c.email).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">With Phone</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {allContacts.filter(c => c.phone).length}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Contact</span>
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <ContactTable contacts={allContacts} onRefresh={loadData} />

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContact
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
