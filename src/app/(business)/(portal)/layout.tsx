'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/src/lib/auth/context'
import { Button } from '@/src/components/ui/button'
import { 
  Calendar, 
  Users, 
  Briefcase, 
  Settings, 
  LayoutDashboard,
  Menu,
  X,
  Clock,
  Inbox,
  UserCircle,
  Palette,
  ChevronDown,
  ChevronRight,
  Building2,
  Wrench,
  CreditCard
} from 'lucide-react'
import { cn } from '@/src/lib/utils/cn'
import { BusinessService } from '@/src/lib/services/business.service'
import { NotificationBell } from '@/src/components/features/notifications/notification-bell'

interface NavItem {
  name: string
  href?: string
  icon?: any
  hideWhenAutoAccept?: boolean
  isGroup?: boolean
  isSeparator?: boolean
  children?: NavItem[]
}

const baseNavigation: NavItem[] = [
  // Main items (always visible)
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Posteingang', href: '/inbox', icon: Inbox, hideWhenAutoAccept: true },
  { name: 'Kalender', href: '/calendar', icon: Calendar },
  
  // Separator
  { name: 'separator-1', isSeparator: true },
  
  // Business group
  {
    name: 'Geschäft',
    icon: Building2,
    isGroup: true,
    children: [
      { name: 'Kunden', href: '/customers', icon: UserCircle },
      { name: 'Services', href: '/services', icon: Briefcase },
      { name: 'Mitarbeiter', href: '/employees', icon: Users },
      { name: 'Zeitpläne', href: '/schedules', icon: Clock },
    ]
  },
  
  // Configuration group
  {
    name: 'Konfiguration',
    icon: Wrench,
    isGroup: true,
    children: [
      { name: 'Buchungsseite', href: '/booking-design', icon: Palette },
      { name: 'Abrechnung', href: '/billing', icon: CreditCard },
      { name: 'Einstellungen', href: '/settings', icon: Settings },
    ]
  },
]

export default function BusinessPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [business, setBusiness] = useState<any>(null)
  const [navigation, setNavigation] = useState<NavItem[]>(baseNavigation)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Load expanded state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarExpandedGroups')
      return saved ? new Set(JSON.parse(saved)) : new Set(['Geschäft', 'Konfiguration'])
    }
    return new Set(['Geschäft', 'Konfiguration'])
  })

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
    // Save to localStorage
    localStorage.setItem('sidebarExpandedGroups', JSON.stringify(Array.from(newExpanded)))
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadBusiness = async () => {
      if (!user) return
      
      try {
        const businessData = await BusinessService.getCurrentBusiness()
        
        // If no business exists, redirect to onboarding
        if (!businessData && pathname !== '/onboarding') {
          router.push('/onboarding')
          return
        }
        
        setBusiness(businessData)
        
        // Filter navigation based on business settings
        const filterNavItems = (items: NavItem[]): NavItem[] => {
          return items.map(item => {
            if (item.isGroup && item.children) {
              // Recursively filter children
              return {
                ...item,
                children: filterNavItems(item.children)
              }
            }
            return item
          }).filter(item => {
            if (item.hideWhenAutoAccept) {
              // Hide inbox when automatic acceptance is enabled
              return !businessData?.acceptAppointmentsAutomatically
            }
            return true
          })
        }
        
        const filteredNavigation = filterNavItems(baseNavigation)
        setNavigation(filteredNavigation)
      } catch (error) {
        console.error('Error loading business:', error)
      }
    }
    
    loadBusiness()
  }, [user, pathname, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Wird geladen...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // During onboarding, show a simpler layout without sidebar
  if (pathname === '/onboarding') {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6">
          <h2 className="text-xl font-semibold">nauw Business</h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            if (item.isSeparator) {
              return (
                <div key={item.name} className="my-2 border-t border-gray-200" />
              )
            }
            
            if (item.isGroup) {
              const isExpanded = expandedGroups.has(item.name)
              const hasActiveChild = item.children?.some(child => 
                pathname === child.href || pathname.startsWith(child.href + '/')
              )
              
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs uppercase tracking-wider font-semibold transition-colors",
                      hasActiveChild
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  
                  {isExpanded && item.children && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => {
                        const isActive = pathname === child.href || pathname.startsWith(child.href + '/')
                        return (
                          <Link
                            key={child.name}
                            href={child.href!}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary border-l-2 border-primary"
                                : "text-gray-700 hover:bg-gray-100 border-l-2 border-transparent"
                            )}
                          >
                            {child.icon && <child.icon className="h-4 w-4" />}
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            
            // Regular item (not a group)
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
                )}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="border-t p-4">
          <div className="mb-3 px-3 flex items-center justify-between">
            <p className="text-sm font-medium">{user.email}</p>
            {business && <NotificationBell businessId={business.id} />}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut()}
          >
            Abmelden
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex h-16 items-center justify-between bg-white px-4 shadow lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">nauw Business</h1>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}