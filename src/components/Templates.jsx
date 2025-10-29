import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    isDefault: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await window.electronAPI.getAllTemplates();
    setTemplates(data);
  };

  const handleSave = async () => {
    if (editing) {
      await window.electronAPI.updateTemplate(editing.id, formData);
    } else {
      await window.electronAPI.addTemplate(formData);
    }
    setShowAdd(false);
    setEditing(null);
    setFormData({ name: '', subject: '', message: '', isDefault: false });
    loadTemplates();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this template?')) {
      await window.electronAPI.deleteTemplate(id);
      loadTemplates();
    }
  };

  const handleEdit = (template) => {
    setEditing(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      message: template.message,
      isDefault: template.is_default === 1
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Message Templates
        </h2>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditing(null);
            setFormData({ name: '', subject: '', message: '', isDefault: false });
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          <span>New Template</span>
        </button>
      </div>

      {/* Template List */}
      <div className="grid gap-4">
        {templates.map(template => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {template.name}
                  </h3>
                  {template.is_default === 1 && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Subject: {template.subject}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {template.message}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                >
                  <Edit className="w-5 h-5" />
                </button>
                {template.is_default !== 1 && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {editing ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Birthday Formal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Happy Birthday {name}!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message (use {'{name}'} as placeholder)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="5"
                  placeholder="Dear {name}, wishing you a wonderful birthday..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Preview: {formData.message.replace('{name}', 'John Doe')}
                </p>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Set as default template
                </span>
              </label>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Templates;
