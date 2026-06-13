import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"

import { createPost } from "@/services/post.services"
import { supabase } from "@/lib/supabase"

import { createPostSchema, type CreatePostType } from "@/schema/post.schema"

import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const NewPost = () => {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const {
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostType>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      caption: "",
    },
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      reset()
      setPreview(null)
      alert("new post created")
    },
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]

      if (!file) return

      setValue("mediaUrl", file, {
        shouldValidate: true,
      })

      setPreview(URL.createObjectURL(file))
    },
    [setValue],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/*": [],
    },
  })

  const removeImage = () => {
    setPreview(null)

    setValue("mediaUrl", undefined as never, {
      shouldValidate: true,
    })
  }

  const onSubmit = async (data: CreatePostType) => {
    try {
      // STEP 1 => Upload image to Supabase
      setIsUploading(true)
      const fileName = `${Date.now()}-${data.mediaUrl.name}`

      const { error } = await supabase.storage
        .from("media")
        .upload(fileName, data.mediaUrl)

      // stop process if upload fail
      if (error) {
        console.error(error)
        alert("Failed to upload image")
        setIsUploading(false)
        return
      }

      // STEP 2 => Get public URL

      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(fileName)

      const mediaUrl = publicUrlData.publicUrl

      // STEP 3 => Send API request

      await mutateAsync({
        caption: data.caption,
        mediaUrl,
      })
    } catch (error) {
      console.error(error)
      alert("Something went wrong")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen  max-w-2xl mx-auto p-4">
      <Card className="w-full bg-[#272526] text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Post</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Caption */}
            <div className="space-y-2">
              <Textarea
                placeholder="Write a caption..."
                className="min-h-[120px]"
                {...register("caption")}
              />

              {errors.caption && (
                <p className="text-sm text-red-500">{errors.caption.message}</p>
              )}
            </div>

            {/* Dropzone */}
            <div className="space-y-2">
              {!preview ? (
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-xl
                    p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${
                      isDragActive
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/25 hover:border-primary"
                    }
                  `}
                >
                  <input {...getInputProps()} />

                  <div className="flex flex-col items-center gap-3">
                    {isDragActive ? (
                      <UploadCloud className="size-12 text-primary" />
                    ) : (
                      <ImagePlus className="size-12 text-muted-foreground" />
                    )}

                    <div>
                      <p className="font-medium">Drag & drop your image here</p>

                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-[500px] object-cover"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    className="
                      absolute top-3 right-3
                      bg-black/70 text-white
                      p-2 rounded-full
                      hover:bg-black transition
                    "
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              {errors.mediaUrl && (
                <p className="text-sm text-red-500">
                  {errors.mediaUrl.message as string}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending || isPending}
              className="w-full"
            >
              {isPending || isUploading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating Post...
                </>
              ) : (
                "Create Post"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default NewPost
