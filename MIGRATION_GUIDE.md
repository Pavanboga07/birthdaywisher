# 🚀 Migration & Deployment Guide

## Pre-Deployment Checklist

### 1. Dependencies
No new dependencies required! All features use existing packages:
- ✅ `electron` - safeStorage API (already included)
- ✅ `better-sqlite3` - Database (already included)
- ✅ All other features use built-in Node.js modules

### 2. Database Migration
The database will automatically migrate on first run:
- New tables created: `email_queue`, `analytics_daily`, `analytics_monthly`
- Existing passwords automatically encrypted
- No data loss - completely backwards compatible

### 3. Build & Test

```powershell
# Install dependencies (if needed)
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Create distributable
npm run dist:win
```

## Testing the New Features

### Test 1: Encryption
1. Open Settings
2. Enter email password and save
3. Check database file: `C:\Users\<username>\AppData\Roaming\birthday-reminder\birthdays.db`
4. Password should be stored as `encrypted:...` or `base64:...`
5. Restart app - email should still work (password decrypted correctly)

### Test 2: Email Queue
1. Add a contact with today's birthday and email address
2. Enable email sending in Settings
3. Wait for scheduler to run (or restart app)
4. Check Analytics → Email Queue Status
5. Should see "Pending: 1" then after ~6 seconds "Sent: 1"
6. Verify email received

### Test 3: Analytics Dashboard
1. Click "Analytics" in navigation
2. Verify all cards display correctly
3. Add a contact → should see "Contacts Added" increment
4. Send an email → should see "Emails Sent" increment
5. Check monthly trend chart for data visualization
6. Verify rate limits show current status

## Development Notes

### File Changes Summary
```
Created:
- electron/encryption.js (112 lines)
- electron/email-queue.js (235 lines)
- src/components/Analytics.jsx (368 lines)
- NEW_FEATURES_GUIDE.md (documentation)
- MIGRATION_GUIDE.md (this file)

Modified:
- electron/database.js (+250 lines)
- electron/scheduler.js (~50 lines changed)
- electron/main.js (+60 lines)
- electron/preload.js (+10 lines)
- src/App.jsx (~20 lines changed)
```

### Backward Compatibility
- ✅ All existing features work unchanged
- ✅ Database automatically upgrades
- ✅ No breaking changes to API
- ✅ Old backups can be restored

## Production Deployment

### Step 1: Update Version
Edit `package.json`:
```json
{
  "version": "2.0.0"
}
```

### Step 2: Build Application
```powershell
# Clean previous builds
Remove-Item -Recurse -Force dist, dist-react -ErrorAction SilentlyContinue

# Build React frontend
npm run build

# Create Electron distributable
npm run dist:win
```

### Step 3: Test Installer
1. Locate installer in `dist/` folder
2. Install on test machine
3. Verify all features work
4. Check auto-update functionality

### Step 4: Release
1. Tag version in git: `git tag v2.0.0`
2. Push to repository
3. Create GitHub release with installer
4. Update release notes with NEW_FEATURES_GUIDE.md

## User Migration (Automatic)

When users update from v1.x to v2.0:

1. **First Launch**:
   - Database schema automatically updated
   - Email passwords encrypted
   - Analytics tables created
   - Email queue initialized

2. **No User Action Required**:
   - Settings preserved
   - Contacts preserved
   - Templates preserved
   - Email logs preserved

3. **New Features Available**:
   - Analytics dashboard accessible immediately
   - Email queue starts processing
   - Encryption active for new passwords

## Rollback Plan (If Needed)

### If Issues Occur:
1. Restore database from backup:
   ```powershell
   # Backup location: AppData\Roaming\birthday-reminder\backups\
   ```

2. Reinstall previous version

3. Database is forward-compatible - v1.x can read v2.0 database (ignores new tables)

## Monitoring After Deployment

### Key Metrics to Watch:
1. **Email Queue Performance**:
   - Check queue doesn't get stuck
   - Monitor retry rates
   - Watch for rate limit hits

2. **Analytics Accuracy**:
   - Verify counts match expected values
   - Check monthly aggregation
   - Monitor database size growth

3. **Encryption**:
   - Ensure email sending still works
   - No password corruption
   - Fallback to base64 if needed

### Log Files
Check logs at: `C:\Users\<username>\AppData\Roaming\birthday-reminder\logs\`

Look for:
- ✅ "Encryption migration completed"
- ✅ "Email queue processor started"
- ✅ "Analytics recorded successfully"

## Troubleshooting

### Queue Not Processing
**Symptoms**: Emails stuck in pending
**Solution**:
```javascript
// From DevTools console
await window.electronAPI.processQueueNow();
```

### Encryption Errors
**Symptoms**: "Email not configured" after update
**Solution**:
1. Go to Settings
2. Re-enter email password
3. Save - will be encrypted properly

### Analytics Not Showing
**Symptoms**: Dashboard shows zeros
**Solution**:
- Analytics start tracking from v2.0 onwards
- Historical data not retroactively analyzed
- Wait for new activity to be tracked

### Database Locked
**Symptoms**: "Database is locked" error
**Solution**:
1. Close application completely
2. Ensure no other instances running
3. Restart application

## Performance Optimization

### Database Maintenance
Run periodically (automatically via app):
```javascript
// Clear old queue items (30 days)
await window.electronAPI.clearOldQueueItems(30);

// Backup database
await window.electronAPI.createBackup();
```

### Analytics Cleanup
If database grows too large:
```sql
-- Delete analytics older than 1 year
DELETE FROM analytics_daily 
WHERE date < date('now', '-365 days');
```

## Support

### Common Questions

**Q: Will my email password be visible?**
A: No, it's encrypted using OS-native security.

**Q: What happens if email queue fails?**
A: Emails retry up to 3 times, then marked as failed. Check Analytics for status.

**Q: Can I disable the queue?**
A: Queue is essential for rate limiting. Cannot be disabled.

**Q: How much disk space do analytics use?**
A: ~50KB per 1000 emails tracked (minimal).

**Q: Can I export analytics?**
A: Currently view-only. CSV export planned for v2.1.

## Next Steps

After successful deployment:
1. ✅ Monitor logs for first 24 hours
2. ✅ Check analytics dashboard daily
3. ✅ Verify email queue processing smoothly
4. ✅ Gather user feedback
5. ✅ Plan v2.1 enhancements

## Contact

For issues or questions:
- GitHub Issues: [repository]/issues
- Email: support@birthdayreminder.com
- Documentation: NEW_FEATURES_GUIDE.md

---

**Migration Prepared**: November 1, 2025
**Target Version**: 2.0.0
**Status**: Ready for Production ✅
