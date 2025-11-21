# 🎉 WishMailer - Birthday Reminder Desktop App

A modern, feature-rich desktop application for managing contacts and sending automated birthday wishes via email. Built with Electron, React, and SQLite.

![WishMailer](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)

## ✨ Features

### 📧 Email Management
- **Automated Birthday Emails** - Schedule and send birthday wishes automatically
- **Visual Template Designer** - Create beautiful HTML email templates with live preview
- **Text Templates** - Simple text-based templates for personal messages
- **Template Presets** - Choose from 5 professionally designed template styles
- **Custom Placeholders** - Use `{name}` and `{age}` in your messages

### 👥 Contact Management
- **Bulk Operations** - Select multiple contacts for batch actions
- **Category Organization** - Group contacts by categories (Family, Friends, Students, etc.)
- **Excel Import/Export** - Import contacts from Excel files and export your database
- **Template Assignment** - Assign specific templates to individual contacts or entire categories
- **Duplicate Detection** - Warns you when adding similar contacts
- **Custom Fields** - Add additional information like phone numbers, notes, and relationships

### 📊 Analytics & Tracking
- **Email Statistics** - Track sent, failed, and pending emails
- **Daily & Monthly Analytics** - View email performance over time
- **Last Contact Tracking** - See when you last contacted each person
- **Queue Management** - Monitor pending emails in the queue

### 🎨 Visual Template Editor
- **Live Preview** - See changes in real-time as you design
- **Color Customization** - Choose primary, secondary, background, and text colors
- **Typography Control** - Select from multiple font families
- **Layout Options** - Toggle age display, quotes, and action cards
- **HTML Export** - Export templates as standalone HTML files

### 🔔 System Integration
- **System Tray** - Minimize to tray and get notifications
- **Auto-start** - Launch automatically on Windows startup
- **Desktop Notifications** - Get notified about birthdays and email status
- **Background Scheduler** - Check for birthdays daily at configurable time

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Windows 10 or later

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Pavanboga07/birthdaywisher.git
cd birthdaywisher/birthday-reminder
```

2. **Install dependencies**
```bash
npm install
```

3. **Run in development mode**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
npm run dist
```

The installer will be created in the `dist` folder: `WishMailer Setup 1.0.0.exe`

## 📋 Configuration

### Email Setup (Gmail)

1. Go to **Settings** tab in the app
2. Enter your Gmail address
3. Generate an App Password:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Factor Authentication
   - Generate an App Password for "Mail"
   - Use this password in the app (not your regular password)
4. Click **Test Email** to verify configuration

### Notification Time

Set the time when the app should check for birthdays daily (default: 09:00 AM)

## 💻 Usage

### Adding Contacts

1. Click **"Add New Contact"** on the Dashboard
2. Fill in required fields:
   - Name
   - Birthday
   - Email address
3. Optional fields:
   - Category
   - Email Template
   - Custom fields (phone, notes, etc.)
4. Click **"Add Contact"**

### Creating Email Templates

#### Visual Templates
1. Go to **Templates** tab
2. Click **"Create New Template"**
3. Select **"Visual Designer"**
4. Choose a preset or start from scratch
5. Customize:
   - Colors and fonts
   - Greeting and messages
   - Layout options
   - Action cards
6. Preview in real-time
7. Save with a custom name

#### Text Templates
1. Click **"Create New Template"**
2. Select **"Simple Text"**
3. Enter template name, subject, and message
4. Use `{name}` placeholder for recipient name
5. Preview and save

### Bulk Operations

#### Assign Template to Multiple Contacts
1. Go to **Dashboard** → **All Contacts**
2. Select contacts using checkboxes
3. Click **"Assign Template"** in the bulk actions bar
4. Choose a template from the list

#### Assign Template to Category
1. Filter contacts by category
2. Click the template icon next to the category filter
3. Select a template to apply to all contacts in that category

#### Delete Multiple Contacts
1. Select contacts using checkboxes
2. Click **"Delete"** in the bulk actions bar
3. Confirm deletion

### Importing Contacts

1. Go to **Settings** tab
2. Click **"Import from Excel"**
3. Select your Excel file with columns:
   - Name
   - Birthday (YYYY-MM-DD format)
   - Email
   - Category (optional)
   - Phone (optional)
4. Review and confirm import

### Sending Emails

#### Manual Send
1. Go to **Dashboard**
2. View **"Today's Birthdays"**
3. Click the send icon next to a contact
4. Or click **"Send All Emails"** to send to all today's birthdays

#### Automatic Send
- The app automatically checks for birthdays daily at your configured time
- Emails are queued and sent automatically
- You'll receive a desktop notification when emails are sent

## 🗂️ Project Structure

```
birthday-reminder/
├── electron/               # Electron main process files
│   ├── main.js            # Main entry point
│   ├── database.js        # SQLite database operations
│   ├── email.js           # Email sending logic
│   ├── email-templates.js # Template generation
│   ├── scheduler.js       # Birthday checking scheduler
│   ├── email-queue.js     # Email queue management
│   ├── backup.js          # Database backup
│   ├── autostart.js       # Startup configuration
│   └── preload.js         # IPC bridge
├── src/                   # React frontend
│   ├── components/        # React components
│   │   ├── Dashboard.jsx
│   │   ├── ContactTable.jsx
│   │   ├── AddContact.jsx
│   │   ├── Templates.jsx
│   │   ├── Settings.jsx
│   │   └── Analytics.jsx
│   ├── App.jsx            # Main app component
│   └── main.jsx           # React entry point
├── public/                # Static assets
├── dist/                  # Built app (after build)
├── dist-react/            # Built React app
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── electron-builder.json  # Build configuration
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Lucide React** - Icons

### Backend
- **Electron 30** - Desktop framework
- **Node.js** - Runtime
- **Better-SQLite3** - Database
- **Nodemailer** - Email sending
- **Node-cron** - Task scheduling

### Build Tools
- **Electron Builder** - App packaging
- **PostCSS** - CSS processing

## 📊 Database Schema

### Tables
- **contacts** - Contact information with foreign key to templates
- **message_templates** - Email templates (text and visual)
- **email_log** - Email sending history
- **email_queue** - Pending emails
- **analytics_daily** - Daily statistics
- **analytics_monthly** - Monthly statistics
- **settings** - App configuration
- **import_history** - Excel import records

## 🔒 Security

- Email passwords are encrypted using AES-256-GCM
- Database is stored locally on your machine
- No data is sent to external servers
- Gmail App Passwords recommended over regular passwords

## 🐛 Troubleshooting

### Email not sending
- Verify Gmail App Password is correct
- Check internet connection
- Ensure 2FA is enabled on Google account
- Check email logs in Analytics tab

### App won't start
- Check if port 5173 is available (dev mode)
- Clear `node_modules` and reinstall: `npm install`
- Check electron process isn't already running

### Contacts not appearing
- Check the database file exists in `AppData/Roaming/WishMailer`
- Try restarting the app
- Check console for errors

### Template images broken
- Delete old templates and create new ones
- Ensure you're using the latest version
- Visual templates don't use external images

## 📝 Scripts

```bash
npm run dev          # Start in development mode
npm run build        # Build React app
npm run dist         # Build installer
npm start            # Start Electron (after build)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Pavan Boga**
- GitHub: [@Pavanboga07](https://github.com/Pavanboga07)

## 🙏 Acknowledgments

- Email templates inspired by modern HTML email design patterns
- Icons from Lucide Icons
- UI components styled with TailwindCSS

## 📮 Support

For support, email your queries or open an issue on GitHub.

## 🎯 Roadmap

- [ ] WhatsApp integration
- [ ] SMS support
- [ ] Calendar sync
- [ ] Multi-language support
- [ ] Cloud backup
- [ ] Mobile companion app
- [ ] Custom reminder intervals
- [ ] Gift tracking
- [ ] Event categories (anniversaries, holidays)

---

Made with ❤️ for never forgetting a birthday again!
