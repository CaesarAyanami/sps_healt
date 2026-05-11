import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// GET: Verificar que el token es válido (usado por la página móvil)
export async function GET(request, { params }) {
  const { token } = params;
  try {
    const record = await prisma.qrUploadToken.findUnique({
      where: { token },
      include: { patient: { select: { caso: true, primerNombre: true, primerApellido: true } } }
    });

    if (!record) return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 404 });
    if (record.usado) return NextResponse.json({ success: false, error: 'Token ya utilizado' }, { status: 410 });
    if (new Date() > record.expiresAt) return NextResponse.json({ success: false, error: 'Token expirado' }, { status: 410 });

    return NextResponse.json({
      success: true,
      patient: record.patient,
      expiresAt: record.expiresAt,
    });
  } catch (error) {
    console.error('Error validando token QR:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

// POST: Recibir el archivo PDF desde el móvil
export async function POST(request, { params }) {
  const { token } = params;
  try {
    const record = await prisma.qrUploadToken.findUnique({
      where: { token },
      include: { patient: true }
    });

    if (!record) return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 404 });
    if (record.usado) return NextResponse.json({ success: false, error: 'Token ya utilizado' }, { status: 410 });
    if (new Date() > record.expiresAt) return NextResponse.json({ success: false, error: 'Token expirado' }, { status: 410 });

    const patient = record.patient;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !file.name) {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo' }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'Solo se permiten archivos PDF' }, { status: 400 });
    }

    // Reconstruir nombre de carpeta del paciente
    const safeCaso = patient.caso.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeNombre = patient.primerNombre.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeApellido = patient.primerApellido.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeDni = patient.dni.replace(/[^a-zA-Z0-9_-]/g, '');
    const folderName = `${safeCaso}_${safeNombre}_${safeApellido}_${safeDni}`;
    const patientFolderPath = path.join(UPLOAD_DIR, folderName);

    // Asegurar que la carpeta existe
    try { await fs.access(patientFolderPath); } catch { await fs.mkdir(patientFolderPath, { recursive: true }); }

    // Calcular el siguiente número de orden
    const lastDoc = await prisma.document.findFirst({
      where: { patientId: patient.id },
      orderBy: { orden: 'desc' }
    });
    const nextOrden = (lastDoc?.orden ?? 0) + 1;

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const nombreSistema = `${nextOrden}_${safeName}`;
    const filePath = path.join(patientFolderPath, nombreSistema);
    const relativePath = `uploads/${folderName}/${nombreSistema}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Guardar documento en BD
    await prisma.document.create({
      data: {
        patientId: patient.id,
        nombreOriginal: file.name,
        nombreSistema,
        ruta: relativePath,
        orden: nextOrden
      }
    });

    // Marcar token como usado
    await prisma.qrUploadToken.update({
      where: { token },
      data: { usado: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Archivo subido correctamente',
      nombreSistema,
    });
  } catch (error) {
    console.error('Error subiendo archivo por QR:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
