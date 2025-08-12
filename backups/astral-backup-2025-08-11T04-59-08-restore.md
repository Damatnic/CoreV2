# Restoration Instructions for astral-backup-2025-08-11T04-59-08

## Prerequisites
- Node.js v22.17.0 or higher
- npm 10.9.2 or higher

## Restoration Steps

1. **Extract the backup archive:**
   ```bash
   tar -xzf astral-backup-2025-08-11T04-59-08.tar.gz
   ```

2. **Navigate to the extracted directory:**
   ```bash
   cd astral-backup-2025-08-11T04-59-08
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Copy environment variables (if needed):**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Build the project:**
   ```bash
   npm run build
   ```

6. **Run tests to verify:**
   ```bash
   npm test
   ```

## Backup Verification

To verify the backup integrity, check the SHA-256 checksum:
```bash
sha256sum astral-backup-2025-08-11T04-59-08.tar.gz
```

Expected checksum: 0f329552fce1ff9440a7fa68c576a821745ac1a60fff676206856dd6e37939ec

## Backup Details
- Created: 2025-08-11T04:59:08.298Z
- Files: 656
- Size: 46.39 MB
- Project Version: 1.0.0

## Notes
- This backup excludes: node_modules, dist, build, .git, *.log, backups, .env, coverage, .cache, playwright-report, test-results
- Environment-specific files (.env) are not included for security
- Node modules are excluded and must be reinstalled

## Quick Restore Script
Save this as `restore.sh`:
```bash
#!/bin/bash
tar -xzf astral-backup-2025-08-11T04-59-08.tar.gz
cd astral-backup-2025-08-11T04-59-08
npm install
cp .env.example .env
echo "✅ Restoration complete. Please configure .env file."
```
