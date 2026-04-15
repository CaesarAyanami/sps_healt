import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export function firmarToken(payload) {
  // El JWT expira en 10 minutos (600 segundos)
  return jwt.sign(payload, SECRET, { expiresIn: '10m' });
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}
