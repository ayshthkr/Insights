"use client"
import { Moon, Sun, MessageSquare } from "lucide-react"
import { useTheme } from "next-themes"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex justify-between items-center p-4 h-16">
      <div className="flex items-center gap-3">
        <div>
          <Link href={'/'} className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hover:underline decoration-teal-600">
            Insights
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SignedIn>
          <Link href={'/'}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-200 dark:hover:border-emerald-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </Link>
        </SignedIn>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <SignedOut>
          <SignInButton>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium px-4"
            >
              Sign Up
            </Button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  )
}
