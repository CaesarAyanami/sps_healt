import { redirect } from 'next/navigation';

export default function Home() {
  // Redirigir al login por defecto (si hay token el middleware mandará al dashboard)
  redirect('/login');
}
