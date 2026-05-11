export const metadata = {
  title: 'Subir Documento | SPS Health',
  description: 'Sube un documento PDF al expediente médico escaneando el código QR.',
};

export default function QrUploadLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
