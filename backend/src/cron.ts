import cron from "node-cron"
import { cleanupExpiredStories } from "./cleanupStories"

export const startStoryCleanupCron = () => {
  cron.schedule("0 */1 * * *", async () => {
    console.log("Running story cleanup")

    try {
      await cleanupExpiredStories()
    } catch (err) {
      console.error(err)
    }
  })

  console.log("Story cleanup cron started")
}
