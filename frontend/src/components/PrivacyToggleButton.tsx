import { Button } from "@/components/ui/button"
import { Loader2, Lock, Globe } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { togglePrivacy } from "@/services/profile.services"
import toast from "react-hot-toast"
import type { UserProfileResponse } from "@/schema/profile.schema"
interface PrivacyToggleButtonProps {
  isPrivate: boolean
  id: string
}

const PrivacyToggleButton = ({ isPrivate, id }: PrivacyToggleButtonProps) => {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: () => togglePrivacy(),
    onSuccess: (data) => {
      queryClient.setQueryData<UserProfileResponse>(["GET_USER_BY_ID", id], (prevData) => {
        return {
          ...prevData,
          isPrivate: data?.isPrivate,
        }
      })
    },
    onError: () => {
      toast.error("Some thing went wrong try again")
    },
  })

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => mutate()}
      className="gap-2 bg-indigo-500 "
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPrivate ? (
        <Lock className="h-4 w-4" />
      ) : (
        <Globe className="h-4 w-4" />
      )}

      {isPrivate ? "Private Account" : "Public Account"}
    </Button>
  )
}

export default PrivacyToggleButton
