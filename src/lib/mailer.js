import nodemailer from 'nodemailer';

// Transportador de correo usando ethereal.email para pruebas.
// En producción, usa tus propias credenciales en .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function enviarCorreoRecuperacion(email, codigo) {
  try {
    const info = await transporter.sendMail({
      from: '"SPS Health" <no-reply@spshealth.com>',
      to: email,
      subject: 'Recuperación de contraseña - SPS Health',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1E3A8A;">Recuperación de Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código de 6 dígitos para continuar con el proceso:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${codigo}
          </div>
          <p>Este código expira en 15 minutos.</p>
          <p>Si no solicitaste esto, puedes ignorar este correo de forma segura.</p>
        </div>
      `,
    });
    
    console.log('Mensaje enviado: %s', info.messageId);
    
    // Si usas Ethereal, esto mostrará la URL para ver el correo
    if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
      console.log('Vista previa del correo: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return false;
  }
}
