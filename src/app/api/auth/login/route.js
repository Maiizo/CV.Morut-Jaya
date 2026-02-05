import { NextResponse } from 'next/server';
import { verifyCredentials, createSessionData, createAuthResponse } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }
    
    // Verify credentials
    const result = await verifyCredentials(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }
    
    // Create session data
    const sessionData = createSessionData(result.user.id, result.user);
    
    // Return user data with session cookie
    return createAuthResponse(
      {
        success: true,
        user: result.user,
      },
      sessionData
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}
