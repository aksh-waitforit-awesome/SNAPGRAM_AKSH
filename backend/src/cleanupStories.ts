import { prisma } from "./lib/prisma"
import { supabase } from "./lib/supabase"

const STORY_BUCKET = "stories"
const BATCH_SIZE = 500

export const cleanupExpiredStories = async () => {
  let totalDeleted = 0

  while (true) {
    const expiredStories = await prisma.story.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        mediaPath: true,
      },
      take: BATCH_SIZE,
      orderBy: {
        expiresAt: "asc",
      },
    })

    if (!expiredStories.length) {
      break
    }

    const paths = expiredStories.map((story) => story.mediaPath)

    try {
      // delete files from storage
      const { data, error } = await supabase.storage
        .from(STORY_BUCKET)
        .remove(paths)

      if (error) {
        console.error("Storage delete failed:", error)
        break
      }

      /*
        Supabase remove returns successful removals.
        Delete only matching DB rows.
      */

      const removedPaths =
        data?.map((item) => item.name) ?? []

      const deletedStoryIds = expiredStories
        .filter((story) =>
          removedPaths.some((path) =>
            story.mediaPath.endsWith(path)
          )
        )
        .map((story) => story.id)

      if (!deletedStoryIds.length) {
        continue
      }

      await prisma.story.deleteMany({
        where: {
          id: {
            in: deletedStoryIds,
          },
        },
      })

      totalDeleted += deletedStoryIds.length

      console.log(
        `Deleted batch (${deletedStoryIds.length})`
      )
    } catch (error) {
      console.error("Cleanup batch failed:", error)
      break
    }
  }

  console.log(
    `Cleanup complete. Deleted ${totalDeleted} stories`
  )
}