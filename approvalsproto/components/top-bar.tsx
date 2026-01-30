import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, Settings, HelpCircle, Sparkles, ChevronDown } from "lucide-react"

interface TopBarProps {
  onAIClick?: () => void
}

function LogoIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.64605 4.43636C2.64605 2.67636 1.72371 1.22182 0 0H4.00687C5.41306 1.04727 6.27491 2.64727 6.27491 4.43636C6.27491 6.22546 5.41306 7.82546 4.00687 8.87273C5.30722 9.39636 6.04811 10.6764 6.04811 12.5091V16H2.41924V12.5091C2.41924 10.7636 1.55739 9.54182 0 8.87273C1.72371 7.65091 2.64605 6.19636 2.64605 4.43636ZM10.5086 4.43636C10.5086 2.67636 9.58625 1.22182 7.86254 0H11.8694C13.2756 1.04727 14.1375 2.64727 14.1375 4.43636C14.1375 6.22546 13.2756 7.82546 11.8694 8.87273C13.1698 9.39636 13.9107 10.6764 13.9107 12.5091V16H10.2818V12.5091C10.2818 10.7636 9.41993 9.54182 7.86254 8.87273C9.58625 7.65091 10.5086 6.19636 10.5086 4.43636ZM18.3711 4.43636C18.3711 2.67636 17.4488 1.22182 15.7251 0H19.732C21.1381 1.04727 22 2.64727 22 4.43636C22 6.22546 21.1381 7.82546 19.732 8.87273C21.0323 9.39636 21.7732 10.6764 21.7732 12.5091V16H18.1443V12.5091C18.1443 10.7636 17.2825 9.54182 15.7251 8.87273C17.4488 7.65091 18.3711 6.19636 18.3711 4.43636Z" fill="black"/>
    </svg>
  )
}

function VerticalDivider() {
  return (
    <div className="flex h-[24px] items-center justify-center relative shrink-0 w-px">
      <div className="flex-none rotate-[90deg]">
        <div className="bg-foreground h-px opacity-20 w-[24px]" />
      </div>
    </div>
  )
}

export function TopBar({ onAIClick }: TopBarProps) {
  return (
    <div className="bg-card border-b border-border h-[56px] flex items-center pr-5">
      <div className="flex items-center flex-shrink-0 ml-[56px]">
        <div className="flex items-center justify-center h-[56px] w-[56px]">
          <Button variant="ghost" size="icon" className="h-10 w-10 rippling-btn-ghost">
            <LogoIcon />
          </Button>
        </div>
        <VerticalDivider />
        <div className="flex items-center justify-between h-8 px-2.5 py-0 rounded-md" style={{ width: '225px' }}>
          <span className="rippling-text-base text-foreground font-medium text-left">Tools</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <VerticalDivider />
      </div>
      
      <div className="flex items-center justify-center flex-1 h-full">
        <div className="bg-muted relative w-[600px] rounded-lg flex items-center" style={{ height: '40px', paddingLeft: '12px', paddingRight: '12px' }}>
          <Search className="h-4 w-4 text-muted-foreground" style={{ marginRight: '8px' }} />
          <Input 
            placeholder="Search..."
            className="rippling-input border-0 bg-transparent placeholder:text-muted-foreground h-full flex-1"
            style={{ fontSize: '14px', paddingLeft: '0' }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 pr-4 ml-auto">
          <Button variant="ghost" size="icon" className="rippling-btn-ghost h-10 w-10" onClick={onAIClick}>
            <Sparkles className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rippling-btn-ghost h-10 w-10">
            <Bell className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rippling-btn-ghost h-10 w-10">
            <Settings className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="rippling-btn-ghost h-10 w-10">
            <HelpCircle className="h-6 w-6" />
          </Button>
          
          <div className="h-px w-6 rotate-90 bg-primary opacity-20" />
          
          <div className="flex items-center gap-3 px-4 py-1">
            <span className="rippling-text-sm text-foreground font-medium">Acme, Inc.</span>
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: '#4A0039' }}>
              {/* Avatar placeholder */}
            </div>
          </div>
      </div>
    </div>
  )
}
