// nav-links.ts
import {
  Home,
  Mail,
  
  PlusSquare,
  GalleryHorizontalEnd,
  type LucideIcon,
} from "lucide-react"

type NavLinkItem = {
  icon: LucideIcon
  text: string
  to: string
}

export const navLinks: NavLinkItem[] = [
  {
    icon: Home,
    text: "Home",
    to: "/",
  },

  {
    icon: Mail,
    text: "Messages",
    to: "/messages",
  },
  {
    icon: PlusSquare,
    text: "New Post",
    to: "/new-post",
  },
]
export const footbarNavlinks: NavLinkItem[] = [
  {
    icon: Home,
    text: "Home",
    to: "/",
  },

  {
    icon: Mail,
    text: "Messages",
    to: "/messages",
  },
  {
    icon: GalleryHorizontalEnd,
    text: "Explore",
    to: "/explore",
  },
  {
    icon: PlusSquare,
    text: "New Post",
    to: "/new-post",
  },
]
