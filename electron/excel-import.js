const XLSX = require('xlsx');
const { bulkAddContacts, logImport } = require('./database');

function importFromExcel(filePath) {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    // Parse and validate data
    const contacts = rawData.map(row => {
      // Support various column name formats
      const name = row.Name || row.name || row.NAME || '';
      const birthday = parseBirthday(row.Birthday || row.birthday || row.BIRTHDAY || row.DOB || row.dob || '');
      const email = row.Email || row.email || row.EMAIL || '';
      const phone = row.Phone || row.phone || row.PHONE || row.Mobile || row.mobile || '';
      const notes = row.Notes || row.notes || row.NOTES || '';
      const category = row.Category || row.category || row.CATEGORY || 'Uncategorized';
      const templateId = row['Template ID'] || row['template id'] || row.template_id || null;
      
      return {
        name: name.trim(),
        birthday,
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        category: category.trim(),
        template_id: templateId
      };
    }).filter(contact => contact.name && contact.birthday); // Only valid entries
    
    // Bulk insert
    const result = bulkAddContacts(contacts);
    
    // Log import
    const filename = filePath.split('\\').pop().split('/').pop();
    logImport(filename, result.imported);
    
    return {
      success: true,
      imported: result.imported,
      total: rawData.length,
      message: `Successfully imported ${result.imported} of ${rawData.length} contacts`
    };
  } catch (error) {
    console.error('Excel import error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function parseBirthday(dateValue) {
  if (!dateValue) return null;
  
  try {
    // Handle Excel date serial numbers
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    // Handle string dates (YYYY-MM-DD, DD/MM/YYYY, MM-DD-YYYY, etc.)
    const dateStr = String(dateValue);
    
    // Try YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try DD/MM/YYYY or DD-MM-YYYY
    const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try parsing as Date object
    const parsed = new Date(dateValue);
    if (!isNaN(parsed)) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return null;
  } catch (error) {
    console.error('Date parse error:', error);
    return null;
  }
}

function exportToExcel(contacts, filePath) {
  try {
    // Format data for export
    const data = contacts.map(contact => ({
      Name: contact.name,
      Birthday: contact.birthday,
      Email: contact.email || '',
      Phone: contact.phone || '',
      Notes: contact.notes || ''
    }));
    
    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    
    // Write file
    XLSX.writeFile(workbook, filePath);
    
    return { success: true, message: 'Contacts exported successfully' };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error: error.message };
  }
}

function generateTemplate(filePath) {
  try {
    const templateData = [
      { Name: 'John Doe', Birthday: '1990-01-15', Email: 'john@example.com', Phone: '+1234567890', Category: 'Friends', Notes: 'Friend from college', 'Template ID': '' },
      { Name: 'Jane Smith', Birthday: '1985-05-20', Email: 'jane@example.com', Phone: '+0987654321', Category: 'Work', Notes: 'Work colleague', 'Template ID': '' }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Name
      { wch: 12 }, // Birthday
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Category
      { wch: 30 }, // Notes
      { wch: 12 }  // Template ID
    ];
    
    XLSX.writeFile(workbook, filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  importFromExcel,
  exportToExcel,
  generateTemplate
};
