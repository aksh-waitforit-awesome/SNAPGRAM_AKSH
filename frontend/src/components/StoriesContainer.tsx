import API from "@/api/api"
import { Plus, X, Volume2, VolumeX } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"

type User = {
  id: string
  username: string
  avatarUrl: string
}

type StoryItem = {
  id: string
  mediaUrl: string
  mediaType: "VIDEO" | "IMAGE"
  caption: string
  authorId: string
  createdAt: string
}

type GroupedStory = {
  author: User
  stories: StoryItem[]
}

async function getStories() {
  const { data } = await API.get("/story")
  return data
}

const IMAGE_DURATION = 5000 // Instagram default for images

const StoriesContainer = () => {
  const { data, isPending } = useQuery({
    queryKey: ["STORY"],
    queryFn: getStories,
  })

  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const videoRef = useRef<HTMLVideoElement>(null)

  const groupedStories: GroupedStory[] = data?.data || []

  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [muted, setMuted] = useState(true)

  // refs so timers always read fresh values, avoiding stale closures
  const activeGroupIndexRef = useRef(activeGroupIndex)
  const currentStoryIndexRef = useRef(currentStoryIndex)
  activeGroupIndexRef.current = activeGroupIndex
  currentStoryIndexRef.current = currentStoryIndex

  const activeGroup =
    activeGroupIndex !== null ? groupedStories[activeGroupIndex] : null

  const currentStory = activeGroup?.stories[currentStoryIndex]

  const closeStory = () => {
    setActiveGroupIndex(null)
    setCurrentStoryIndex(0)
    setProgress(0)
  }

  const nextStory = () => {
    const gIndex = activeGroupIndexRef.current
    const sIndex = currentStoryIndexRef.current

    if (gIndex === null) return

    const group = groupedStories[gIndex]

    if (sIndex < group.stories.length - 1) {
      setCurrentStoryIndex(sIndex + 1)
      return
    }

    if (gIndex < groupedStories.length - 1) {
      setActiveGroupIndex(gIndex + 1)
      setCurrentStoryIndex(0)
      return
    }

    closeStory()
  }

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((v) => v - 1)
    }
  }

  // IMAGE progress — fixed 5s duration, CSS handles the smooth fill
  useEffect(() => {
    if (!currentStory) return
    if (currentStory.mediaType === "VIDEO") return

    // reset to 0 first (no transition), then animate to 100 on next tick
    setProgress(0)

    const startFrame = requestAnimationFrame(() => {
      setProgress(100)
    })

    const timeout = setTimeout(() => {
      nextStory()
    }, IMAGE_DURATION)

    return () => {
      cancelAnimationFrame(startFrame)
      clearTimeout(timeout)
    }
  }, [activeGroupIndex, currentStoryIndex, currentStory?.mediaType])

  // VIDEO progress
  useEffect(() => {
    const video = videoRef.current

    if (!video) return
    if (!currentStory || currentStory.mediaType !== "VIDEO") return

    setProgress(0)

    const update = () => {
      if (!video.duration) return
      setProgress((video.currentTime / video.duration) * 100)
    }

    const ended = () => {
      nextStory()
    }

    video.addEventListener("timeupdate", update)
    video.addEventListener("ended", ended)

    return () => {
      video.removeEventListener("timeupdate", update)
      video.removeEventListener("ended", ended)
    }
  }, [activeGroupIndex, currentStoryIndex])

  if (isPending) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto bg-black">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse" />
            <div className="w-10 h-2 rounded bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* STORY BAR */}
      <div className="bg-black border-b border-zinc-800">
        <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide snap-x snap-mandatory">
          <button
            onClick={() => navigate("/create-story")}
            className="relative shrink-0 flex flex-col items-center gap-1 snap-start"
          >
            <div className="relative w-16 h-16 rounded-full p-[2px] bg-zinc-700">
              <div className="w-full h-full rounded-full bg-black p-[2px]">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user?.avatarUrl} className="object-cover" />
                  <AvatarFallback>
                    {user?.username?.toUpperCase()[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-black">
                <Plus size={12} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-zinc-300 max-w-[64px] truncate">
              Your story
            </p>
          </button>

          {groupedStories.map((group, index) => (
            <button
              key={group.author.id}
              onClick={() => {
                setActiveGroupIndex(index)
                setCurrentStoryIndex(0)
              }}
              className="shrink-0 flex flex-col items-center gap-1 snap-start"
            >
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-black p-[2px]">
                  <Avatar className="w-full h-full">
                    <AvatarImage
                      src={group.author?.avatarUrl}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {group.author?.username?.toUpperCase()[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <p className="text-xs text-zinc-300 max-w-[64px] truncate">
                {group.author.username}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* VIEWER */}
      {activeGroup && currentStory && (
        <div className="fixed inset-0 bg-black z-50">
          {/* progress */}
          <div className="absolute top-3 left-2 right-2 flex gap-1 z-50">
            {activeGroup.stories.map((_, i) => {
              const isPast = i < currentStoryIndex
              const isCurrent = i === currentStoryIndex

              let width = "0%"
              let transitionDuration = "0ms"

              if (isPast) {
                width = "100%"
              } else if (isCurrent) {
                width = `${progress}%`
                transitionDuration =
                  currentStory.mediaType === "IMAGE"
                    ? `${IMAGE_DURATION}ms`
                    : "100ms"
              }

              return (
                <div
                  key={i}
                  className="flex-1 h-[2px] bg-white/25 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full"
                    style={{
                      width,
                      transitionProperty: "width",
                      transitionDuration,
                      transitionTimingFunction: "linear",
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* header */}
          <div className="absolute top-7 left-3 right-3 flex items-center justify-between z-50">
            <div className="flex items-center gap-2">
              <img
                src={activeGroup.author.avatarUrl}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-white text-sm font-semibold">
                {activeGroup.author.username}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {currentStory.mediaType === "VIDEO" && (
                <button onClick={() => setMuted((m) => !m)}>
                  {muted ? (
                    <VolumeX color="white" size={20} />
                  ) : (
                    <Volume2 color="white" size={20} />
                  )}
                </button>
              )}
              <button onClick={closeStory}>
                <X color="white" size={24} />
              </button>
            </div>
          </div>

          {/* media */}
          <div className="h-full flex justify-center items-center">
            {currentStory.mediaType === "VIDEO" ? (
              <video
                ref={videoRef}
                src={currentStory.mediaUrl}
                autoPlay
                muted={muted}
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                className="w-full h-full object-contain"
              />
            )}

            <button
              onClick={prevStory}
              className="absolute left-0 top-0 w-1/2 h-full"
            />

            <button
              onClick={nextStory}
              className="absolute right-0 top-0 w-1/2 h-full"
            />
          </div>

          {/* caption */}
          {currentStory.caption && (
            <div className="absolute bottom-10 left-0 right-0 text-center px-4">
              <span className="bg-black/70 px-4 py-2 rounded-xl text-white text-sm">
                {currentStory.caption}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default StoriesContainer
