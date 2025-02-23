import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export interface TokenPayload extends JWTPayload {
  id: string
  email: string
  role: string
  organizationId: string | null
}

export async function generateToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7天
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as TokenPayload
  } catch (error) {
    return null
  }
} 