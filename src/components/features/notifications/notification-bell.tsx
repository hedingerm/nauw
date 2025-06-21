"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Badge } from "@/src/components/ui/badge"
import { createClient } from "@/src/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"

interface Notification {
  id: string
  type: string
  subject: string
  content: string
  sent_at: string
  read_at: string | null
}

export function NotificationBell({ businessId }: { businessId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    
    // Subscribe to new notifications
    const supabase = createClient()
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'Notification',
        filter: `business_id=eq.${businessId}`
      }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [businessId])

  async function loadNotifications() {
    const supabase = createClient()
    const { data } = await supabase
      .from('Notification')
      .select('*')
      .eq('business_id', businessId)
      .order('sent_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read_at).length)
    }
  }

  async function markAsRead(notificationId: string) {
    const supabase = createClient()
    await supabase
      .from('Notification')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    loadNotifications()
  }

  async function markAllAsRead() {
    const supabase = createClient()
    await supabase
      .from('Notification')
      .update({ read_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .is('read_at', null)

    loadNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'usage_warning':
        return '⚠️'
      case 'usage_critical':
        return '🚨'
      case 'payment_failed':
        return '❌'
      default:
        return '📢'
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Benachrichtigungen</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                markAllAsRead()
              }}
              className="text-xs"
            >
              Alle als gelesen markieren
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Keine Benachrichtigungen
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-3 cursor-pointer ${
                !notification.read_at ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                if (!notification.read_at) {
                  markAsRead(notification.id)
                }
              }}
            >
              <div className="flex gap-3 w-full">
                <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.sent_at), {
                      addSuffix: true,
                      locale: de
                    })}
                  </p>
                </div>
                {!notification.read_at && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}