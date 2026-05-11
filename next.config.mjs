/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aumentar el límite de tamaño de body para la subida de PDFs (coincide con Nginx client_max_body_size)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
