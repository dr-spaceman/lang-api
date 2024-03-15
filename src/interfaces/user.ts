import { WithId } from 'mongodb'

export type Role = 'admin' | 'user'

export type User = WithId<{
  id: number
  name: string
  email: string
  emailVerified?: Date
  password: string
  role: Role
  lastLoginAt: Date
  createdAt: Date
  updatedAt: Date
}>
