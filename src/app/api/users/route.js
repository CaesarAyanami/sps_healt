import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: usuarios, statusCode: 200 }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', statusCode: 500 }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, nombre, rol, password } = await request.json();

    if (!email || !nombre || !rol || !password) {
      return NextResponse.json({ success: false, error: 'Todos los campos son requeridos', statusCode: 400 }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Contraseña debe ser al menos 6 caracteres', statusCode: 400 }, { status: 400 });
    }

    // Verificar si existe el email
    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ success: false, error: 'El email ya está registrado', statusCode: 400 }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        nombre,
        rol,
        passwordHash
      },
      select: { id: true, email: true, nombre: true, rol: true, createdAt: true }
    });

    return NextResponse.json({ success: true, message: 'Usuario creado', data: newUser, statusCode: 201 }, { status: 201 });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', statusCode: 500 }, { status: 500 });
  }
}
