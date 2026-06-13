import { type Profile } from "./profile.schema"
export type Suggestion = Omit<Profile, "followStatus" | "email">
export interface UsersSuggestionResponse {
    success: boolean
    suggestions: Suggestion[]
}
