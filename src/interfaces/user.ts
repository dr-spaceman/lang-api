import { WithId } from 'mongodb'

export type Role = 'guest' | 'user' | 'admin'

type SessionAuthenticated = {
  isLoggedIn: true
  id: UserAuthenticated['id']
  name: UserAuthenticated['name']
  email: UserAuthenticated['email']
  role: UserAuthenticated['role']
}

type SessionUnauthenticated = {
  [K in keyof SessionAuthenticated]?: never
}

export type SessionUser = {
  sessionId: User['sessionId']
} & (SessionAuthenticated | SessionUnauthenticated)

export type Session = {
  accessToken: string
  user: SessionUser
}

export type SessionDb = WithId<{
  sessionId: string
  usage: Usage
  // Misc user data, fingerprint, system etc
  meta?: any
  createdAt: Date
}>

export type User = WithId<{
  id: number
  sessionId: string
  role: Role
  createdAt: Date
}> &
  (UserUnauthenticatedPartial | UserAuthenticatedPartial)

type UserAuthenticatedPartial = {
  name: string
  email: string
  emailVerified?: Date
  password: string
  lastLoginAt: Date
  updatedAt: Date
}

type UserUnauthenticatedPartial = {
  [k in keyof UserAuthenticatedPartial]?: never
}

export type UserAuthenticated = User & UserAuthenticatedPartial

export type UserUnauthenticated = User & UserUnauthenticatedPartial

export type Usage = {
  tokens: number
}
