import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('auth_token')?.value;
  const url = request.nextUrl.clone();
  
  const isLoginPage = url.pathname === '/login' || url.pathname === '/recovery';
  
  if (!token) {
    if (isLoginPage || url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/api/recovery')) {
      return NextResponse.next();
    }
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si hay token, pero el usuario intenta ir a /login, redirigir a dashboard
  if (token && isLoginPage) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Opcional: decodificar payload para control de roles básicos (solo extracción)
  // Nota: JWT firma se verifica completamente en las rutas de API
  try {
    const payloadBase64 = token.split('.')[1];
    // Next.js Middleware corre en Edge Runtime, donde Buffer no existe. Usamos atob().
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);
    
    // Proteger /manage-users solo para admin
    if (url.pathname.startsWith('/manage-users') && payload.rol !== 'admin') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  } catch (err) {
    // Si el token es inválido, forzar limpieza
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    response.cookies.set('auth_token', '', { maxAge: 0 });
    return response;
  }

  return NextResponse.next();
}

// Configurar paths protegidos
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
