import { SignJWT, jwtVerify } from 'jose'
import type { TokenPayload } from '@repo/shared'

const secret = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev_secret_change_in_prod'
)

const EXPIRES_IN = '7d'

export async function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ rol: payload.rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return {
    sub: payload.sub as string,
    rol: payload['rol'] as TokenPayload['rol'],
    iat: payload.iat as number,
    exp: payload.exp as number,
  }
}
