import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { verificarToken } from '@/lib/jwt';

// Mapa de extensiones a tipos MIME
const MIME_TYPES = {
  '.pdf':  'application/pdf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
};

export async function GET(request, { params }) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const payload = verificarToken(token);
    if (!payload) {
      return new NextResponse('Sesión inválida', { status: 401 });
    }

    // Reconstruir la ruta del archivo de forma segura
    const pathSegments = params.path;

    // Seguridad: bloquear path traversal (../)
    if (pathSegments.some(seg => seg.includes('..') || seg.includes('\\'))) {
      return new NextResponse('Ruta inválida', { status: 400 });
    }

    // El archivo está en: <cwd>/public/uploads/<...path>
    // Los pathSegments vienen como: ['uploads', 'carpeta_paciente', 'archivo.pdf']
    const absoluteFilePath = path.join(process.cwd(), 'public', ...pathSegments);

    // Verificar que el archivo existe
    try {
      await fs.access(absoluteFilePath);
    } catch {
      console.error('[api/files] Archivo no encontrado:', absoluteFilePath);
      return new NextResponse('Archivo no encontrado', { status: 404 });
    }

    // Leer el archivo
    const fileBuffer = await fs.readFile(absoluteFilePath);

    // Determinar tipo MIME por extensión
    const ext = path.extname(absoluteFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Devolver el archivo con las cabeceras correctas
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        // inline = el navegador lo muestra, attachment = lo descarga
        'Content-Disposition': `inline; filename="${path.basename(absoluteFilePath)}"`,
        // Cache moderado para reducir carga en el servidor
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[api/files] Error al servir archivo:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
