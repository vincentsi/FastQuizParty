import { z } from 'zod'

/**
 * List of forbidden common passwords
 * These passwords are too predictable and often used in dictionary attacks
 */
const COMMON_PASSWORDS = [
  'password',
  'password123',
  'qwerty',
  'qwerty123',
  'admin',
  'admin123',
  'welcome',
  'welcome123',
  'letmein',
  '123456',
  '12345678',
  '123456789',
]

/**
 * Simple password validation schema
 *
 * Security rules:
 * - Minimum 6 characters
 * - No common passwords
 */
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .refine(
    (password) => {
      const lowerPassword = password.toLowerCase()
      return !COMMON_PASSWORDS.some((common) =>
        lowerPassword.includes(common.toLowerCase())
      )
    },
    {
      message:
        'This password is too common. Choose a more secure password.',
    }
  )

/**
 * Validation schema for registration
 * Validates email, password and optional name
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .toLowerCase()
    .trim(),
  password: passwordSchema,
  name: z
    .string()
    .optional()
    .transform((val) => {
      // Convert empty string to undefined for optional field
      if (val === '' || val === null) return undefined
      return val
    }),
})

/**
 * Validation schema for login
 * Only email and password required
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Validation schema for refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

/**
 * Validation schema for password reset
 * Uses same strict validation as registration
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema, // Same strict validation as registration
})

/**
 * Validation schema for password reset request
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .toLowerCase()
    .trim(),
})

/**
 * TypeScript types inferred from schemas
 * Usage: import type { RegisterDTO, LoginDTO } from '@/schemas/auth.schema'
 */
export type RegisterDTO = z.infer<typeof registerSchema>
export type LoginDTO = z.infer<typeof loginSchema>
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>
