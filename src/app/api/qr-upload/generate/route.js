import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId requerido' }, { status: 400 });
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Limpiar tokens viejos de este paciente
    await prisma.qrUploadToken.deleteMany({
      where: { patientId, expiresAt: { lt: new Date() } }
    });

    // Generar token único (15 min de expiración)
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.qrUploadToken.create({
      data: { token, patientId, expiresAt }
    });

    // La URL a la que apuntará el QR
    const baseUrl = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const uploadUrl = `${baseUrl}/qr-upload/${token}`;

    return NextResponse.json({ success: true, uploadUrl, token, expiresAt });
  } catch (error) {
    console.error('Error generando token QR:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
