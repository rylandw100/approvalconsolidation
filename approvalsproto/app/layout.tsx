import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

const baselGrotesk = localFont({
  src: [
    {
      path: "./fonts/Basel-Grotesk-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Basel-Grotesk-Book.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Basel-Grotesk-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Basel-Grotesk-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Basel-Grotesk-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/Basel-Grotesk-Medium-Italic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/Basel-Grotesk-Bold-Italic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-basel-grotesk",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Future Inbox",
  description: "A Next.js app with shadcn/ui and Tailwind CSS",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={baselGrotesk.className}>{children}</body>
    </html>
  )
}


