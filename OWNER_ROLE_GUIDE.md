# Owner Role Implementation Guide

## Overview
The Owner role has been successfully implemented with Excel import/export capabilities using the XLSX (SheetJS) library.

## What Was Done

### 1. Database Migration
- **File**: `script/migrations/005_add_owner_role.sql`
- **Status**: ✅ Completed
- **Change**: Updated the `users` table to include 'owner' as a valid role (alongside 'admin' and 'user')

### 2. Authentication Updates
- **File**: `src/lib/auth.js`
- **Added Functions**:
  - `isOwner()` - Checks if current user has owner role
  - `isAdminOrOwner()` - Checks if current user is either admin or owner

### 3. API Routes Created

#### Excel Export API
- **File**: `src/app/api/excel/export/route.js`
- **Method**: GET
- **Parameters**: 
  - `fromDate` (required) - Start date for filtering
  - `toDate` (required) - End date for filtering
- **Response**: Excel file download
- **Format**: Matches admin table view with columns:
  - No (sequential number)
  - Tanggal (date)
  - Jam (time)
  - Nama (user name)
  - Tugas (task)
  - Lokasi (location)
  - Jumlah (quantity)
  - Satuan (unit)
  - Rekan (partners)

#### Excel Import API
- **File**: `src/app/api/excel/import/route.js`
- **Method**: POST
- **Body**: FormData with 'file' field (Excel file)
- **Returns**: JSON with import results
  ```json
  {
    "success": true,
    "imported": 45,
    "total": 50,
    "errors": ["Row 3: User 'John' tidak ditemukan", ...]
  }
  ```
- **Features**:
  - Validates required fields (Nama, Tugas)
  - Checks if users exist in database
  - Auto-creates tasks if they don't exist
  - Parses dates and times automatically
  - Provides detailed row-by-row error reporting

### 4. Owner Dashboard UI
- **File**: `src/app/owner/page.tsx`
- **Features**:
  - Date range picker for export
  - Export button with download functionality
  - File upload for import
  - Import with progress indicator
  - Detailed import results display
  - User instructions
  - Logout button

### 5. Routing Updates
- **Updated Files**:
  - `src/middleware.ts` - Added owner route protection
  - `src/app/login/page.tsx` - Added owner role redirect
  - `src/app/page.tsx` - Added owner dashboard redirect

## How to Use

### Creating an Owner User

You need to manually create an owner user in the database. Here are two methods:

#### Method 1: Using SQL Query
```sql
-- First, find the email/username you want to promote to owner
SELECT id, username, email, role FROM users WHERE email = 'your-email@example.com';

-- Then update the role to owner
UPDATE users SET role = 'owner' WHERE email = 'your-email@example.com';
```

#### Method 2: Using pgAdmin or Supabase Dashboard
1. Open your database management tool
2. Navigate to the `users` table
3. Find the user you want to promote
4. Edit the `role` column
5. Change the value to `owner`
6. Save the changes

### Logging in as Owner

1. Go to `/login`
2. Enter the credentials of the owner user
3. You will be automatically redirected to `/owner`

### Exporting Data

1. Go to the Owner Dashboard (`/owner`)
2. In the "Export Data ke Excel" section:
   - Select "Dari Tanggal" (from date)
   - Select "Sampai Tanggal" (to date)
   - Click "Export Excel" button
3. The Excel file will download automatically
4. Filename format: `activity_logs_YYYY-MM-DD_to_YYYY-MM-DD.xlsx`

### Importing Data

1. Prepare your Excel file with the correct format (see template below)
2. Go to the Owner Dashboard (`/owner`)
3. In the "Import Data dari Excel" section:
   - Click "Pilih File Excel" to select your file
   - Click "Import Excel" to upload
4. Wait for the import to complete
5. Review the results:
   - Success count
   - Error list (if any)

### Excel Template Format

The Excel file must have these column headers (exact match):
- **No** - Sequential number (optional, can be blank)
- **Tanggal** - Date (YYYY-MM-DD or DD/MM/YYYY)
- **Jam** - Time (HH:MM or HH:MM:SS)
- **Nama** - Username (must exist in system)
- **Tugas** - Task name (will be created if doesn't exist)
- **Lokasi** - Location (optional)
- **Jumlah** - Quantity (optional)
- **Satuan** - Unit (optional)
- **Rekan** - Partners/collaborators (optional)

**Required fields**: Nama, Tugas

**Example Excel Data**:
| No | Tanggal | Jam | Nama | Tugas | Lokasi | Jumlah | Satuan | Rekan |
|----|---------|-----|------|-------|--------|--------|--------|-------|
| 1 | 2024-01-15 | 09:00 | john_doe | Meeting | Office | 1 | session | jane_doe |
| 2 | 2024-01-15 | 14:30 | jane_doe | Report | Remote | 5 | pages | |

## Important Notes

### Import Behavior
- **User validation**: All usernames in the "Nama" column must exist in the database. Import will fail for rows with non-existent users.
- **Task auto-creation**: If a task doesn't exist, it will be automatically created.
- **Date parsing**: The system tries to parse various date/time formats. If parsing fails, it uses the current timestamp.
- **Partial imports**: If some rows have errors, the valid rows will still be imported. Check the error list for details.

### Security
- Only users with the 'owner' role can access `/owner` route
- Only owner users can call `/api/excel/export` and `/api/excel/import`
- Both API endpoints return 403 Forbidden for non-owner users

### Performance
- For large Excel files (1000+ rows), the import may take some time
- Each row requires database queries for user lookup and task creation/lookup
- Consider importing in smaller batches if you have very large datasets

## Testing

To test the owner role implementation:

1. **Create a test owner user**:
   ```sql
   -- Update an existing user to owner
   UPDATE users SET role = 'owner' WHERE email = 'test@example.com';
   ```

2. **Test export**:
   - Login as owner
   - Select a date range
   - Click export
   - Verify Excel file downloads with correct data

3. **Test import**:
   - Create a test Excel file with the template format
   - Upload it through the import interface
   - Check import results
   - Verify data appears in admin dashboard

## Troubleshooting

### "User not found" errors during import
- Make sure all usernames in the "Nama" column exactly match usernames in the database
- Check for extra spaces or different casing

### "No data found in Excel file"
- Make sure the Excel file has data rows (not just headers)
- Make sure you're uploading an actual Excel file (.xlsx or .xls)

### Import partially successful
- This is normal behavior - the system imports valid rows and reports errors for invalid ones
- Check the error list to see which rows failed and why
- Fix the errors in your Excel file and re-import those rows

### Date parsing issues
- Use ISO format (YYYY-MM-DD) for dates
- Use 24-hour format (HH:MM) for times
- If dates are not parsing correctly, they will default to current timestamp

## File Structure

```
cv.morut-jaya/
├── script/
│   ├── migrations/
│   │   └── 005_add_owner_role.sql          # Database migration
│   └── run-migration-005.js                # Migration runner script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── excel/
│   │   │       ├── export/
│   │   │       │   └── route.js            # Export API
│   │   │       └── import/
│   │   │           └── route.js            # Import API
│   │   ├── owner/
│   │   │   └── page.tsx                    # Owner dashboard
│   │   ├── login/
│   │   │   └── page.tsx                    # Updated with owner redirect
│   │   └── page.tsx                        # Updated with owner redirect
│   ├── lib/
│   │   └── auth.js                         # Updated with owner helpers
│   └── middleware.ts                        # Updated with owner route protection
├── package.json                             # Added xlsx dependency
└── OWNER_ROLE_GUIDE.md                      # This file
```

## Dependencies

- **xlsx** (^0.18.5): SheetJS library for Excel file parsing and generation
- Already installed via `npm install`

## Next Steps

1. Create your first owner user using SQL or database management tool
2. Login as owner and test the export functionality
3. Create a test Excel file and test the import functionality
4. Document your Excel template format for your team
5. Train users on how to format Excel files correctly

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check the server logs for API errors
3. Verify database connection and credentials
4. Ensure the migration was run successfully
5. Verify the user has the 'owner' role in the database
