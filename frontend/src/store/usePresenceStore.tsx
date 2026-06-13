import { create } from "zustand"

interface PresenceStore {
  onlineUsers: Set<string>
  setOnline: (id: string) => void
  setOffline: (id: string) => void
  isOnline: (id: string) => boolean
}

const usePresenceStore = create<PresenceStore>((set, get) => ({
  onlineUsers: new Set(),

  setOnline: (id) =>
    set((state) => ({
      onlineUsers: new Set(state.onlineUsers).add(id),
    })),

  setOffline: (id) =>
    set((state) => {
      const users = new Set(state.onlineUsers)
      users.delete(id)

      return {
        onlineUsers: users,
      }
    }),

  isOnline: (id) => get().onlineUsers.has(id),
}))

export default usePresenceStore
