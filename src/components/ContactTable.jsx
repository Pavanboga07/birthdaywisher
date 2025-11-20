import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Mail, Search, CheckSquare, Square, FileText, Download, Tag, Filter } from 'lucide-react';
import AddContact from './AddContact';

function ContactTable({ contacts, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showTemplateAssign, setShowTemplateAssign] = useState(false);
  const [showCategoryEdit, setShowCategoryEdit] = useState(false);
  const [showCategoryTemplateAssign, setShowCategoryTemplateAssign] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    const data = await window.electronAPI.getAllTemplates();
    setTemplates(data);
  };

  const loadCategories = async () => {
    const data = await window.electronAPI.getAllCategories();
    setCategories(['All', ...data]);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || contact.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Multi-select functions
  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const toggleSelectContact = (id) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
  };

  const handleBulkDelete = async () => {
    console.log('Delete button clicked. Selected contacts:', selectedContacts.size);
    
    if (selectedContacts.size === 0) {
      alert('Please select contacts to delete first!');
      return;
    }
    
    const count = selectedContacts.size;
    if (window.confirm(`Delete ${count} selected contact${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      let deleted = 0;
      let failed = 0;
      
      for (const id of selectedContacts) {
        try {
          console.log('Deleting contact:', id);
          await window.electronAPI.deleteContact(id);
          deleted++;
        } catch (error) {
          console.error('Failed to delete contact:', id, error);
          failed++;
        }
      }
      
      setSelectedContacts(new Set());
      onRefresh();
      
      if (failed > 0) {
        alert(`Deleted ${deleted} contact(s). ${failed} failed.`);
      } else {
        alert(`Successfully deleted ${deleted} contact(s)!`);
      }
    }
  };

  const handleBulkTemplateAssign = async (templateId) => {
    if (selectedContacts.size === 0) return;
    
    let updated = 0;
    let failed = 0;
    
    for (const contactId of selectedContacts) {
      try {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          await window.electronAPI.updateContact(contactId, {
            ...contact,
            template_id: templateId
          });
          updated++;
        }
      } catch (error) {
        console.error('Failed to assign template to contact:', contactId, error);
        failed++;
      }
    }
    
    setSelectedContacts(new Set());
    setShowTemplateAssign(false);
    onRefresh();
    
    if (failed > 0) {
      alert(`Assigned template to ${updated} contact(s). ${failed} failed.`);
    } else {
      alert(`Successfully assigned template to ${updated} contact(s)!`);
    }
  };

  const handleCategoryTemplateAssign = async (templateId) => {
    console.log('Category template assign called. Category:', selectedCategory, 'Template:', templateId);
    
    if (selectedCategory === 'All') {
      alert('Please select a specific category first.');
      return;
    }

    const contactsInCategory = contacts.filter(c => c.category === selectedCategory);
    console.log('Contacts in category:', contactsInCategory.length);
    
    if (contactsInCategory.length === 0) {
      alert('No contacts in this category.');
      return;
    }

    if (!window.confirm(`Assign this template to all ${contactsInCategory.length} contacts in "${selectedCategory}"?`)) {
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const contact of contactsInCategory) {
      try {
        console.log('Assigning template to:', contact.name);
        await window.electronAPI.updateContact(contact.id, {
          ...contact,
          template_id: templateId
        });
        updated++;
      } catch (error) {
        console.error('Failed to assign template to contact:', contact.id, error);
        failed++;
      }
    }

    setShowCategoryTemplateAssign(false);
    onRefresh();
    
    if (failed > 0) {
      alert(`Assigned template to ${updated} contact(s). ${failed} failed.`);
    } else {
      alert(`✅ Successfully assigned template to ${updated} contacts in "${selectedCategory}"!`);
    }
  };

  const handleBulkCategoryEdit = async (newCategory) => {
    if (selectedContacts.size === 0) return;
    
    try {
      const contactIds = Array.from(selectedContacts);
      await window.electronAPI.bulkUpdateCategory(contactIds, newCategory);
      
      setSelectedContacts(new Set());
      setShowCategoryEdit(false);
      onRefresh();
      loadCategories();
      
      alert(`✅ Successfully updated category for ${contactIds.length} contact(s)!`);
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('❌ Failed to update category: ' + error.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      const contactsToExport = selectedContacts.size > 0 
        ? contacts.filter(c => selectedContacts.has(c.id))
        : filteredContacts;

      if (contactsToExport.length === 0) {
        alert('No contacts to export!');
        return;
      }

      const result = await window.electronAPI.exportContactsExcel(contactsToExport);
      
      if (result.canceled) {
        return;
      }

      if (result.success) {
        alert(`✅ Successfully exported ${result.count} contact(s) to Excel!\n\nSaved to: ${result.path}`);
      } else {
        alert('❌ Failed to export: ' + result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Export failed: ' + error.message);
    }
  };

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
      onRefresh(); // Refresh to update last contact date
    } else {
      alert(`Failed to send email: ${result.error}`);
    }
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
  };

  const formatLastContact = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header with Filters and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            All Contacts ({filteredContacts.length})
          </h2>
          
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setShowCategoryTemplateAssign(true)}
                className="p-1.5 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30 rounded-lg"
                title="Assign Template to Category"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export {selectedContacts.size > 0 ? `(${selectedContacts.size})` : 'All'}</span>
          </button>
        </div>
        
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

      {/* Bulk Actions Bar */}
      {selectedContacts.size > 0 && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
              {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCategoryEdit(true)}
                className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Tag className="w-4 h-4" />
                <span>Change Category</span>
              </button>
              <button
                onClick={() => setShowTemplateAssign(true)}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                <span>Assign Template</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setSelectedContacts(new Set())}
                className="px-3 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 text-sm font-medium"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={toggleSelectAll}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                  title={selectedContacts.size === filteredContacts.length ? "Deselect all" : "Select all"}
                >
                  {selectedContacts.size === filteredContacts.length && filteredContacts.length > 0 ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
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
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Last Contact
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredContacts.map(contact => (
              <tr 
                key={contact.id} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedContacts.has(contact.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSelectContact(contact.id)}
                    className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                  >
                    {selectedContacts.has(contact.id) ? (
                      <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {contact.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(contact.birthday)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {contact.email || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {contact.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className={contact.last_contact_date ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
                    {formatLastContact(contact.last_contact_date)}
                  </span>
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

      {/* Bulk Template Assignment Modal */}
      {showTemplateAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Assign Template
              </h3>
              <button 
                onClick={() => setShowTemplateAssign(false)} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Assign a template to {selectedContacts.size} selected contact{selectedContacts.size > 1 ? 's' : ''}
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleBulkTemplateAssign(template.id)}
                  className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900 hover:border-purple-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {template.subject}
                      </p>
                    </div>
                    {template.is_default === 1 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTemplateAssign(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Template Assignment Modal */}
      {showCategoryTemplateAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Assign Template to Category
              </h3>
              <button 
                onClick={() => setShowCategoryTemplateAssign(false)} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Assign a template to all contacts in category <strong>"{selectedCategory}"</strong>
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleCategoryTemplateAssign(template.id)}
                  className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900 hover:border-purple-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {template.subject}
                      </p>
                    </div>
                    {template.is_default === 1 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCategoryTemplateAssign(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Category Edit Modal */}
      {showCategoryEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Change Category
              </h3>
              <button 
                onClick={() => setShowCategoryEdit(false)} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Change category for {selectedContacts.size} selected contact{selectedContacts.size > 1 ? 's' : ''}
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
              {categories.filter(c => c !== 'All').map(category => (
                <button
                  key={category}
                  onClick={() => handleBulkCategoryEdit(category)}
                  className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900 hover:border-indigo-500 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-gray-800 dark:text-white">
                      {category}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCategoryEdit(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactTable;
