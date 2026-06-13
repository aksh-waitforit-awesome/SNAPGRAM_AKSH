import { Request, Response } from "express"
import asyncHandler from "../utils/asyncWrapper"
import z from "zod"
import { prisma } from "../lib/prisma"
import { createStoryInputSchema } from "../schema/story.schema"
import { getCurrentUserId } from "../utils/getCurrentUserId"


export const createStory = asyncHandler(async (req: Request, res: Response) => {
  const authorId = getCurrentUserId(req)
  const {
    mediaUrl,
    mediaPath,
    mediaType,
    caption = "",
  } = createStoryInputSchema.parse(req.body)

  // --- CALCULATE EXPIRES AT (24 Hours from now) ---
  // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  const expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS)

  const story = await prisma.story.create({
    data: {
      authorId,
      mediaUrl,
      mediaPath,
      mediaType,
      caption,
      expiresAt, // <-- Pass the expiration timestamp to your database record
    },
  })

  res.status(201).json({ story })
})


export const getStoryFeed = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getCurrentUserId(req)

    const now = new Date()
    // 1. Fetch who the user follows
    const following = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    })

    const followingIds: string[] = following.map((f) => f.followingId)

    // 2. Include the user's own ID so they see their own stories too
    const authorIds: string[] = [...followingIds, userId]

    // 3. Fetch active stories for all relevant authors
    const stories = await prisma.story.findMany({
      where: {
        authorId: { in: authorIds },
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        mediaType: true,
        mediaUrl: true,
        caption: true,
        authorId: true,
        createdAt: true, // Added createdAt so stories play in the right order
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: {
        createdAt: "asc", // Important: Stories should be viewed oldest to newest
      },
    })

    // 4. Group the stories
    const groupedStories = groupStoriesByAuthor(stories)

    // 5. Send the response
    res.status(200).json({
      success: true,
      data: groupedStories,
    })
  },
)

function groupStoriesByAuthor(stories: any[]) {
  const map = new Map<string, any>()

  for (const story of stories) {
    const authorId = story.author.id

    // If we haven't seen this author yet, initialize them in the map
    if (!map.has(authorId)) {
      map.set(authorId, {
        author: story.author,
        stories: [],
      })
    }

    // Get the author's group (this now runs for EVERY story)
    const group = map.get(authorId)

    // Optional but recommended: Destructure the author out of the story object
    // before pushing it. We already have the author info at the group level,
    // so this saves payload size over the network.
    const { author, ...storyData } = story

    group.stories.push(storyData)
  }

  // Convert the Map values back into a standard array for the JSON response
  return Array.from(map.values())
}
