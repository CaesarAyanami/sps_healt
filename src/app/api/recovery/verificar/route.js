import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, codigo, nuevaPassword } = await request.json();

    if (!email || !codigo || !nuevaPassword) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos', statusCode: 400 },
        { status: 400 }
      );
    }

    if (nuevaPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres', statusCode: 400 },
        { status: 400 }
      );
    }

    // Buscar el token
    const record = await prisma.recoveryToken.findFirst({
      where: { 
        email,
        token: codigo 
      }
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Código inválido o incorrecto', statusCode: 400 },
        { status: 400 }
      );
    }

    // Verificar expiración
    if (new Date() > record.expiresAt) {
      // Opcional: borrar el token expirado
      await prisma.recoveryToken.delete({ where: { id: record.id } });
      return NextResponse.json(
        { success: false, error: 'El código ha expirado', statusCode: 400 },
        { status: 400 }
      );
    }

    // Hash nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);

    // Actualizar usuario
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    // Eliminar el token de recuperación que ya se usó
    await prisma.recoveryToken.deleteMany({
      where: { email }
    });

    return NextResponse.json(
      { success: true, message: 'Contraseña actualizada correctamente.', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error al verificar recuperación:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', statusCode: 500 },
      { status: 500 }
    );
  }
}
