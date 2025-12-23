import { createHmac, timingSafeEqual } from 'crypto'
import { env } from '@/config/env'

/**
 * Token Hashing Utility
 *
 * Security: All tokens must be hashed before storing in database
 * - Prevents token theft if database is compromised
 * - Uses HMAC-SHA256 (prevents length extension attacks vs plain SHA-256)
 * - Constant-time comparison (prevents timing attacks)
 * - Fast hashing (~0.1ms per token)
 *
 * HMAC-SHA256 advantages over plain SHA-256:
 * - Prevents length extension attacks
 * - Requires secret key (uses JWT_SECRET)
 * - More secure for token hashing
 *
 * Usage:
 * - Store: hashToken(token) -> save hash to DB
 * - Verify: hashToken(incomingToken) -> compare with DB hash
 */
export class TokenHasher {
  /**
   * Hash a token using HMAC-SHA256
   * @param token - Plain text token
   * @returns HMAC-hashed token (64 hex characters)
   */
  static hash(token: string): string {
    return createHmac('sha256', env.JWT_SECRET).update(token).digest('hex')
  }

  /**
   * Verify a token against its hash (constant-time comparison)
   * @param token - Plain text token to verify
   * @param hash - Stored hash from database
   * @returns true if token matches hash
   */
  static verify(token: string, hash: string): boolean {
    const tokenHash = this.hash(token)

    // Constant-time comparison to prevent timing attacks
    try {
      return timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash))
    } catch {
      // Buffers are different lengths (invalid hash format)
      return false
    }
  }
}
