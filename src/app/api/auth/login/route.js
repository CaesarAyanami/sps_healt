import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { firmarToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Faltan credenciales previas', statusCode: 400 },
        { status: 400 }
      );
    }

    // Buscar al usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas', statusCode: 401 },
        { status: 401 }
      );
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas', statusCode: 401 },
        { status: 401 }
      );
    }

    // Generar el token JWT con los datos relevantes
    // Incluir rol para evitar consultas en middlewares básicos
    const token = firmarToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre
    });

    // Configurar la cookie HttpOnly
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Sesión iniciada correctamente', 
        data: { id: user.id, nombre: user.nombre, rol: user.rol, email: user.email },
        statusCode: 200 
      },
      { status: 200 }
    );

    // Se establece expiración igual que el token: 10 minutos (600000ms o 600s)
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.HTTPS_ENABLED === 'true', // Solo en true si Nginx tiene certificado SSL (https)
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
      path: '/',
    });

    response.cookies.set({
      name: 'user_role',
      value: user.rol,
      httpOnly: false, // Accesible por JS en el cliente
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'strict',
      maxAge: 600, // 10 minutos
      path: '/',
    });

    response.cookies.set({
      name: 'user_id',
      value: user.id,
      httpOnly: false,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'strict',
      maxAge: 600, // 10 minutos
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', statusCode: 500 },
      { status: 500 }
    );
  }
}
