import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// El escritorio hace polling aquí para saber si el móvil ya subió el archivo
export async function GET(request, { params }) {
  const { token } = params;
  try {
    const record = await prisma.qrUploadToken.findUnique({ where: { token } });
    if (!record) return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 404 });

    const expired = new Date() > record.expiresAt;

    return NextResponse.json({
      success: true,
      usado: record.usado,
      expired,
      expiresAt: record.expiresAt,
    });
  } catch (error) {
    console.error('Error en status QR:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
