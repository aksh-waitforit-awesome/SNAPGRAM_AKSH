import PostCard from "@/components/PostCard"
import SearchUsers from "@/components/SearchUser"
import Stories from "@/components/Stories"
import { useGetFeed } from "@/react-query/QueryAndMutation"

const Home = () => {
  const { data, isPending, error } = useGetFeed()

  return (
    // Changed flex direction to column and centered everything
    <div className="flex flex-col items-center px-4 py-4 w-full">
      <div className="w-full max-w-xl space-y-6">
        {/* Stories Section at the top */}
        <div className="w-full">
          <Stories />
        </div>

        {/* Search */}
        <div className="sticky top-0 z-20 pb-2">
          <SearchUsers />
        </div>

        {/* Loading */}
        {isPending && (
          <div className="text-sm text-muted-foreground">Loading feed...</div>
        )}

        {/* Error */}
        {error && <div className="text-sm text-red-500">{error.message}</div>}

        {/* Feed */}
        <div className="mx-auto max-w-3xl space-y-6">
          {data?.posts && data.posts.length > 0 ? (
            <>
              {data.posts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </>
          ) : (
            !isPending && (
              <div className="text-center text-sm text-muted-foreground">
                Be the first person to create a post
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
