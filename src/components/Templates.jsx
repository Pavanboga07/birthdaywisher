import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, Code, RefreshCw, Palette, Type, Mail, Star } from 'lucide-react';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    isDefault: false
  });

  // Default visual template state
  const getDefaultVisualTemplate = () => ({
    // Colors
    primaryColor: '#4A5FE8',
    secondaryColor: '#7B68EE',
    backgroundColor: '#f8f9ff',
    textColor: '#2c3e50',
    
    // Typography
    headingFont: 'Poppins',
    bodyFont: 'Open Sans',
    headingSize: '38px',
    bodySize: '17px',
    
    // Content
    greeting: 'Happy Birthday',
    mainMessage: 'Turning {age_text} is a milestone worth celebrating.',
    secondMessage: 'Wishing you a day filled with fulfillment, good health, and meaningful connections.',
    thirdMessage: 'May this year open new doors of opportunity, growth, and lasting happiness.',
    quote: '"Every year is a new chapter. May yours be written with success, gratitude, and joy."',
    footerMessage: 'Warm wishes on your special day — may the coming year bring out your best yet.',
    
    // Design options
    showAge: true,
    showQuote: true,
    showActionCards: true,
    cardEmoji1: '✨',
    cardEmoji2: '💼',
    cardEmoji3: '🌟',
    cardText1: 'CELEBRATE\nPROGRESS',
    cardText2: 'EMBRACE\nGROWTH',
    cardText3: 'KEEP\nINSPIRING',
    
    // Layout
    borderRadius: '16px',
    cardPadding: '50px'
  });

  // Visual Editor State
  const [visualTemplate, setVisualTemplate] = useState(getDefaultVisualTemplate());
  const [editingVisualTemplate, setEditingVisualTemplate] = useState(null);

  const [previewName, setPreviewName] = useState('John Doe');
  const [previewAge, setPreviewAge] = useState('30');

  // Template Presets
  const templatePresets = [
    {
      name: 'Elegant Professional',
      preview: '🎨 Royal Blue & Violet',
      config: getDefaultVisualTemplate()
    },
    {
      name: 'Warm & Friendly',
      preview: '🌸 Coral & Peach',
      config: {
        ...getDefaultVisualTemplate(),
        primaryColor: '#FF6B6B',
        secondaryColor: '#FFA07A',
        backgroundColor: '#FFF5F5',
        greeting: 'Happy Happy Birthday',
        mainMessage: 'Celebrating {age_text} amazing years of YOU! 🎉',
        secondMessage: 'May your day be filled with laughter, love, and all your favorite things.',
        thirdMessage: 'Here\'s to another year of wonderful memories and adventures!',
        cardEmoji1: '🎂',
        cardEmoji2: '🎈',
        cardEmoji3: '🎁',
        cardText1: 'MAKE A\nWISH',
        cardText2: 'CELEBRATE\nBIG',
        cardText3: 'ENJOY\nTODAY'
      }
    },
    {
      name: 'Modern Minimal',
      preview: '⚫ Black & Gold',
      config: {
        ...getDefaultVisualTemplate(),
        primaryColor: '#1a1a1a',
        secondaryColor: '#D4AF37',
        backgroundColor: '#f5f5f5',
        textColor: '#1a1a1a',
        greeting: 'Birthday Wishes',
        mainMessage: '{age_text} years of excellence.',
        secondMessage: 'Wishing you continued success and happiness.',
        thirdMessage: 'May this year exceed all expectations.',
        showAge: false,
        showQuote: false,
        cardEmoji1: '⭐',
        cardEmoji2: '✓',
        cardEmoji3: '→',
        cardText1: 'ACHIEVE\nGREATNESS',
        cardText2: 'STAY\nFOCUSED',
        cardText3: 'KEEP\nGROWING'
      }
    },
    {
      name: 'Vibrant & Colorful',
      preview: '🌈 Rainbow Gradient',
      config: {
        ...getDefaultVisualTemplate(),
        primaryColor: '#FF1493',
        secondaryColor: '#9400D3',
        backgroundColor: '#FFF0F5',
        greeting: 'It\'s Your Birthday',
        mainMessage: '{age_text} never looked so good! 🎊',
        secondMessage: 'Time to celebrate YOU and all the amazing things you do!',
        thirdMessage: 'Let\'s make this the best birthday yet!',
        cardEmoji1: '🎉',
        cardEmoji2: '🥳',
        cardEmoji3: '🌟',
        cardText1: 'PARTY\nTIME',
        cardText2: 'HAVE\nFUN',
        cardText3: 'SHINE\nBRIGHT'
      }
    },
    {
      name: 'Classic Formal',
      preview: '🎩 Navy & Silver',
      config: {
        ...getDefaultVisualTemplate(),
        primaryColor: '#1e3a8a',
        secondaryColor: '#475569',
        backgroundColor: '#f1f5f9',
        textColor: '#1e293b',
        headingFont: 'Montserrat',
        bodyFont: 'Lato',
        greeting: 'Birthday Greetings',
        mainMessage: 'On the occasion of your {age_text}th birthday.',
        secondMessage: 'We extend our warmest wishes for health, happiness, and prosperity.',
        thirdMessage: 'May the year ahead bring you continued success.',
        quote: '"Age is an opportunity to accomplish great things." — Dr. Edward Everett Hale',
        cardEmoji1: '🏆',
        cardEmoji2: '📈',
        cardEmoji3: '🎯',
        cardText1: 'PURSUE\nEXCELLENCE',
        cardText2: 'ACHIEVE\nGOALS',
        cardText3: 'LEAD\nFORWARD'
      }
    }
  ];

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

  const saveCustomTemplate = async () => {
    // Show save dialog to get template name
    setSaveTemplateName(editingVisualTemplate ? editingVisualTemplate.name : 'Custom Visual Template');
    setShowSaveDialog(true);
  };

  const confirmSaveTemplate = async () => {
    try {
      if (!saveTemplateName || !saveTemplateName.trim()) {
        alert('❌ Please enter a valid template name');
        return;
      }

      const customHTML = generatePreviewHTML();
      
      // Create a text version for the 'message' column (required by DB)
      const textMessage = `${visualTemplate.greeting}, {name}!\n\n${visualTemplate.mainMessage}\n\n${visualTemplate.secondMessage}\n\n${visualTemplate.thirdMessage}\n\n${visualTemplate.footerMessage}`;

      const newTemplate = {
        name: saveTemplateName.trim(),
        subject: `🎉 ${visualTemplate.greeting}, {name}!`,
        message: textMessage,
        type: 'visual',
        config: visualTemplate,
        html: customHTML,
        isDefault: false
      };
      
      console.log('Saving template:', newTemplate);
      
      let result;
      if (editingVisualTemplate) {
        result = await window.electronAPI.updateTemplate(editingVisualTemplate.id, newTemplate);
        if (result && result.success !== false) {
          alert('✅ Template updated successfully!');
        } else {
          throw new Error(result?.error || 'Failed to update template');
        }
      } else {
        result = await window.electronAPI.addTemplate(newTemplate);
        if (result && result.success !== false) {
          alert('✅ Template saved successfully!');
        } else {
          throw new Error(result?.error || 'Failed to save template');
        }
      }
      
      await loadTemplates();
      setShowVisualEditor(false);
      setShowSaveDialog(false);
      setSaveTemplateName('');
      setEditingVisualTemplate(null);
      setVisualTemplate(getDefaultVisualTemplate());
    } catch (error) {
      console.error('Error saving template:', error);
      alert(`❌ Error saving template: ${error.message}`);
    }
  };

  const openVisualEditor = (template = null) => {
    if (template) {
      // Load existing visual template for editing
      console.log('Opening visual editor for template:', template);
      
      // Check if this is a visual template (type field or config field exists)
      if (template.type === 'visual' && template.config) {
        // New format: config is already parsed
        setVisualTemplate(template.config);
        setEditingVisualTemplate(template);
        setShowVisualEditor(true);
        return;
      }
      
      // Try parsing from message field (legacy format)
      try {
        const templateData = JSON.parse(template.message);
        if (templateData.type === 'visual' && templateData.config) {
          setVisualTemplate(templateData.config);
          setEditingVisualTemplate(template);
          setShowVisualEditor(true);
          return;
        }
      } catch (e) {
        // Not JSON, not a visual template
        console.log('Not a visual template, cannot parse message');
      }
      
      alert('This is not a visual template and cannot be edited in the visual editor.');
      return;
    } else {
      // New template - show presets first
      setShowPresets(true);
      return;
    }
  };

  const selectPreset = (preset) => {
    setVisualTemplate(preset.config);
    setEditingVisualTemplate(null);
    setShowPresets(false);
    setShowVisualEditor(true);
  };

  const startFromScratch = () => {
    setVisualTemplate(getDefaultVisualTemplate());
    setEditingVisualTemplate(null);
    setShowPresets(false);
    setShowVisualEditor(true);
  };

  const handleDelete = async (id) => {
    const template = templates.find(t => t.id === id);
    const isDefault = template && template.is_default === 1;
    
    const confirmMessage = isDefault 
      ? 'Delete this default template? Note: You should set another template as default before deleting this one.'
      : 'Delete this template? This action cannot be undone.';
    
    if (window.confirm(confirmMessage)) {
      try {
        await window.electronAPI.deleteTemplate(id);
        alert('✅ Template deleted successfully!');
        loadTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('❌ Failed to delete template: ' + error.message);
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      console.log('Setting template as default:', id);
      
      // First, get the template
      const template = templates.find(t => t.id === id);
      if (!template) {
        console.error('Template not found:', id);
        return;
      }

      // Update all OTHER templates to not be default
      for (const t of templates) {
        if (t.is_default === 1 && t.id !== id) {
          console.log('Removing default flag from template:', t.id);
          await window.electronAPI.updateTemplate(t.id, {
            name: t.name,
            subject: t.subject,
            message: t.message,
            type: t.type || 'text',
            config: t.config,
            html: t.html,
            isDefault: false
          });
        }
      }

      // Set THIS template as default
      console.log('Setting as default:', template.name);
      await window.electronAPI.updateTemplate(id, {
        name: template.name,
        subject: template.subject,
        message: template.message,
        type: template.type || 'text',
        config: template.config,
        html: template.html,
        isDefault: true
      });

      await loadTemplates();
      alert('✅ Default template updated!');
    } catch (error) {
      console.error('Error setting default template:', error);
      alert('❌ Failed to set default template: ' + error.message);
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

  // Generate live preview HTML
  const generatePreviewHTML = () => {
    const vt = visualTemplate;
    
    const ageDisplay = vt.showAge ? `
      <tr>
        <td style="padding: 20px 50px; text-align: center; background: white;">
          <div style="font-size: 64px; font-weight: 600; background: linear-gradient(135deg, ${vt.primaryColor} 0%, ${vt.secondaryColor} 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-family: '${vt.headingFont}', sans-serif;">
            ${previewAge}
          </div>
        </td>
      </tr>` : '';

    const quoteSection = vt.showQuote ? `
      <tr>
        <td style="padding: 40px 60px; background: ${vt.backgroundColor};">
          <div style="background: linear-gradient(135deg, rgba(74,95,232,0.05) 0%, rgba(123,104,238,0.05) 100%); border-left: 4px solid ${vt.primaryColor}; padding: 25px 30px; border-radius: 8px;">
            <p style="font-family: '${vt.headingFont}', sans-serif; font-size: 18px; color: ${vt.textColor}; font-style: italic; margin: 0; line-height: 1.7; text-align: center;">
              ${vt.quote}
            </p>
          </div>
        </td>
      </tr>` : '';

    const actionCards = vt.showActionCards ? `
      <tr>
        <td style="padding: 40px 60px 50px; background: white;">
          <table width="100%" cellpadding="0" cellspacing="15">
            <tr>
              <td width="33%" style="text-align: center; padding: 20px 15px; background: linear-gradient(135deg, ${vt.backgroundColor} 0%, #f0f2ff 100%); border-radius: 10px;">
                <div style="font-size: 28px; margin-bottom: 10px;">${vt.cardEmoji1}</div>
                <div style="font-family: '${vt.headingFont}', sans-serif; font-size: 13px; color: ${vt.textColor}; font-weight: 600; letter-spacing: 0.3px; line-height: 1.4;">${vt.cardText1.replace('\n', '<br>')}</div>
              </td>
              <td width="33%" style="text-align: center; padding: 20px 15px; background: linear-gradient(135deg, ${vt.backgroundColor} 0%, #f0f2ff 100%); border-radius: 10px;">
                <div style="font-size: 28px; margin-bottom: 10px;">${vt.cardEmoji2}</div>
                <div style="font-family: '${vt.headingFont}', sans-serif; font-size: 13px; color: ${vt.textColor}; font-weight: 600; letter-spacing: 0.3px; line-height: 1.4;">${vt.cardText2.replace('\n', '<br>')}</div>
              </td>
              <td width="33%" style="text-align: center; padding: 20px 15px; background: linear-gradient(135deg, ${vt.backgroundColor} 0%, #f0f2ff 100%); border-radius: 10px;">
                <div style="font-size: 28px; margin-bottom: 10px;">${vt.cardEmoji3}</div>
                <div style="font-family: '${vt.headingFont}', sans-serif; font-size: 13px; color: ${vt.textColor}; font-weight: 600; letter-spacing: 0.3px; line-height: 1.4;">${vt.cardText3.replace('\n', '<br>')}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=${vt.headingFont.replace(' ', '+')}:wght@400;600&family=${vt.bodyFont.replace(' ', '+')}:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, ${vt.primaryColor} 0%, ${vt.secondaryColor} 100%); font-family: '${vt.bodyFont}', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 50px 20px;">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background: white; border-radius: ${vt.borderRadius}; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15); max-width: 650px;">
          
          <tr>
            <td style="padding: ${vt.cardPadding} ${vt.cardPadding} 30px; text-align: center; background: white;">
              <h1 style="font-family: '${vt.headingFont}', sans-serif; color: ${vt.textColor}; font-size: ${vt.headingSize}; margin: 0 0 15px 0; font-weight: 600;">
                ${vt.greeting}, <span style="background: linear-gradient(135deg, ${vt.primaryColor} 0%, ${vt.secondaryColor} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${previewName}</span> 🎉
              </h1>
              <div style="width: 120px; height: 3px; background: linear-gradient(90deg, ${vt.primaryColor} 0%, ${vt.secondaryColor} 100%); margin: 0 auto; border-radius: 2px;"></div>
            </td>
          </tr>
          
          ${ageDisplay}
          
          <tr>
            <td style="padding: 30px 60px; background: white;">
              <p style="font-family: '${vt.bodyFont}', sans-serif; font-size: ${vt.bodySize}; color: ${vt.textColor}; line-height: 1.8; margin: 0 0 20px 0; font-weight: 500; text-align: center;">
                ${vt.mainMessage.replace('{age_text}', previewAge)}
              </p>
              <p style="font-family: '${vt.bodyFont}', sans-serif; font-size: ${vt.bodySize}; color: #555; line-height: 1.8; margin: 0 0 18px 0; text-align: center;">
                ${vt.secondMessage}
              </p>
              <p style="font-family: '${vt.bodyFont}', sans-serif; font-size: ${vt.bodySize}; color: #555; line-height: 1.8; margin: 0; text-align: center;">
                ${vt.thirdMessage}
              </p>
            </td>
          </tr>
          
          ${quoteSection}
          ${actionCards}
          
          <tr>
            <td style="padding: 35px 60px; background: ${vt.backgroundColor}; text-align: center; border-top: 1px solid #e8ecf4;">
              <p style="font-family: '${vt.bodyFont}', sans-serif; font-size: 15px; color: #6c757d; margin: 0; line-height: 1.6;">
                ${vt.footerMessage}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px; background: ${vt.textColor}; text-align: center;">
              <p style="font-family: '${vt.bodyFont}', sans-serif; font-size: 12px; color: rgba(255,255,255,0.7); margin: 0;">
                Sent with care from WishMailer
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const exportTemplate = () => {
    const html = generatePreviewHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'birthday-template.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Email Templates
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateOptions(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Template</span>
          </button>
        </div>
      </div>

      {/* Template Type Selection Modal */}
      {showCreateOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Choose Template Type
              </h2>
              <button onClick={() => setShowCreateOptions(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => {
                  setShowCreateOptions(false);
                  openVisualEditor();
                }}
                className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  Visual Designer
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create beautiful, colorful HTML emails with our drag-and-drop style editor. Includes presets and live preview.
                </p>
              </button>

              <button
                onClick={() => {
                  setShowCreateOptions(false);
                  setShowAdd(true);
                  setEditing(null);
                  setFormData({ name: '', subject: '', message: '', isDefault: false });
                }}
                className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Type className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  Simple Text
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create basic text-only templates. Perfect for personal, direct messages without complex formatting.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Presets Modal */}
      {showPresets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Choose a Template Preset
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Start with a pre-designed template or create from scratch
                </p>
              </div>
              <button onClick={() => setShowPresets(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {templatePresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => selectPreset(preset)}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-all text-left group hover:shadow-lg"
                >
                  <div className="text-3xl mb-2">{preset.preview.split(' ')[0]}</div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {preset.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {preset.preview}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={startFromScratch}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
            >
              <Plus className="w-6 h-6 mx-auto mb-2" />
              <p className="font-semibold">Start from Scratch</p>
              <p className="text-sm">Create your own design from the default template</p>
            </button>
          </div>
        </div>
      )}

      {/* Visual Editor Modal */}
      {showVisualEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Palette className="w-6 h-6 text-purple-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {editingVisualTemplate ? 'Edit Visual Template' : 'Create Visual Template'}
                  </h2>
                  {editingVisualTemplate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Editing: {editingVisualTemplate.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={exportTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Code className="w-5 h-5" />
                  <span>Export HTML</span>
                </button>
                <button
                  onClick={saveCustomTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingVisualTemplate ? 'Update' : 'Save'} Template</span>
                </button>
                <button 
                  onClick={() => {
                    setShowVisualEditor(false);
                    setEditingVisualTemplate(null);
                    setVisualTemplate(getDefaultVisualTemplate());
                  }} 
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Panel - Controls */}
              <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                
                {/* Preview Settings */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-purple-600" />
                    Preview Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preview Name
                      </label>
                      <input
                        type="text"
                        value={previewName}
                        onChange={(e) => setPreviewName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preview Age
                      </label>
                      <input
                        type="text"
                        value={previewAge}
                        onChange={(e) => setPreviewAge(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-purple-600" />
                    Colors
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={visualTemplate.primaryColor}
                        onChange={(e) => setVisualTemplate({...visualTemplate, primaryColor: e.target.value})}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Secondary Color
                      </label>
                      <input
                        type="color"
                        value={visualTemplate.secondaryColor}
                        onChange={(e) => setVisualTemplate({...visualTemplate, secondaryColor: e.target.value})}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={visualTemplate.backgroundColor}
                        onChange={(e) => setVisualTemplate({...visualTemplate, backgroundColor: e.target.value})}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={visualTemplate.textColor}
                        onChange={(e) => setVisualTemplate({...visualTemplate, textColor: e.target.value})}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                    <Type className="w-5 h-5 mr-2 text-purple-600" />
                    Typography
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Heading Font
                      </label>
                      <select
                        value={visualTemplate.headingFont}
                        onChange={(e) => setVisualTemplate({...visualTemplate, headingFont: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      >
                        <option value="Poppins">Poppins</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Body Font
                      </label>
                      <select
                        value={visualTemplate.bodyFont}
                        onChange={(e) => setVisualTemplate({...visualTemplate, bodyFont: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      >
                        <option value="Open Sans">Open Sans</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Lato">Lato</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Montserrat">Montserrat</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-purple-600" />
                    Email Content
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Greeting Text
                      </label>
                      <input
                        type="text"
                        value={visualTemplate.greeting}
                        onChange={(e) => setVisualTemplate({...visualTemplate, greeting: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Main Message (use {'{age_text}'} for age)
                      </label>
                      <textarea
                        value={visualTemplate.mainMessage}
                        onChange={(e) => setVisualTemplate({...visualTemplate, mainMessage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Second Message
                      </label>
                      <textarea
                        value={visualTemplate.secondMessage}
                        onChange={(e) => setVisualTemplate({...visualTemplate, secondMessage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Third Message
                      </label>
                      <textarea
                        value={visualTemplate.thirdMessage}
                        onChange={(e) => setVisualTemplate({...visualTemplate, thirdMessage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quote Text
                      </label>
                      <textarea
                        value={visualTemplate.quote}
                        onChange={(e) => setVisualTemplate({...visualTemplate, quote: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Footer Message
                      </label>
                      <textarea
                        value={visualTemplate.footerMessage}
                        onChange={(e) => setVisualTemplate({...visualTemplate, footerMessage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>

                {/* Display Options */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Display Options</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={visualTemplate.showAge}
                        onChange={(e) => setVisualTemplate({...visualTemplate, showAge: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show Age Display</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={visualTemplate.showQuote}
                        onChange={(e) => setVisualTemplate({...visualTemplate, showQuote: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show Quote Section</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={visualTemplate.showActionCards}
                        onChange={(e) => setVisualTemplate({...visualTemplate, showActionCards: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Show Action Cards</span>
                    </label>
                  </div>
                </div>

                {/* Action Cards */}
                {visualTemplate.showActionCards && (
                  <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Action Cards</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Card 1 Emoji
                        </label>
                        <input
                          type="text"
                          value={visualTemplate.cardEmoji1}
                          onChange={(e) => setVisualTemplate({...visualTemplate, cardEmoji1: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          value={visualTemplate.cardText1}
                          onChange={(e) => setVisualTemplate({...visualTemplate, cardText1: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs mt-1"
                          placeholder="Text (use \n for line break)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Card 2 Emoji
                        </label>
                        <input
                          type="text"
                          value={visualTemplate.cardEmoji2}
                          onChange={(e) => setVisualTemplate({...visualTemplate, cardEmoji2: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          value={visualTemplate.cardText2}
                          onChange={(e) => setVisualTemplate({...visualTemplate, cardText2: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs mt-1"
                          placeholder="Text (use \n for line break)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Card 3 Emoji
                        </label>
                        <input
                          type="text"
                          value={visualTemplate.cardEmoji3}
                          onChange={(e) => setVisualTemplate({...visualTemplate, cardEmoji3: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          value={visualTemplate.cardText3}
                          onChange={(e) => setVisualTemplate({...visualTemplate, cardText3: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs mt-1"
                          placeholder="Text (use \n for line break)"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Panel - Live Preview */}
              <div className="w-1/2 bg-gray-100 dark:bg-gray-900 p-6 overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-purple-600" />
                    Live Preview
                  </h3>
                  <button
                    onClick={() => {
                      const iframe = document.getElementById('preview-iframe');
                      if (iframe) iframe.src = iframe.src; // Refresh iframe
                    }}
                    className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{height: 'calc(100% - 3rem)'}}>
                  <iframe
                    id="preview-iframe"
                    srcDoc={generatePreviewHTML()}
                    className="w-full h-full border-0"
                    title="Email Preview"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Template List */}
      <div className="grid gap-4">
        {templates.map(template => {
          let isVisualTemplate = false;
          let templateData = null;
          
          // Check if template has the type field (new format)
          if (template.type === 'visual') {
            isVisualTemplate = true;
            templateData = { type: 'visual', config: template.config, html: template.html };
          } else {
            // Try parsing from message (legacy format)
            try {
              templateData = JSON.parse(template.message);
              isVisualTemplate = templateData.type === 'visual';
            } catch (e) {
              // Not a JSON template, check if it's HTML
              isVisualTemplate = template.message && template.message.includes('<!DOCTYPE html>');
            }
          }

          return (
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
                  {isVisualTemplate && (
                    <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs px-2 py-1 rounded flex items-center space-x-1">
                      <Palette className="w-3 h-3" />
                      <span>Visual</span>
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Subject: {template.subject}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {isVisualTemplate
                    ? 'Custom HTML email template with visual design' 
                    : template.message}
                </p>
              </div>
              <div className="flex space-x-2">
                {template.is_default !== 1 && (
                  <button
                    onClick={() => handleSetDefault(template.id)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded"
                    title="Set as Default Template"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                )}
                {isVisualTemplate && (
                  <button
                    onClick={() => {
                      if (templateData && templateData.html) {
                        const previewWindow = window.open('', '_blank');
                        previewWindow.document.write(templateData.html);
                        previewWindow.document.close();
                      } else {
                        const previewWindow = window.open('', '_blank');
                        previewWindow.document.write(template.message);
                        previewWindow.document.close();
                      }
                    }}
                    className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900 rounded"
                    title="Preview Template"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isVisualTemplate && templateData && templateData.config) {
                      openVisualEditor(template);
                    } else {
                      handleEdit(template);
                    }
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                  title={isVisualTemplate ? "Edit in Visual Designer" : "Edit Template"}
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                  title="Delete Template"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {editing ? 'Edit Template' : 'New Simple Text Template'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Create a basic text template with placeholder variables
                </p>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="mb-4 bg-blue-50 dark:bg-blue-900 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Tip:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{'{name}'}</code> as a placeholder - it will be replaced with the recipient's name when sending.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - Form */}
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
                    placeholder="e.g., Professional Birthday"
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
                    Message Text
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                    rows="10"
                    placeholder="Dear {name},&#10;&#10;Wishing you a wonderful birthday filled with joy and happiness!&#10;&#10;Best wishes,&#10;Your Friend"
                  />
                </div>

                <label className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
              </div>

              {/* Right side - Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Live Preview
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 min-h-[300px]">
                  <div className="space-y-3">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Subject:</p>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {formData.subject.replace('{name}', 'John Doe') || 'Your subject will appear here'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Message:</p>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {formData.message.replace(/{name}/g, 'John Doe') || 'Your message will appear here...'}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Preview shows how the email will look with "John Doe" as the recipient
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.subject || !formData.message}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>Save Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Name Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingVisualTemplate ? 'Update Template Name' : 'Save Template'}
              </h3>
              <button 
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveTemplateName('');
                }} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={saveTemplateName}
                onChange={(e) => setSaveTemplateName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && saveTemplateName.trim()) {
                    confirmSaveTemplate();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., My Custom Birthday Template"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Give your template a memorable name
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveTemplateName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveTemplate}
                disabled={!saveTemplateName.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{editingVisualTemplate ? 'Update' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Templates;
