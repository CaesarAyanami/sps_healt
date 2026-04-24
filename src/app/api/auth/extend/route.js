import { NextResponse } from 'next/server';
import { verificarToken, firmarToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const payload = verificarToken(token);
    
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
    }

    // Nuevo payload sin exp o iat anteriores
    const { id, email, rol, nombre } = payload;
    const newToken = firmarToken({ id, email, rol, nombre });

    const response = NextResponse.json({ success: true, message: 'Sesión extendida' }, { status: 200 });

    response.cookies.set({
      name: 'auth_token',
      value: newToken,
      httpOnly: true,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
      path: '/',
    });

    response.cookies.set({
      name: 'user_role',
      value: rol,
      httpOnly: false,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'strict',
      maxAge: 600,
      path: '/',
    });

    response.cookies.set({
      name: 'user_id',
      value: id,
      httpOnly: false,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'strict',
      maxAge: 600,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error en extend session:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
