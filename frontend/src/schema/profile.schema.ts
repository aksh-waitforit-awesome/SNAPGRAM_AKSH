export interface Profile {
  id: string
  username: string
  email: string
  isPrivate: boolean
  bio?: string
  avatarUrl?: string
  followStatus: FollowStatus
}
export type  SuggestUser = Omit<Profile, "followStatus" | "email">
export type FollowStatus = "PENDING" | "ACCEPTED" | "REQUESTED" | null

export interface UserCounts {
  posts: number
  followers: number
  following: number
}

export interface ProfilePost {
  id: string
  mediaUrl: string
  caption: string
  createdAt: string // ISO Date String
}
export type UserProfileResponse = Profile & {
  _count: UserCounts
  canViewPosts: boolean
  posts: ProfilePost[]
  isOnline: boolean
}

export type searchProfileResponse = {
  success: boolean
  count: number
  users: Profile[]
}
export type togglePrivacyResponse = {
  message: string
  isPrivate: boolean
}

export type UpdateBioResponse = {
  message: string
  bio: string
}