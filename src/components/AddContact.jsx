import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, Mail, Plus, Trash2, FileText, Tag, AlertTriangle } from 'lucide-react';

function AddContact({ onClose, onSuccess, editContact = null }) {
  const [formData, setFormData] = useState({
    name: editContact?.name || '',
    birthday: editContact?.birthday || '',
    email: editContact?.email || '',
    template_id: editContact?.template_id || null,
    category: editContact?.category || 'Uncategorized'
  });

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

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
    // Add default categories
    const defaultCategories = ['Uncategorized', '1st Year Students', '2nd Year Students', '3rd Year Students', '4th Year Students', 'Teachers', 'Family', 'Friends', 'Colleagues'];
    const allCategories = [...new Set([...defaultCategories, ...data])];
    setCategories(allCategories);
  };

  const checkForDuplicates = async (name, email) => {
    if (!name || !email) return;
    
    const duplicates = await window.electronAPI.checkDuplicateContact(
      name, 
      email, 
      editContact?.id
    );
    
    if (duplicates.length > 0) {
      setDuplicateWarning(duplicates[0]);
    } else {
      setDuplicateWarning(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkForDuplicates(formData.name, formData.email);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData.name, formData.email]);

  // Parse custom fields from notes/phone if editing
  const [customFields, setCustomFields] = useState(() => {
    if (editContact) {
      const fields = [];
      if (editContact.phone) {
        fields.push({ label: 'Phone', value: editContact.phone });
      }
      if (editContact.notes) {
        fields.push({ label: 'Notes', value: editContact.notes });
      }
      return fields;
    }
    return [];
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.birthday) {
      newErrors.birthday = 'Birthday is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { label: '', value: '' }]);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Check if user wants to proceed with duplicate
    if (duplicateWarning && !editContact) {
      const proceed = window.confirm(
        `A contact with similar name or email already exists:\n\n` +
        `Name: ${duplicateWarning.name}\n` +
        `Email: ${duplicateWarning.email}\n\n` +
        `Do you still want to add this contact?`
      );
      if (!proceed) return;
    }

    try {
      // Build contact object with custom fields stored in phone/notes
      const contact = {
        name: formData.name.trim(),
        birthday: formData.birthday,
        email: formData.email.trim(),
        phone: '',
        notes: '',
        template_id: formData.template_id,
        category: formData.category
      };

      // Store custom fields
      customFields.forEach((field, index) => {
        if (field.label && field.value) {
          if (index === 0 && field.label.toLowerCase().includes('phone')) {
            contact.phone = field.value;
          } else if (field.label && field.value) {
            if (contact.notes) contact.notes += '\n';
            contact.notes += `${field.label}: ${field.value}`;
          }
        }
      });

      if (editContact) {
        await window.electronAPI.updateContact(editContact.id, contact);
        alert('✅ Contact updated successfully!');
      } else {
        await window.electronAPI.addContact(contact);
        alert('✅ Contact added successfully!');
      }
      onSuccess();
    } catch (error) {
      alert('❌ Error saving contact: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {editContact ? '✏️ Edit Contact' : '➕ Add New Contact'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-0">
          {/* Name Field - Required */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4 mr-2" />
              Full Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              placeholder="John Doe"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Birthday Field - Required */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              Birthday *
            </label>
            <input
              type="date"
              required
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className={`w-full px-4 py-3 border ${errors.birthday ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
            />
            {errors.birthday && <p className="text-red-500 text-xs mt-1">{errors.birthday}</p>}
          </div>

          {/* Email Field - Required */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 mr-2" />
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              placeholder="john@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📧 Required for automatic birthday emails
            </p>
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning && !editContact && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    ⚠️ Possible Duplicate Contact
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    Similar contact exists: <strong>{duplicateWarning.name}</strong> ({duplicateWarning.email})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="w-4 h-4 mr-2" />
              Category
            </label>
            <div className="flex space-x-2">
              <select
                value={showNewCategory ? '__new__' : formData.category}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setShowNewCategory(true);
                  } else {
                    setFormData({ ...formData, category: e.target.value });
                    setShowNewCategory(false);
                  }
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__new__">+ Add New Category</option>
              </select>
            </div>
            
            {showNewCategory && (
              <div className="flex space-x-2 mt-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter new category name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategory.trim()) {
                      setCategories([...categories, newCategory.trim()]);
                      setFormData({ ...formData, category: newCategory.trim() });
                      setNewCategory('');
                      setShowNewCategory(false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategory('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              🏷️ Organize contacts by year of study, role, or custom categories
            </p>
          </div>

          {/* Email Template Selector */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 mr-2" />
              Email Template (Optional)
            </label>
            <select
              value={formData.template_id || ''}
              onChange={(e) => setFormData({ ...formData, template_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Use Default Template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.is_default === 1 ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ✉️ Choose a specific template for this contact or leave blank to use default
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Additional Fields (Optional)
              </h3>
              <button
                type="button"
                onClick={addCustomField}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800"
              >
                <Plus className="w-4 h-4" />
                <span>Add Field</span>
              </button>
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      placeholder="Field name"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {customFields.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No additional fields. Click "Add Field" to add custom information.
              </p>
            )}

            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 <strong>Examples:</strong> Phone Number, Address, Company, Relationship, Gift Ideas, etc.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{editContact ? 'Update' : 'Add'} Contact</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddContact;
