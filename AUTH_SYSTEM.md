# Authentication System Documentation

## Overview
This application now has a complete login and signup system with role-based access control for both Admin and User roles.

## Features
- ✅ User registration (signup)
- ✅ User authentication (login)
- ✅ Session management with HTTP-only cookies
- ✅ Role-based access control (Admin, User)
- ✅ Protected routes with middleware
- ✅ Password hashing with bcrypt
- ✅ Automatic role-based redirects

## User Roles
1. **User (Staff)**: Regular staff members with limited access
2. **Admin**: Administrative users with full access to admin dashboard

## Pages & Routes

### Public Routes
- `/` - Landing page with login/signup options
- `/login` - Login page
- `/signup` - Registration page

### Protected Routes
- `/admin` - Admin dashboard (requires admin role)
- `/user` - User dashboard (requires any authenticated user)

### API Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check current session

## Database Setup

### Run Migration
The users table is created using the migration file. Run the seed script to create the table:

```bash
npm run seed
```

### Users Table Schema
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## How to Use

### 1. Create a New Account
1. Go to `/signup`
2. Fill in:
   - Full name
   - Email address
   - Password (minimum 6 characters)
   - Confirm password
   - Select role (User or Admin)
3. Click "Daftar"
4. You'll be automatically logged in and redirected based on your role

### 2. Login
1. Go to `/login`
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to:
   - `/admin` if you're an admin
   - `/user` if you're a regular user

### 3. Logout
- Click the "Logout" button available in the dashboard
- Or use the LogoutButton component in your pages

## Default Test Accounts
After running `npm run seed`, these accounts are available (password: `123456`):

| Username | Email | Role | Password |
|----------|-------|------|----------|
| Bu Admin | admin@kantor.com | admin | 123456 |
| Ujang (Staff) | ujang@kantor.com | user | 123456 |
| Siti (Staff) | siti@kantor.com | user | 123456 |

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 10 salt rounds
- Plain passwords are never stored in the database
- Password minimum length: 6 characters

### Session Security
- HTTP-only cookies prevent XSS attacks
- Session tokens are randomly generated UUIDs
- Sessions expire after 7 days
- Secure flag enabled in production

### Middleware Protection
- Automatic redirect to login for unauthenticated users
- Protected routes check authentication status
- Role-based access control on pages

## Components

### LogoutButton
Reusable logout button component:
```tsx
import LogoutButton from '@/components/LogoutButton';

<LogoutButton 
  variant="outline" 
  size="default" 
  showIcon={true} 
/>
```

### Auth Utilities (lib/auth.js)
- `getCurrentUser()` - Get current authenticated user
- `isAuthenticated()` - Check if user is logged in
- `isAdmin()` - Check if user has admin role
- `verifyCredentials(email, password)` - Verify login credentials
- `createSession(userId, userData)` - Create new session
- `deleteSession(token)` - Delete session

## Flow Diagrams

### Login Flow
```
User visits /login
  → Enters email & password
  → POST /api/auth/login
  → Verify credentials
  → Create session
  → Set HTTP-only cookie
  → Redirect based on role
    → Admin → /admin
    → User → /user
```

### Signup Flow
```
User visits /signup
  → Fills registration form
  → POST /api/auth/signup
  → Validate input
  → Hash password
  → Create user in database
  → Create session
  → Set HTTP-only cookie
  → Redirect based on role
```

### Protected Route Access
```
User visits /admin or /user
  → Middleware checks for session cookie
  → If no cookie → Redirect to /login
  → If cookie exists → Allow access
  → Page checks role
    → Wrong role → Redirect appropriately
    → Correct role → Show content
```

## Troubleshooting

### Can't login after signup
- Check if the database is running
- Verify the users table exists (`npm run check-db`)
- Check browser console for errors

### Session not persisting
- Clear browser cookies
- Check if cookies are being set (Developer Tools → Application → Cookies)
- Verify the session is created (check server logs)

### Redirect loop
- Clear browser cache and cookies
- Check middleware configuration
- Verify auth.js session functions

## Future Enhancements
- Email verification
- Password reset functionality
- Remember me option
- Two-factor authentication
- OAuth integration (Google, Facebook)
- Session storage in database/Redis
- Rate limiting for login attempts
- Account lockout after failed attempts

## Notes
- Session storage is currently in-memory. For production, migrate to Redis or database
- Update metadata in layout.tsx for better SEO
- Consider adding CSRF protection for forms
- Add rate limiting to prevent brute force attacks
