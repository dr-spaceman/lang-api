import { WithId } from 'mongodb'

export type Role = 'guest' | 'user' | 'admin'

export type Session = {
  accessToken: string
  user: SessionUser
}

export type SessionAuthenticated = Session & { user: SessionUserAuthenticated }

export type SessionUnauthenticated = Session & {
  user: SessionUserUnauthenticated
}

export type SessionUser = SessionUserAuthenticated | SessionUserUnauthenticated

export type SessionUserAuthenticated = {
  id: number
  sessionId: User['sessionId']
  isLoggedIn: true
  name: string
  email: string
  role: Role
}

export type SessionUserUnauthenticated = {
  id: number
  sessionId: User['sessionId']
  isLoggedIn?: false
  name?: never
  email?: never
  role: 'guest'
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
