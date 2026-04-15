import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verificarToken } from '@/lib/jwt';

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    
    const payload = verificarToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });

    const { id } = params;
    const { nombreSistema } = await request.json();

    if (!nombreSistema || !nombreSistema.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Verificar que el documento existe
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }

    // Actualizar nombre
    const documentUpdated = await prisma.document.update({
      where: { id },
      data: { nombreSistema: nombreSistema.trim() }
    });

    return NextResponse.json({ success: true, data: documentUpdated });
  } catch (error) {
    console.error('Error actualizando documento:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
