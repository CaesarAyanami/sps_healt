import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('rol');

    if (rol === 'admin') {
      // Para admin: Enviar audit logs y un resumen general
      const auditLogs = await prisma.auditLog.findMany({
        orderBy: { fecha: 'desc' },
        take: 50, // Últimos 50 logs por rendimiento
        include: { user: { select: { nombre: true, email: true } } }
      });
      
      const [totalUsers, totalPatients] = await Promise.all([
        prisma.user.count(),
        prisma.patient.count()
      ]);

      return NextResponse.json({
        success: true,
        data: {
          auditLogs,
          stats: { totalUsers, totalPatients }
        },
        statusCode: 200
      }, { status: 200 });

    } else {
      // Para digitizer/viewer: Enviar métricas simples y últimos 5 pacientes
      const totalPatients = await prisma.patient.count();
      
      // Fecha hace 7 días para el gráfico simple de nuevos pacientes
      const sieteDiasAtras = new Date();
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
      
      const pacientesUltimos7Dias = await prisma.patient.count({
        where: { createdAt: { gte: sieteDiasAtras } }
      });

      const ultimos5Pacientes = await prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { creadoPor: { select: { nombre: true } } }
      });

      return NextResponse.json({
        success: true,
        data: {
          totalPatients,
          pacientesUltimos7Dias,
          ultimos5Pacientes
        },
        statusCode: 200
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error dashboard API:', error);
    return NextResponse.json({ success: false, error: 'Error del servidor', statusCode: 500 }, { status: 500 });
  }
}
