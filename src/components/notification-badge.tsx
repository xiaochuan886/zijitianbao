"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  type: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
};

export function NotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // 获取通知 - 在组件挂载时自动获取
  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载和定时刷新通知
  useEffect(() => {
    // 只在组件挂载时获取一次通知
    fetchNotifications();
    
    // 设置定时刷新 - 改为每5分钟获取一次最新通知
    const intervalId = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);
  
  // 当弹出窗口打开时，刷新通知
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // 标记通知为已读并导航到相关页面
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 标记为已读
      await markAsRead(notification.id);
      
      // 根据通知类型导航到相应页面
      if (notification.type === "withdrawal_request") {
        // 撤回请求的通知 - 导航到撤回请求列表
        router.push(`/withdrawal-requests`);
      } else if (notification.type === "withdrawal_approved") {
        // 已批准的撤回请求通知 - 导航到撤回请求列表
        router.push(`/withdrawal-requests`);
      } else if (notification.type === "withdrawal_rejected") {
        // 已拒绝的撤回请求通知 - 导航到撤回请求列表
        router.push(`/withdrawal-requests`);
      } else if (notification.relatedId && notification.relatedType) {
        // 根据相关类型导航
        switch (notification.relatedType) {
          case "predict_record":
            router.push(`/funding/predict-v2?recordId=${notification.relatedId}`);
            break;
          case "actual_user_record":
            router.push(`/funding/actual-user?recordId=${notification.relatedId}`);
            break;
          case "actual_fin_record":
            router.push(`/funding/actual-fin?recordId=${notification.relatedId}`);
            break;
          case "audit_record":
            router.push(`/funding/audit?recordId=${notification.relatedId}`);
            break;
          case "withdrawal_request":
            router.push(`/withdrawal-requests`);
            break;
          default:
            // 默认不做导航
            console.log(`未知的相关记录类型: ${notification.relatedType}`);
            break;
        }
      } else {
        // 没有明确相关类型的通知，记录日志但不导航
        console.log("通知没有相关类型或ID:", notification);
      }
      
      // 关闭弹出窗口
      setOpen(false);
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

  // 标记通知为已读
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(
          notifications.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PUT",
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(
          notifications.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // 获取未读通知数量
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">通知</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              全部标为已读
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-[300px]">
              <Spinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex justify-center items-center h-[300px] text-muted-foreground">
              暂无通知
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer ${
                    !notification.isRead ? "bg-muted/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="font-medium text-sm">{notification.title}</h5>
                    {!notification.isRead && (
                      <Badge variant="default" className="text-[10px] h-5">
                        新
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 