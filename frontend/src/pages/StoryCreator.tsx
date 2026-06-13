import React, { useEffect, useRef, useState, useCallback } from "react"
import * as fabric from "fabric"
import {
  Image as ImageIcon,
  Smile,
  FileImage,
  Type,
  Trash2,
  ImageOff,
  UploadCloud,
  Video,
  X,
  Film,
} from "lucide-react"
import API from "@/api/api"
import { supabase } from "@/lib/supabase"

// ─── Constants ────────────────────────────────────────────────────────────────
// The fabric canvas always renders at this internal resolution.
// We CSS-scale the wrapper to fit the screen — fabric itself never changes size.
const CANVAS_W = 360
const CANVAS_H = 640

type MediaMode = "image" | "video" | null

export default function StoryCreator() {
  // ─── Canvas (image mode) ───────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)

  // ─── Video mode ────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoFileRef = useRef<File | null>(null)
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)

  // ─── Shared state ──────────────────────────────────────────────────
  const [mediaMode, setMediaMode] = useState<MediaMode>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHoveringTrash, setIsHoveringTrash] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [caption, setCaption] = useState("")

  // ─── Responsive scale ─────────────────────────────────────────────
  // We measure available vertical space (viewport minus toolbar + caption + button)
  // and available horizontal space, then pick the smallest ratio so the canvas
  // always fits without clipping on any screen size.
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [canvasScale, setCanvasScale] = useState(1)

  useEffect(() => {
    const TOOLBAR_EST = 180  // px: toolbar + caption + button + padding
    const MIN_SCALE = 0.35

    function recalc() {
      const vw = window.innerWidth
      const vh = window.innerHeight

      const scaleX = (vw - 32) / CANVAS_W          // 16px padding each side
      const scaleY = (vh - TOOLBAR_EST) / CANVAS_H

      const scale = Math.max(MIN_SCALE, Math.min(1, scaleX, scaleY))
      setCanvasScale(scale)
    }

    recalc()
    window.addEventListener("resize", recalc)
    return () => window.removeEventListener("resize", recalc)
  }, [])

  // ─── Init fabric canvas ────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: "#262626",
      preserveObjectStacking: true,
    })
    fabricRef.current = canvas

    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#000000",
      borderColor: "#ffffff",
      cornerSize: 10,
      padding: 10,
    })

    canvas.on("mouse:down", (e) => { if (e.target) setIsDragging(true) })

    canvas.on("object:moving", (e) => {
      const obj = e.target
      if (!obj || obj.top === undefined) return
      setIsHoveringTrash(obj.top > CANVAS_H - 100)
    })

    canvas.on("mouse:up", (e) => {
      setIsDragging(false)
      setIsHoveringTrash(false)
      const obj = e.target
      if (obj && obj.top !== undefined && obj.top > CANVAS_H - 100) {
        canvas.remove(obj)
        canvas.discardActiveObject()
        canvas.renderAll()
      }
    })

    return () => { canvas.dispose() }
  }, [])

  // ─── Cleanup video object URL on unmount ───────────────────────────
  useEffect(() => {
    return () => { if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl) }
  }, [videoObjectUrl])

  // ─── Image handlers ────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return
    setMediaMode("image")
    clearVideo()
    const url = URL.createObjectURL(file)
    const canvas = fabricRef.current
    const htmlImg = new window.Image()
    htmlImg.src = url
    htmlImg.onload = () => {
      const img = new fabric.Image(htmlImg)
      const scale = Math.max(canvas.width! / img.width!, canvas.height! / img.height!)
      img.set({ originX: "center", originY: "center", left: canvas.width! / 2, top: canvas.height! / 2, scaleX: scale, scaleY: scale })
      canvas.backgroundImage = img
      canvas.renderAll()
    }
  }

  const handleAddEmojiSticker = (emoji: string) => {
    if (!fabricRef.current) return
    const canvas = fabricRef.current
    const sticker = new fabric.Text(emoji, {
      left: canvas.width! / 2, top: canvas.height! / 2,
      originX: "center", originY: "center", fontSize: 80,
    })
    canvas.add(sticker)
    canvas.setActiveObject(sticker)
    canvas.renderAll()
  }

  const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return
    const url = URL.createObjectURL(file)
    const canvas = fabricRef.current
    const htmlImg = new window.Image()
    htmlImg.src = url
    htmlImg.onload = () => {
      const img = new fabric.Image(htmlImg)
      img.scaleToWidth(150)
      img.set({ originX: "center", originY: "center", left: canvas.width! / 2, top: canvas.height! / 2 })
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    }
  }

  const handleAddText = () => {
    if (!fabricRef.current) return
    const canvas = fabricRef.current
    const text = new fabric.IText("Tap to edit", {
      left: canvas.width! / 2, top: canvas.height! / 2,
      originX: "center", originY: "center",
      fontFamily: "sans-serif", fontSize: 40, fill: "#ffffff", fontWeight: "bold",
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.6)", blur: 4, offsetX: 0, offsetY: 2 }),
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  const handleDelete = () => {
    if (!fabricRef.current) return
    const canvas = fabricRef.current
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length > 0) {
      canvas.discardActiveObject()
      activeObjects.forEach((obj) => canvas.remove(obj))
      canvas.renderAll()
    }
  }

  const handleRemoveBackground = () => {
    if (!fabricRef.current) return
    fabricRef.current.backgroundImage = undefined
    fabricRef.current.renderAll()
  }

  // ─── Video handlers ────────────────────────────────────────────────

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("video/")) {
      alert("Please select a valid video file.")
      return
    }
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl)
    const url = URL.createObjectURL(file)
    videoFileRef.current = file
    if (videoRef.current) {
      videoRef.current.src = url
      videoRef.current.load()
    }
    setVideoObjectUrl(url)
    setVideoReady(false)
    setMediaMode("video")
    if (fabricRef.current) {
      fabricRef.current.backgroundImage = undefined
      fabricRef.current.renderAll()
    }
  }

  const clearVideo = useCallback(() => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl)
    videoFileRef.current = null
    if (videoRef.current) {
      videoRef.current.removeAttribute("src")
      videoRef.current.load()
    }
    setVideoObjectUrl(null)
    setVideoReady(false)
  }, [videoObjectUrl])

  const handleRemoveVideo = () => {
    clearVideo()
    setMediaMode(null)
  }

  const handleVideoMetadataLoaded = () => { setVideoReady(true) }

  // ─── Publish ───────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!fabricRef.current) return
    try {
      setIsPublishing(true)
      let mediaUrl = ""
      let mediaPath = ""
      let mediaType: "IMAGE" | "VIDEO" = "IMAGE"

      if (mediaMode === "video") {
        const file = videoFileRef.current
        if (!file) { alert("Please select a video first."); setIsPublishing(false); return }
        const video = videoRef.current
        if (!video || !isFinite(video.duration) || video.duration === 0) {
          alert("The selected video appears to be empty or unreadable.")
          setIsPublishing(false)
          return
        }
        mediaType = "VIDEO"
        mediaPath = `story_${Date.now()}.${file.name.split(".").pop()}`
        const { error: uploadError } = await supabase.storage.from("stories").upload(mediaPath, file, { contentType: file.type, upsert: false })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(mediaPath)
        mediaUrl = publicUrl
      } else {
        const canvas = fabricRef.current
        canvas.discardActiveObject()
        canvas.renderAll()
        const dataURL = canvas.toDataURL({ format: "png", quality: 1, multiplier: 3 })
        const response = await fetch(dataURL)
        const blob = await response.blob()
        mediaType = "IMAGE"
        mediaPath = `story_${Date.now()}.png`
        const { error: uploadError } = await supabase.storage.from("stories").upload(mediaPath, blob, { contentType: "image/png", upsert: false })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(mediaPath)
        mediaUrl = publicUrl
      }

      const apiResponse = await API.post("/story", { mediaUrl, mediaPath, mediaType, caption, createdAt: new Date().toISOString() })
      if (apiResponse.status !== 201) throw new Error("Failed to save story to database")

      alert("Story published successfully!")
      fabricRef.current.clear()
      fabricRef.current.backgroundColor = "#262626"
      fabricRef.current.renderAll()
      clearVideo()
      setMediaMode(null)
      setCaption("")
    } catch (error) {
      console.error("Error publishing story:", error)
      alert("Failed to publish story. Check the console.")
    } finally {
      setIsPublishing(false)
    }
  }

  // ─── Derived layout values ─────────────────────────────────────────
  // The wrapper div must have explicit px dimensions matching the canvas,
  // then we scale the whole thing with transform-origin top-center.
  // The outer container needs height = CANVAS_H * scale so it doesn't
  // collapse / overlap the elements below.
  const scaledW = CANVAS_W * canvasScale
  const scaledH = CANVAS_H * canvasScale

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-neutral-900 px-4 pt-4 pb-8 font-sans">

      {/* ── Top Toolbar ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4 w-full max-w-2xl">

        {/* Background controls */}
        {mediaMode !== "video" && (
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white rounded-full cursor-pointer hover:bg-neutral-700 transition shadow-lg">
              <ImageIcon size={16} />
              <span className="text-xs font-medium">Background</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button
              onClick={handleRemoveBackground}
              className="flex items-center justify-center p-2 bg-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded-full transition shadow-lg"
              title="Remove Background"
            >
              <ImageOff size={16} />
            </button>
          </div>
        )}

        {/* Video upload */}
        {mediaMode !== "image" && (
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white rounded-full cursor-pointer hover:bg-neutral-700 transition shadow-lg">
              <Video size={16} />
              <span className="text-xs font-medium">Video / Reel</span>
              <input type="file" accept="video/mp4,video/mov,video/quicktime,video/webm,video/*" className="hidden" onChange={handleVideoUpload} />
            </label>
            {mediaMode === "video" && (
              <button onClick={handleRemoveVideo} className="flex items-center justify-center p-2 bg-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded-full transition shadow-lg" title="Remove Video">
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Emoji */}
        {mediaMode !== "video" && (
          <div className="group relative flex flex-col items-center">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white rounded-full hover:bg-neutral-700 transition shadow-lg">
              <Smile size={16} />
              <span className="text-xs font-medium">Emoji</span>
            </button>
            <div className="absolute top-full pt-2 hidden group-hover:flex z-20">
              <div className="flex gap-2 bg-neutral-800 p-3 rounded-xl shadow-2xl border border-neutral-700">
                {["🔥", "✨", "❤️", "😂", "🎉", "👀"].map((emoji) => (
                  <button key={emoji} onClick={() => handleAddEmojiSticker(emoji)} className="text-xl hover:scale-125 transition-transform">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Custom sticker */}
        {mediaMode !== "video" && (
          <label className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white rounded-full cursor-pointer hover:bg-neutral-700 transition shadow-lg">
            <FileImage size={16} />
            <span className="text-xs font-medium">Sticker</span>
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleCustomStickerUpload} />
          </label>
        )}

        {/* Text */}
        {mediaMode !== "video" && (
          <button onClick={handleAddText} className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white rounded-full hover:bg-neutral-700 transition shadow-lg">
            <Type size={16} />
            <span className="text-xs font-medium">Text</span>
          </button>
        )}

        {/* Delete */}
        {mediaMode !== "video" && (
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-900/50 text-red-400 hover:bg-red-900/80 rounded-full transition shadow-lg">
            <Trash2 size={16} />
            <span className="text-xs font-medium">Remove</span>
          </button>
        )}
      </div>

      {/*
        ── Canvas / Video Preview ──
        Strategy: the inner wrapper is always CANVAS_W × CANVAS_H in real pixels.
        We CSS-scale it down with transform-origin "top center" so it visually
        fits the screen. The outer div has explicit height = scaledH so it
        correctly occupies space in the flex column (transform doesn't affect flow).
      */}
      <div style={{ width: scaledW, height: scaledH }} className="relative flex-shrink-0">
        {/* Inner wrapper — true canvas size, scaled down visually */}
        <div
          ref={wrapperRef}
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transformOrigin: "top left",
            transform: `scale(${canvasScale})`,
          }}
          className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-neutral-800 ring-4 ring-black"
        >
          {/* Fabric canvas — always mounted, hidden in video mode */}
          <canvas
            ref={canvasRef}
            className={mediaMode === "video" ? "hidden" : "block"}
          />

          {/* Video panel — always in DOM so videoRef is always valid */}
          <div
            className="absolute inset-0 bg-black flex items-center justify-center"
            style={{ display: mediaMode === "video" ? "flex" : "none" }}
          >
            <video
              ref={videoRef}
              style={{ width: CANVAS_W, height: CANVAS_H, objectFit: "contain", display: "block" }}
              controls
              playsInline
              loop
              preload="auto"
              onLoadedMetadata={handleVideoMetadataLoaded}
              onError={(e) => console.error("Video load error", e)}
            />

            {/* Empty state */}
            {!videoObjectUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-neutral-500 pointer-events-none">
                <Video size={64} />
                <p className="text-sm">Select a video to preview</p>
              </div>
            )}

            {/* Loading overlay */}
            {videoObjectUrl && !videoReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-3 pointer-events-none">
                <Film size={48} className="animate-pulse text-pink-400" />
                <p className="text-sm text-neutral-300">Loading preview…</p>
              </div>
            )}

            {/* Duration badge */}
            {videoReady && videoRef.current && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-mono px-2 py-1 rounded-full pointer-events-none">
                {formatDuration(videoRef.current.duration)}
              </div>
            )}
          </div>

          {/* Drag-to-delete zone */}
          {mediaMode !== "video" && isDragging && (
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-full transition-all duration-200 pointer-events-none shadow-2xl ${isHoveringTrash ? "bg-red-600 scale-125" : "bg-black/70 backdrop-blur-md scale-100"}`}>
              <Trash2 size={28} className={`transition-colors ${isHoveringTrash ? "text-white" : "text-neutral-400"}`} />
            </div>
          )}
        </div>
      </div>

      {/* ── Caption ── */}
      <div className="mt-4 w-full max-w-sm">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption…"
          maxLength={200}
          className="w-full bg-neutral-800 text-white text-sm placeholder-neutral-500 px-4 py-2.5 rounded-full border border-neutral-700 focus:outline-none focus:border-pink-500 transition"
        />
      </div>

      {/* ── Publish button ── */}
      <button
        onClick={handlePublish}
        disabled={isPublishing}
        className={`mt-4 flex items-center gap-2 px-7 py-3 text-white rounded-full transition-transform shadow-lg font-bold text-base ${
          isPublishing
            ? "bg-neutral-600 cursor-not-allowed opacity-70"
            : "bg-gradient-to-r from-pink-500 to-orange-500 hover:scale-105 active:scale-95"
        }`}
      >
        <UploadCloud size={20} className={isPublishing ? "animate-bounce" : ""} />
        {isPublishing ? "Publishing…" : "Publish Story"}
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}
