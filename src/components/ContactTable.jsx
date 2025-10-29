import React, { useState } from 'react';
import { Edit, Trash2, Mail, Search } from 'lucide-react';
import AddContact from './AddContact';

function ContactTable({ contacts, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContact, setEditingContact] = useState(null);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete ${name}?`)) {
      await window.electronAPI.deleteContact(id);
      onRefresh();
    }
  };

  const handleSendEmail = async (contact) => {
    if (!contact.email) {
      alert('No email address for this contact');
      return;
    }
    
    const result = await window.electronAPI.sendEmail(contact);
    if (result.success) {
      alert(`Birthday email sent to ${contact.name}!`);
    } else {
      alert(`Failed to send email: ${result.error}`);
    }
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          All Contacts ({filteredContacts.length})
        </h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Birthday
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredContacts.map(contact => (
              <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {contact.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(contact.birthday)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {contact.email || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {contact.phone || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right space-x-2">
                  {contact.email && (
                    <button
                      onClick={() => handleSendEmail(contact)}
                      className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                      title="Send email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingContact(contact)}
                    className="inline-flex items-center p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id, contact.name)}
                    className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContacts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No contacts found
          </div>
        )}
      </div>

      {editingContact && (
        <AddContact
          editContact={editingContact}
          onClose={() => setEditingContact(null)}
          onSuccess={() => {
            setEditingContact(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

export default ContactTable;
