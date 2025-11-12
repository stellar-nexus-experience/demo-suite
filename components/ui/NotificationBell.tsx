'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from '@/contexts/auth/AccountContext';
import { notificationService, Notification } from '@/lib/services/notification-service';
import { useRouter } from 'next/navigation';

export const NotificationBell: React.FC = () => {
  const { account } = useAccount();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Client-side only mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Subscribe to notifications (only on client)
  useEffect(() => {
    if (!account || !isMounted) return;

    const unsubscribe = notificationService.subscribeToUserNotifications(
      account.id,
      (newNotifications) => {
        setNotifications(newNotifications);
        const unread = newNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      },
      20
    );

    return () => unsubscribe();
  }, [account, isMounted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!account) return;
    
    try {
      await notificationService.markAllAsRead(account.id);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.challengeId) {
      // Navigate to game with challenge
      if (notification.data.gameId) {
        router.push(`/mini-games/${notification.data.gameId}`);
      }
    }
    // ✅ AÑADIDO: Navegación para Logros
     else if (notification.type === 'demo_completed' || notification.type === 'quest_completed') {
      
       //router.push('/profile/rewards') //eso es una ruta que se podria crear gorro
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'challenge_received':
        return '🎯';
      case 'challenge_accepted':
        return '✅';
      case 'challenge_completed':
        return '🏁';
      case 'challenge_won':
        return '🎉';
      case 'challenge_lost':
        return '😔';
      case 'challenge_expired':
        return '⏰';
       // ✅ AÑADIDO: Notificación de Demostración/Misión
      case 'demo_completed':
      case 'quest_completed':
        return '🎖️'; // O '🏆' o '';  
      default:
        return '🔔';
     
      
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'challenge_received':
        return 'from-cyan-500/20 to-blue-500/20 border-cyan-400/30';
      case 'challenge_accepted':
        return 'from-green-500/20 to-emerald-500/20 border-green-400/30';
      case 'challenge_completed':
        return 'from-purple-500/20 to-pink-500/20 border-purple-400/30';
      case 'challenge_won':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30';
      case 'challenge_lost':
        return 'from-red-500/20 to-pink-500/20 border-red-400/30';
      case 'challenge_expired':
        return 'from-gray-500/20 to-slate-500/20 border-gray-400/30';
      // ✅ AÑADIDO: Notificación de Demostración/Misión
      case 'demo_completed':
      case 'quest_completed':
        return 'from-yellow-600/20 to-purple-600/20 border-yellow-500/30'  
      default:
        return 'from-white/5 to-white/10 border-white/20';
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    const now = new Date();
    const notificationDate = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!account || !isMounted) return null;

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200'
        aria-label='Notifications'
      >
        <svg
          className='w-6 h-6 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className='absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-gradient-to-br from-slate-900/98 via-purple-900/98 to-slate-900/98 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col'>
          {/* Header */}
          <div className='bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-purple-500/30 p-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-white font-bold text-lg'>🔔 Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-xs text-cyan-400 hover:text-cyan-300 transition-colors'
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className='flex-1 overflow-y-auto p-2'>
            {notifications.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-white/60'>
                <div className='text-6xl mb-4'>🔕</div>
                <p className='text-sm'>No notifications yet</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                      notification.read
                        ? 'bg-white/5 border-white/10 opacity-60'
                        : `bg-gradient-to-br ${getNotificationColor(notification.type)}`
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      {/* Icon */}
                      <div className='text-2xl flex-shrink-0'>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between gap-2 mb-1'>
                          <h4 className='text-white font-semibold text-sm'>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className='w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1 animate-pulse' />
                          )}
                        </div>
                        <p className='text-white/80 text-xs mb-2 break-words'>
                          {notification.message}
                        </p>
                        
                        <div className='flex items-center gap-2 flex-wrap'>
                        {notification.data?.pointsAmount && (
                          <div className='inline-flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded'>
                            💰 {notification.data.pointsAmount} points
                          </div>
                        )}
                        {/* Mostrar XP Ganado (NUEVO) */}
                        {notification.data?.xpEarned && (
                          <div className='inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-1 rounded'>
                            ✨ {notification.data.xpEarned} XP
                          </div>
                        )}
                        {/* Mostrar Insignia Ganada (NUEVO) */}
                        {notification.data?.badgeName && (


                           <div className='inline-flex items-center gap-1 text-xs font-semibold text-purple-400 bg-purple-500/20 px-2 py-1 rounded'>
                            🏅 {notification.data.badgeName}
                            </div>
                        )}
                        </div>

                        <div className='text-white/40 text-xs mt-2'>
                          {formatTimeAgo(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className='border-t border-purple-500/30 p-3 text-center'>
              <p className='text-xs text-white/60'>
                Showing {notifications.length} most recent notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

