# Testing Instructions - Pekerjaan Save Fix

## Quick Test

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the user dashboard**:
   - Open http://localhost:3000
   - Click "Masuk sebagai Pekerja" (Login as Worker)

3. **Test adding a new pekerjaan**:
   - Click "+ Catat Pekerjaan Baru" button
   - Fill in the form:
     - Select a job type (Jenis Pekerjaan)
     - Select a location (Lokasi)
     - Enter quantity and unit (optional)
     - Add partners (optional)
   - Click "Simpan Laporan"

4. **Expected Results**:
   - ✅ Should see success message: "✅ Data berhasil disimpan!"
   - ✅ Page should refresh and show the new entry in the table
   - ✅ If there's an error, you'll see a specific error message instead of generic "Gagal menyimpan"

## If You Still Get Errors

### Check Console Logs

1. **Browser Console** (F12 → Console tab):
   - Look for specific error messages
   - Check the network tab for failed API requests

2. **Server Console** (terminal where npm run dev is running):
   - Detailed error logs with codes and messages
   - Look for validation errors or database issues

### Common Issues and Solutions

#### Error: "Jenis pekerjaan harus dipilih"
- **Cause**: No task selected
- **Solution**: Make sure to select a job type from the dropdown

#### Error: "Kolom database tidak ditemukan. Jalankan migrasi."
- **Cause**: Missing database columns
- **Solution**: Run `npm run seed` to add missing columns

#### Error: "User default tidak ditemukan. Hubungi administrator."
- **Cause**: User ID 1 doesn't exist
- **Solution**: Run `npm run seed` to create default users

#### Error: "Pekerjaan atau user tidak valid"
- **Cause**: Foreign key constraint violation
- **Solution**: 
  1. Run `npm run check-db` to verify database
  2. Run `npm run seed` if issues found

## Debugging Commands

```bash
# Check database health
npm run check-db

# Fix database issues
npm run seed

# View server logs
npm run dev

# Check for TypeScript/ESLint errors
npm run lint
```

## Verify the Fix Worked

After successfully adding a pekerjaan:

1. Check the activity_logs table has the new entry
2. Verify all fields are populated correctly:
   - task_def_id
   - custom_description
   - location
   - quantity (if provided)
   - satuan (if provided)
   - partners (if provided)
   - log_time

## Need Help?

If issues persist:
1. Check [FIX_SUMMARY.md](./FIX_SUMMARY.md) for detailed technical information
2. Run `npm run check-db` and share the output
3. Check server console for detailed error messages
4. Check browser console (F12) for frontend errors
