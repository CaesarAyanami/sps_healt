import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { caso } = params;

    const paciente = await prisma.patient.findUnique({
      where: { caso },
      include: {
        documentos: {
          orderBy: { orden: 'asc' }
        },
        creadoPor: {
          select: { nombre: true, email: true }
        }
      }
    });

    if (!paciente) {
      return NextResponse.json({ success: false, error: 'Paciente no encontrado', statusCode: 404 }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: paciente, statusCode: 200 }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', statusCode: 500 }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { caso } = params;
    const formData = await request.formData();

    const paciente = await prisma.patient.findUnique({ where: { caso } });
    if (!paciente) {
       return NextResponse.json({ success: false, error: 'Paciente no encontrado', statusCode: 404 }, { status: 404 });
    }

    const primerNombre = formData.get('primerNombre');
    const primerApellido = formData.get('primerApellido');
    let dni = formData.get('dni') || paciente.dni;
    const descripcion = formData.get('descripcion') || '';
    
    // Opcionales
    const segundoNombre = formData.get('segundoNombre') || null;
    const segundoApellido = formData.get('segundoApellido') || null;
    const sexo = formData.get('sexo') || null;
    const edad = formData.get('edad') ? parseInt(formData.get('edad')) : null;
    const fechaNacimiento = formData.get('fechaNacimiento') ? new Date(formData.get('fechaNacimiento')) : null;
    const telefono1 = formData.get('telefono1') || null;
    const telefonoAlternativo = formData.get('telefonoAlternativo') || null;
    const direccion = formData.get('direccion') || null;
    const fechaOperacionStr = formData.get('fechaOperacion');
    const fechaOperacion = fechaOperacionStr && !isNaN(new Date(fechaOperacionStr).getTime()) 
        ? new Date(fechaOperacionStr) 
        : paciente.fechaOperacion;

    const updated = await prisma.patient.update({
      where: { caso },
      data: {
        primerNombre: primerNombre || paciente.primerNombre,
        primerApellido: primerApellido || paciente.primerApellido,
        segundoNombre,
        segundoApellido,
        dni,
        descripcion,
        sexo,
        edad,
        fechaNacimiento,
        telefono1,
        telefonoAlternativo,
        direccion,
        fechaOperacion
      }
    });

    // Anexar archivos si preexisten
    const files = formData.getAll('files');
    if (files && files.length > 0) {
      const dbUrl = process.cwd();
      const UPLOAD_DIR = path.join(dbUrl, 'public', 'uploads');
      
      const safeCaso = caso.replace(/[^a-zA-Z0-9_-]/g, '');
      const safeNombre = updated.primerNombre.replace(/[^a-zA-Z0-9_-]/g, '');
      const safeApellido = updated.primerApellido.replace(/[^a-zA-Z0-9_-]/g, '');
      const safeDni = updated.dni.replace(/[^a-zA-Z0-9_-]/g, '');
      const folderName = `${safeCaso}_${safeNombre}_${safeApellido}_${safeDni}`;
      const patientFolderPath = path.join(UPLOAD_DIR, folderName);
      
      try {
        await fs.access(patientFolderPath);
      } catch {
        await fs.mkdir(patientFolderPath, { recursive: true });
      }

      // Buscar el orden actual
      const docsExisten = await prisma.document.count({ where: { patientId: paciente.id } });
      let ordenContador = docsExisten + 1;

      const savedDocuments = [];
      for (const file of files) {
        if (file && file.name) {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          const nombreSistema = `${ordenContador}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = path.join(patientFolderPath, nombreSistema);
          await fs.writeFile(filePath, fileBuffer);
          
          savedDocuments.push({
            patientId: paciente.id,
            nombreOriginal: file.name,
            nombreSistema,
            ruta: `uploads/${folderName}/${nombreSistema}`,
            orden: ordenContador
          });
          ordenContador++;
        }
      }

      if (savedDocuments.length > 0) {
        await prisma.document.createMany({ data: savedDocuments });
      }
    }

    return NextResponse.json({ success: true, data: updated, message: 'Paciente actualizado', statusCode: 200 }, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', statusCode: 500 }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { caso } = params;

    const paciente = await prisma.patient.findUnique({
      where: { caso },
      include: { documentos: true }
    });

    if (!paciente) {
      return NextResponse.json({ success: false, error: 'Paciente no encontrado', statusCode: 404 }, { status: 404 });
    }

    // 1. Identificar la carpeta a borrar
    if (paciente.documentos.length > 0) {
      // Tomamos la ruta del primer documento para saber la carpeta (ej. uploads/carpeta/archivo.pdf)
      const primeraRuta = paciente.documentos[0].ruta;
      const carpetaStr = path.dirname(primeraRuta); // uploads/carpeta
      
      const absoluteFolderPath = path.join(process.cwd(), 'public', carpetaStr);
      
      try {
        // Borrar carpeta física y su contenido
        await fs.rm(absoluteFolderPath, { recursive: true, force: true });
      } catch (e) {
        console.warn(`No se pudo borrar carpeta ${absoluteFolderPath}:`, e);
      }
    }

    // 2. Borrar documentos de BD (Se borran en cascada si schema.prisma tiene onDelete: Cascade)
    // 3. Borrar paciente
    await prisma.patient.delete({ where: { caso } });

    // TODO: Registrar en AuditLog (el middleware o cliente pasará userId, aquí es endpoint puro de momento)

    return NextResponse.json({ success: true, message: 'Paciente y archivos eliminados', statusCode: 200 }, { status: 200 });
  } catch (error) {
    console.error('Error al borrar paciente:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', statusCode: 500 }, { status: 500 });
  }
}
