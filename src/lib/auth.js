import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Session configuration
const SESSION_COOKIE_NAME = 'session_token';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Generate a random session token
 */
export function generateSessionToken() {
  return crypto.randomUUID();
}

/**
 * Create session data to be stored in cookie
 */
export function createSessionData(userId, userData) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  
  return {
    userId,
    user: userData,
    expiresAt: expiresAt.getTime(),
  };
}

/**
 * Parse session from cookie value
 */
export function parseSession(cookieValue) {
  try {
    const session = JSON.parse(cookieValue);
    
    // Check if session expired
    if (new Date().getTime() > session.expiresAt) {
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Get current user from request cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie?.value) return null;
    
    const session = parseSession(sessionCookie.value);
    return session ? session.user : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Get current user from token string
 */
export function getUserFromToken(token) {
  if (!token) return null;
  
  const session = parseSession(token);
  return session ? session.user : null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Check if user has admin role
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Create authenticated response with session cookie
 */
export function createAuthResponse(data, sessionData) {
  const response = NextResponse.json(data);
  const expiresAt = new Date(sessionData.expiresAt);
  
  response.cookies.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return response;
}

/**
 * Verify user credentials
 */
export async function verifyCredentials(email, password) {
  const bcrypt = require('bcrypt');
  
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Verify credentials error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}
