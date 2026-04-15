import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { email, nombre, rol, password } = body;

    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado', statusCode: 404 }, { status: 404 });
    }

    const dataToUpdate = { email, nombre, rol };

    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.passwordHash = await bcrypt.hash(password, salt);
    } else if (password && password.length > 0) {
      return NextResponse.json({ success: false, error: 'Contraseña debe ser de al menos 6 caracteres', statusCode: 400 }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, email: true, nombre: true, rol: true, createdAt: true }
    });

    return NextResponse.json({ success: true, message: 'Usuario actualizado', data: updatedUser, statusCode: 200 }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'El email ya está en uso', statusCode: 400 }, { status: 400 });
    }
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', statusCode: 500 }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Si queremos verificar que no se borre a sí mismo, eso lo haríamos con el token actual.
    // Como el Request en sí trae sus cookies, se puede decodificar o asuminos validación UI/Frontend.

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
       return NextResponse.json({ success: false, error: 'Usuario no encontrado', statusCode: 404 }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Usuario eliminado', statusCode: 200 }, { status: 200 });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', statusCode: 500 }, { status: 500 });
  }
}
