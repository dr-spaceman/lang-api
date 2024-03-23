import { WithId } from 'mongodb'

export type Role = 'admin' | 'user'

export type SessionUser = Pick<User, 'id' | 'name' | 'email' | 'role'>

export type Session = {
  accessToken: string
  user: SessionUser
}

export type User = WithId<{
  id: number
  name: string
  email: string
  emailVerified?: Date
  password: string
  role: Role
  usage: UserUsage
  lastLoginAt: Date
  createdAt: Date
  updatedAt: Date
}>

export type UserUsage = {
  tokens: number
}
