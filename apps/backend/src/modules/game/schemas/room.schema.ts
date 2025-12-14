import { z } from 'zod'

/**
 * Zod schemas for Room WebSocket events
 */

export const RoomCreateSchema = z.object({
  quizId: z.string().uuid('Invalid quiz ID format'),
  maxPlayers: z.number().int().min(2).max(50).optional().default(10),
  questionTime: z.number().int().min(5).max(60).optional().default(15),
  isPrivate: z.boolean().optional().default(false),
  password: z.string().min(4).max(20).optional(),
})

export const RoomJoinSchema = z.object({
  code: z.string().length(6, 'Room code must be 6 digits').regex(/^\d{6}$/, 'Room code must be numeric'),
  password: z.string().min(4).max(20).optional(),
  username: z.string().min(2).max(30).optional(),
})

export const RoomLeaveSchema = z.object({
  roomId: z.string().uuid('Invalid room ID format'),
})

export const RoomStartSchema = z.object({
  roomId: z.string().uuid('Invalid room ID format'),
})

export const RoomReadySchema = z.object({
  roomId: z.string().uuid('Invalid room ID format'),
})

export const RoomKickPlayerSchema = z.object({
  roomId: z.string().uuid('Invalid room ID format'),
  playerId: z.string().uuid('Invalid player ID format'),
})

export const RoomUpdateSettingsSchema = z.object({
  roomId: z.string().uuid('Invalid room ID format'),
  maxPlayers: z.number().int().min(2).max(50).optional(),
  questionTime: z.number().int().min(5).max(60).optional(),
  isPrivate: z.boolean().optional(),
  password: z.string().min(4).max(20).optional(),
})

export type RoomCreateDto = z.infer<typeof RoomCreateSchema>
export type RoomJoinDto = z.infer<typeof RoomJoinSchema>
export type RoomLeaveDto = z.infer<typeof RoomLeaveSchema>
export type RoomStartDto = z.infer<typeof RoomStartSchema>
export type RoomReadyDto = z.infer<typeof RoomReadySchema>
export type RoomKickPlayerDto = z.infer<typeof RoomKickPlayerSchema>
export type RoomUpdateSettingsDto = z.infer<typeof RoomUpdateSettingsSchema>
