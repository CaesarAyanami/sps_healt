import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarCorreoRecuperacion } from '@/lib/mailer';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido', statusCode: 400 },
        { status: 400 }
      );
    }

    const unUsuario = await prisma.user.findUnique({
      where: { email }
    });

    // Por seguridad, devolvemos 200 siempre, incluso si no existe el email
    // para evitar enumeración de correos
    if (!unUsuario) {
      return NextResponse.json(
        { success: true, message: 'Si el correo existe, se enviará un código.', statusCode: 200 },
        { status: 200 }
      );
    }

    // Generar código numérico aleatorio de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Eliminar tokens previos del usuario si hubiera
    await prisma.recoveryToken.deleteMany({
      where: { email }
    });

    // Guardar nuevo token en BD
    await prisma.recoveryToken.create({
      data: {
        email,
        token: codigo,
        expiresAt: expiracion
      }
    });

    // Enviar correo
    await enviarCorreoRecuperacion(email, codigo);

    return NextResponse.json(
      { success: true, message: 'Código de recuperación enviado.', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error al solicitar recuperación:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', statusCode: 500 },
      { status: 500 }
    );
  }
}
