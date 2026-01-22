# Code Cleanup Plan

## 🧹 Items to Clean Up

### 1. OLD PostgreSQL Files (No longer needed)
- [x] `database/` folder - Used PostgreSQL init scripts, now using SQLite
- [x] `update-passwords.sql` - PostgreSQL-specific

### 2. Duplicate Root Files (Consolidate)
- [x] `src/` folder at root - Duplicate of admin portal source
- [x] Root config files: `index.html`, `vite.config.ts`, `tsconfig.*.json`, `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`
- [x] `package.json`, `package-lock.json` at root - Not needed if each portal has its own

### 3. Utility/Test Scripts in Server (Move or Remove)
**Keep (useful):**
- ✅ `seed-database.js` - For seeding test data
- ✅ `test-phase2.js` - For testing

**Move to /scripts or archive:**
- [ ] `check-my-ip.js`
- [ ] `monitor-my-ip.js`
- [ ] `fix-passwords.js`
- [ ] `update-passwords.js`
- [ ] `generate-hash.js`
- [ ] `test-pragmatic-connection.js`
- [ ] `test-pragmatic-endpoints.js`
- [ ] `test-pragmatic-official.js`
- [ ] `ip-history.json`

### 4. Documentation Organization
**Keep at root:**
- ✅ README (need to create)
- ✅ PHASE1_TESTING.md
- ✅ PHASE2_TESTING.md
- ✅ PHASE2_SUMMARY.md
- ✅ PHASE3_PLAN.md

**Move to /docs:**
- [ ] MANUAL_TESTING_GUIDE.md
- [ ] TESTING_NOW.md
- [ ] DOCKER-DEPLOYMENT.md
- [ ] IMPLEMENTATION_GUIDE.md (if exists)

### 5. Unused Files
- [x] `generate-hashes.js` at root
- [x] `freebet.png` at root (duplicated in public folders)
- [x] `docker-run.sh` (if not used)
- [x] Old Dockerfiles if not needed

---

## ✅ Cleanup Actions

### Action 1: Archive Old PostgreSQL Files
Move to `archive/postgres/` for reference

### Action 2: Remove Duplicate Root Files
Keep portal-specific files in their directories

### Action 3: Organize Utility Scripts
Create `server/scripts/` folder for utilities

### Action 4: Clean Documentation
Create `docs/` folder for detailed guides

### Action 5: Update .gitignore
Ensure proper files are ignored
