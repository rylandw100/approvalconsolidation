"use client"

import Image from "next/image"
import { SearchBar } from "./SearchBar"
import { ProfileDropdown } from "./ProfileDropdown"
import { Sparkles } from "lucide-react"

interface TopNavBarProps {
  companyName: string
  userInitial: string
  adminMode: boolean
  currentMode: 'light' | 'dark'
  searchPlaceholder?: string
  onAdminModeToggle: () => void
  showNotificationBadge?: boolean
  notificationCount?: number
  onAIClick?: () => void
}

export function TopNavBar({
  companyName,
  userInitial,
  adminMode,
  currentMode,
  searchPlaceholder,
  onAdminModeToggle,
  showNotificationBadge = false,
  notificationCount = 0,
  onAIClick,
}: TopNavBarProps) {
  return (
    <nav 
      className={`fixed top-0 left-0 right-0 h-14 flex items-center px-0 z-50 transition-colors ${
        adminMode 
          ? 'bg-[#4A0039]' 
          : 'bg-card border-b border-border'
      }`}
      style={{ gap: '20px' }}
    >
      {/* Left Section - Logo */}
      <div className="flex items-center w-[266px]">
        <div className="flex items-center gap-4 h-14 px-4 flex-1">
          <Image
            src={adminMode || currentMode === 'dark' ? '/rippling-logo-white.svg' : '/rippling-logo-black.svg'}
            alt="Rippling"
            width={127}
            height={24}
            className="cursor-pointer p-2 -m-2 rounded-lg transition-colors hover:bg-muted active:bg-muted/80"
          />
        </div>
        <div 
          className={`w-px h-6 ${
            adminMode 
              ? 'bg-white opacity-30' 
              : 'bg-foreground opacity-20'
          }`}
        />
      </div>

      {/* Right Section - Search and Actions */}
      <div className="flex-1 flex items-center justify-between h-full">
        <SearchBar 
          placeholder={searchPlaceholder} 
          adminMode={adminMode} 
        />

        <div className="flex items-center px-4">
          <div className={`flex items-center gap-2 ${
            adminMode ? 'text-white' : 'text-foreground'
          }`}>
            {onAIClick && (
              <button
                onClick={onAIClick}
                className={`p-2 rounded-lg transition-colors ${
                  adminMode 
                    ? 'hover:bg-white/10 active:bg-white/20' 
                    : 'hover:bg-muted active:bg-muted/80'
                }`}
                title="AI Assistant"
              >
                <Sparkles className={`h-5 w-5 ${
                  adminMode ? 'text-white' : 'text-foreground'
                }`} />
              </button>
            )}
            {showNotificationBadge && notificationCount > 0 && (
              <button
                className={`relative p-2 rounded-lg transition-colors ${
                  adminMode 
                    ? 'hover:bg-white/10 active:bg-white/20' 
                    : 'hover:bg-muted active:bg-muted/80'
                }`}
                title="Notifications"
              >
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                  adminMode 
                    ? 'bg-white text-[#4A0039]' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </div>
              </button>
            )}
            <div className="w-px h-6 mx-2 opacity-20" style={{ 
              backgroundColor: adminMode ? 'white' : 'currentColor' 
            }} />
            <ProfileDropdown
              companyName={companyName}
              userInitial={userInitial}
              adminMode={adminMode}
              currentMode={currentMode}
              onAdminModeToggle={onAdminModeToggle}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}

