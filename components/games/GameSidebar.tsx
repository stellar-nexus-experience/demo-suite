'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from '@/contexts/auth/AccountContext';
import { useToast } from '@/contexts/ui/ToastContext';
import {
  gameSocialService,
  GameMessage,
  Challenge,
  ChallengeTimeLimit,
} from '@/lib/services/game-social-service';
import { accountService } from '@/lib/services/account-service';
import { gameScoresService } from '@/lib/firebase/firebase-service';
import { GameScore } from '@/lib/firebase/firebase-types';

interface GameSidebarProps {
  gameId: string;
  gameTitle: string;
  currentScore?: number;
  currentLevel?: number;
}

type SidebarView = 'social' | 'milestones' | 'chat' | 'leaderboard';

const GameSidebar: React.FC<GameSidebarProps> = ({
  gameId,
  gameTitle,
  currentScore = 0,
  currentLevel = 1,
}) => {
  const { account } = useAccount();
  const { addToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<SidebarView>('chat');
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');
  const [newChallengeReward, setNewChallengeReward] = useState(1000);
  const [newChallengeScore, setNewChallengeScore] = useState(3000);
  const [newChallengeTimeLimit, setNewChallengeTimeLimit] =
    useState<ChallengeTimeLimit>('this_week');
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string | undefined>(undefined);
  const [targetUsername, setTargetUsername] = useState<string | undefined>(undefined);

  // Leaderboard state
  const [topScores, setTopScores] = useState<GameScore[]>([]);
  const [userBestScore, setUserBestScore] = useState<GameScore | null>(null);
  const [userRank, setUserRank] = useState<number>(0);
  const [gameStats, setGameStats] = useState<{
    totalPlays: number;
    uniquePlayers: number;
    averageScore: number;
    highestScore: number;
  }>({
    totalPlays: 0,
    uniquePlayers: 0,
    averageScore: 0,
    highestScore: 0,
  });

  // @ Mention functionality
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionPosition, setMentionPosition] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const challengeDescInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to game messages
  useEffect(() => {
    if (!isOpen || currentView !== 'chat') return;

    const unsubscribe = gameSocialService.subscribeToGameMessages(
      gameId,
      newMessages => {
        setMessages(newMessages);
        // Auto-scroll to bottom
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      50
    );

    return () => unsubscribe();
  }, [gameId, isOpen, currentView]);

  // Subscribe to milestones
  useEffect(() => {
    if (!isOpen || currentView !== 'milestones') return;

    const unsubscribe = gameSocialService.subscribeToOpenChallenges(gameId, newChallenges => {
      setChallenges(newChallenges);
    });

    return () => unsubscribe();
  }, [gameId, isOpen, currentView]);

  // Load active users
  useEffect(() => {
    if (!isOpen) return;

    const loadUsers = async () => {
      const users = await gameSocialService.getActiveUsers(20);
      setActiveUsers(users);
    };

    loadUsers();
  }, [isOpen]);

  // Load leaderboard data
  useEffect(() => {
    if (!isOpen || currentView !== 'leaderboard') return;

    const loadLeaderboard = async () => {
      try {
        // Load top scores
        const scores = await gameScoresService.getTopScores(gameId, 10);
        setTopScores(scores);

        // Load user's best score and rank if logged in
        if (account) {
          const bestScore = await gameScoresService.getUserBestScore(gameId, account.id);
          setUserBestScore(bestScore);

          if (bestScore) {
            const rank = await gameScoresService.getUserRank(gameId, account.id);
            setUserRank(rank);
          }
        }

        // Load game stats
        const stats = await gameScoresService.getGameStats(gameId);
        setGameStats(stats);
      } catch (error) {
        // Failed to load leaderboard
      }
    };

    loadLeaderboard();
  }, [isOpen, currentView, gameId, account]);

  // Search users when mention search changes
  useEffect(() => {
    const searchUsers = async () => {
      if (mentionSearch.length > 0) {
        const results = await gameSocialService.searchUsers(mentionSearch, 10);
        setMentionResults(results);
      } else {
        setMentionResults([]);
      }
    };

    if (showMentionDropdown) {
      searchUsers();
    }
  }, [mentionSearch, showMentionDropdown]);

  const handleChallengeDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewChallengeDesc(value);

    // Detect @ symbol
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && atIndex === value.length - 1) {
      // User just typed @
      setShowMentionDropdown(true);
      setMentionPosition(atIndex);
      setMentionSearch('');
    } else if (atIndex !== -1 && showMentionDropdown) {
      // User is typing after @
      const searchText = value.substring(atIndex + 1);
      if (searchText.includes(' ')) {
        // Space typed, close dropdown
        setShowMentionDropdown(false);
      } else {
        setMentionSearch(searchText);
      }
    } else if (!value.includes('@')) {
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMentionedUser = (user: any) => {
    // Set target user
    setTargetUserId(user.id);
    setTargetUsername(user.displayName);

    // Replace @search with @username in description
    const atIndex = newChallengeDesc.lastIndexOf('@');
    const beforeAt = newChallengeDesc.substring(0, atIndex);
    const newDesc = `${beforeAt}@${user.displayName} `;
    setNewChallengeDesc(newDesc);

    // Close dropdown
    setShowMentionDropdown(false);
    setMentionSearch('');

    // Focus back on input
    challengeDescInputRef.current?.focus();
  };

  const handleClearTargetUser = () => {
    setTargetUserId(undefined);
    setTargetUsername(undefined);
  };

  const handleSendMessage = async () => {
    if (!account || !newMessage.trim()) return;

    try {
      await gameSocialService.sendGameMessage(
        gameId,
        account.id,
        account.profile?.username || account.profile?.displayName || 'Anonymous',
        newMessage.trim()
      );

      setNewMessage('');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to send message',
        message: 'Please try again',
        duration: 3000,
      });
    }
  };

  const handleCreateChallenge = async () => {
    if (!account || !newChallengeDesc.trim()) return;

    const currentPoints = account.totalPoints || account.profile?.totalPoints || 0;

    if (currentPoints < newChallengeReward) {
      addToast({
        type: 'error',
        title: 'Insufficient Points',
        message: `You need ${newChallengeReward} points to create this milestone`,
        duration: 3000,
      });
      return;
    }

    try {
      // Deduct points from challenger
      await accountService.addExperienceAndPoints(account.id, 0, -newChallengeReward);

      const challengeResult = await gameSocialService.createChallenge(
        gameId,
        account.id,
        account.profile?.username || account.profile?.displayName || 'Anonymous',
        newChallengeDesc.trim(),
        `Reach ${newChallengeScore} points`,
        newChallengeReward,
        newChallengeTimeLimit,
        targetUserId,
        targetUsername,
        newChallengeScore
      );

      addToast({
        type: 'success',
        title: '🎯 Milestone Created!',
        message: `${newChallengeReward} points staked in escrow!`,
        duration: 3000,
      });

      setNewChallengeDesc('');
      setNewChallengeReward(1000);
      setNewChallengeScore(3000);
      setNewChallengeTimeLimit('this_week');
      setTargetUserId(undefined);
      setTargetUsername(undefined);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to create milestone',
        message: 'Please try again',
        duration: 3000,
      });
    }
  };

  const handleAcceptChallenge = async (challenge: Challenge) => {
    if (!account) return;

    try {
      await gameSocialService.acceptChallenge(
        challenge.id,
        account.id,
        account.profile?.username || account.profile?.displayName || 'Anonymous'
      );

      addToast({
        type: 'success',
        title: '✅ Milestone Accepted!',
        message: `Complete to earn ${challenge.pointsReward} points!`,
        duration: 3000,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to accept milestone',
        message: 'Please try again',
        duration: 3000,
      });
    }
  };

  const shareToTwitter = () => {
    const text = `Just played ${gameTitle}! 🎮\n\nScore: ${currentScore}\nLevel: ${currentLevel}\n\nTry it yourself at Trustless Work!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToDiscord = () => {
    const discordMessage = `🎮 **Gaming on Stellar Nexus!**\n\n**Game:** ${gameTitle}\n**Score:** ${currentScore}\n**Level:** ${currentLevel}\n\nJoin me and share your progress in 🎴|nexus-cards!\n${window.location.href}`;

    navigator.clipboard.writeText(discordMessage);
    addToast({
      type: 'success',
      title: '📋 Discord Message Copied!',
      message: 'Paste it in the 🎴|nexus-cards channel!',
      duration: 3000,
    });
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const copyShareLink = () => {
    const shareText = `Check out ${gameTitle}! I scored ${currentScore} points at level ${currentLevel}! 🎮`;
    navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
    addToast({
      type: 'success',
      title: 'Copied!',
      message: 'Share link copied to clipboard',
      duration: 2000,
    });
  };

  return (
    <>
      {/* Collapsed Sidebar Buttons */}
      {!isOpen && (
        <div
          className='fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2'
          style={{ zIndex: 10000 }}
        >
          <button
            onClick={() => {
              setCurrentView('leaderboard');
              setIsOpen(true);
            }}
            className='bg-gradient-to-l from-yellow-600 to-orange-700 hover:from-yellow-500 hover:to-orange-600 text-white p-3 rounded-l-xl shadow-xl transition-all duration-300 border-l-4 border-yellow-400 relative'
            title='Leaderboard (WIP - Beta)'
          >
            <span className='text-2xl'>🏆</span>
            <span className='absolute -top-1 -left-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-lg'>
              WIP
            </span>
          </button>

          <button
            onClick={() => {
              setCurrentView('chat');
              setIsOpen(true);
            }}
            className='bg-gradient-to-l from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white p-3 rounded-l-xl shadow-xl transition-all duration-300 border-l-4 border-green-400'
            title='Chat'
          >
            <span className='text-2xl'>💬</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('social');
              setIsOpen(true);
            }}
            className='bg-gradient-to-l from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white p-3 rounded-l-xl shadow-xl transition-all duration-300 border-l-4 border-pink-400'
            title='Share'
          >
            <span className='text-2xl'>🔗</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('milestones');
              setIsOpen(true);
            }}
            className='bg-gradient-to-l from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white p-3 rounded-l-xl shadow-xl transition-all duration-300 border-l-4 border-cyan-400'
            title='Milestones'
          >
            <span className='text-2xl'>🎯</span>
          </button>
        </div>
      )}

      {/* Sidebar Panel */}
      {isOpen && (
        <div
          className='fixed right-0 top-0 h-screen w-80 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-sm border-l-2 border-purple-500/30 shadow-2xl overflow-hidden flex flex-col'
          style={{ height: '93vh', marginTop: '65px' }}
        >
          {/* Header */}
          <div className='bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-purple-500/30 p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-white font-bold text-lg flex items-center gap-2'>
                {currentView === 'leaderboard' && (
                  <>
                    <span>🏆 Games Leaderboard | Infinite Runner</span>
                    <span className='bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse'>
                      WIP
                    </span>
                  </>
                )}
                {currentView === 'chat' && '💬 Chat'}
                {currentView === 'social' && '🔗 Share'}
                {currentView === 'milestones' && '🎯 Milestones'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className='text-white/80 hover:text-white text-2xl transition-colors'
              >
                ✕
              </button>
            </div>

            {/* View Tabs */}
            <div className='grid grid-cols-4 gap-1 bg-black/30 p-1 rounded-lg'>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className={`py-2 text-xs rounded transition-all relative ${
                  currentView === 'leaderboard'
                    ? 'bg-yellow-600 text-white font-bold'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                🏆
                <span className='absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] font-bold px-1 rounded-full animate-pulse'>
                  WIP
                </span>
              </button>
              <button
                onClick={() => setCurrentView('chat')}
                className={`py-2 text-xs rounded transition-all ${
                  currentView === 'chat'
                    ? 'bg-green-600 text-white font-bold'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                💬
              </button>
              <button
                onClick={() => setCurrentView('social')}
                className={`py-2 text-xs rounded transition-all ${
                  currentView === 'social'
                    ? 'bg-pink-600 text-white font-bold'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                🔗
              </button>
              <button
                onClick={() => setCurrentView('milestones')}
                className={`py-2 text-xs rounded transition-all ${
                  currentView === 'milestones'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                🎯
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className='flex-1 overflow-y-auto p-4'>
            {/* LEADERBOARD VIEW */}
            {currentView === 'leaderboard' && (
              <div className='space-y-4'>
                {/* Beta/WIP Notice */}
                <div className='bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-3 border-2 border-orange-500/40 shadow-lg'>
                  <div className='flex items-start gap-2'>
                    <span className='text-2xl'>🚧</span>
                    <div className='flex-1'>
                      <div className='text-orange-300 font-bold text-sm mb-1'>
                        ⚠️ Work In Progress - Beta Version
                      </div>
                      <div className='text-white/80 text-xs leading-relaxed'>
                        The leaderboard feature is currently in beta testing. Some features may be
                        incomplete or under development. Thank you for your patience as we continue
                        to improve! 🚀
                      </div>
                    </div>
                  </div>
                </div>

                {/* Winner's Circle - Highlight the Champion */}
                {topScores.length > 0 && (
                  <div className='bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-xl p-4 border-2 border-yellow-400/60 shadow-lg'>
                    <div className='text-center mb-3'>
                      <div className='text-yellow-300 font-bold text-sm mb-2'>
                        👑 Current Champion
                      </div>
                    </div>
                    <div className='flex items-center justify-between bg-black/40 rounded-lg p-3 border border-yellow-400/40'>
                      <div className='flex-1'>
                        <div className='text-yellow-400 font-bold text-lg'>
                          {topScores[0].username}
                        </div>
                        <div className='text-white/60 text-xs'>Reigning Champion</div>
                      </div>
                      <div className='text-right'>
                        <div className='text-yellow-300 font-bold text-2xl'>
                          {topScores[0].score.toLocaleString()}
                        </div>
                        <div className='text-white/60 text-xs'>High Score</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simple Game Stats */}
                <div className='bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-4 border border-purple-500/30'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='text-center'>
                      <div className='text-purple-400 font-bold text-2xl'>
                        {gameStats.uniquePlayers}
                      </div>
                      <div className='text-white/60 text-xs'>Players</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-cyan-400 font-bold text-2xl'>
                        {gameStats.highestScore.toLocaleString()}
                      </div>
                      <div className='text-white/60 text-xs'>High Score</div>
                    </div>
                  </div>
                </div>

                {/* User's Best Score (if logged in and has played) */}
                {account && userBestScore && (
                  <div className='bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-3 border-2 border-purple-500/40 shadow-lg'>
                    <div className='text-center mb-2'>
                      <div className='text-purple-400 font-bold text-sm'>🎮 Your Best</div>
                    </div>
                    <div className='flex items-center justify-between bg-black/40 rounded-lg p-2 border border-purple-400/30'>
                      <div>
                        <div className='text-purple-300 text-xs'>Rank</div>
                        <div className='text-white font-bold text-xl'>#{userRank}</div>
                      </div>
                      <div className='text-right'>
                        <div className='text-purple-300 text-xs'>Best Score</div>
                        <div className='text-yellow-400 font-bold text-xl'>
                          {userBestScore.score.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top 10 Leaderboard */}
                <div>
                  <div className='text-white font-semibold text-sm mb-3 text-center'>
                    <span className='text-lg'>🏆 Top 10 Players</span>
                  </div>

                  <div className='space-y-2'>
                    {topScores.length === 0 && (
                      <div className='text-white/40 text-xs text-center py-8 bg-white/5 rounded-lg border border-white/10'>
                        <div className='text-4xl mb-2'>🎮</div>
                        No scores yet. Be the first to set a record!
                      </div>
                    )}

                    {topScores.map((scoreEntry, index) => (
                      <div
                        key={scoreEntry.id}
                        className={`rounded-lg p-2.5 border transition-all ${
                          scoreEntry.userId === account?.id
                            ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-purple-400/50 shadow-lg'
                            : 'bg-gradient-to-br from-white/5 to-white/10 border-white/10 hover:border-yellow-400/30'
                        }`}
                      >
                        <div className='flex items-center justify-between gap-2'>
                          {/* Rank Badge */}
                          <div
                            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              index === 0
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg'
                                : index === 1
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-lg'
                                  : index === 2
                                    ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black shadow-lg'
                                    : 'bg-white/20 text-white'
                            }`}
                          >
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && `#${index + 1}`}
                          </div>

                          {/* Player Name */}
                          <div className='flex-1 min-w-0'>
                            <div className='text-white font-semibold text-sm truncate flex items-center gap-1'>
                              {scoreEntry.username}
                              {scoreEntry.userId === account?.id && (
                                <span className='text-purple-400 text-xs'>(You)</span>
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <div className='text-right flex-shrink-0'>
                            <div className='text-yellow-400 font-bold text-base'>
                              {scoreEntry.score.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                {!account && (
                  <div className='bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 text-center'>
                    <span className='text-yellow-300 text-xs'>
                      🔒 Connect wallet to track your scores
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CHAT VIEW */}
            {currentView === 'chat' && (
              <div className='flex flex-col h-full'>
                {account && (
                  <div className='bg-gradient-to-br from-green-600/20 to-cyan-600/20 rounded-lg p-3 border border-green-400/30 mb-3'>
                    <div className='text-white font-semibold text-xs mb-2'>Send Message</div>
                    <div className='flex gap-2'>
                      <input
                        type='text'
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder='Type your message...'
                        className='flex-1 p-2 bg-black/30 text-white text-xs rounded border border-white/20'
                        maxLength={200}
                      />
                      <button
                        onClick={handleSendMessage}
                        className='px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded transition-all'
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {!account && (
                  <div className='bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 text-center mb-3'>
                    <span className='text-yellow-300 text-xs'>🔒 Connect wallet to chat</span>
                  </div>
                )}

                <div className='text-white/60 text-xs mb-2'>Game Chat:</div>

                <div className='flex-1 space-y-2 overflow-y-auto bg-black/20 rounded-lg p-3 border border-white/10'>
                  {messages.length === 0 && (
                    <div className='text-white/40 text-xs text-center py-8'>
                      No messages yet. Start the conversation!
                    </div>
                  )}

                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-lg ${
                        msg.userId === account?.id
                          ? 'bg-purple-600/30 border border-purple-400/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <div className='text-cyan-300 font-semibold text-xs truncate'>
                            {msg.username}
                          </div>
                          <div className='text-white text-xs mt-1 break-words'>{msg.message}</div>
                        </div>
                        {msg.type === 'achievement' && (
                          <span className='text-yellow-400 text-xs'>🏆</span>
                        )}
                      </div>
                      <div className='text-white/40 text-xs mt-1'>
                        {msg.createdAt
                          ?.toDate()
                          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}

            {/* SOCIAL SHARE VIEW */}
            {currentView === 'social' && (
              <div className='space-y-4'>
                {/* Epic Stats Card - Current Session */}
                <div className='bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-xl p-4 border-2 border-pink-500/40 shadow-lg'>
                  <div className='text-center mb-3'>
                    <div className='text-yellow-400 font-bold text-lg mb-1'>
                      🏆 Epic Achievement!
                    </div>
                    <div className='text-white/80 text-xs'>Show off your gaming skills</div>
                    <div className='text-cyan-300 text-xs mt-1'>📊 Current Session Stats</div>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='bg-black/30 rounded-lg p-3 border border-white/20'>
                      <div className='text-cyan-400 text-xs mb-1'>Current Score</div>
                      <div className='text-white font-bold text-2xl'>
                        {currentScore.toLocaleString()}
                      </div>
                      <div className='text-white/50 text-xs mt-1'>This Session</div>
                    </div>
                    <div className='bg-black/30 rounded-lg p-3 border border-white/20'>
                      <div className='text-purple-400 text-xs mb-1'>Level</div>
                      <div className='text-white font-bold text-2xl'>{currentLevel}</div>
                      <div className='text-white/50 text-xs mt-1'>Current</div>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className='bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-3 border border-yellow-500/30'>
                  <div className='text-yellow-300 text-xs text-center font-semibold'>
                    ✨ Share your progress and inspire others to join the Stellar Nexus! ✨
                  </div>
                </div>

                <div className='text-white font-semibold text-sm mb-1'>Choose your platform:</div>

                {/* Social Buttons Grid */}
                <div className='space-y-2'>
                  <button
                    onClick={shareToTwitter}
                    className='w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 transform hover:scale-105'
                  >
                    <span className='text-xl'>🐦</span>
                    <span>Share on Twitter/X</span>
                  </button>

                  <button
                    onClick={shareToLinkedIn}
                    className='w-full p-3 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-700/50 transform hover:scale-105'
                  >
                    <span className='text-xl'>💼</span>
                    <span>Share on LinkedIn</span>
                  </button>

                  <button
                    onClick={shareToDiscord}
                    className='w-full p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105'
                  >
                    <span className='text-xl'>💬</span>
                    <span>Copy for Discord 🎴|nexus-cards</span>
                  </button>

                  <button
                    onClick={copyShareLink}
                    className='w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-500/50 transform hover:scale-105'
                  >
                    <span className='text-xl'>📋</span>
                    <span>Copy Share Link</span>
                  </button>
                </div>

                {/* Pro Tip */}
                <div className='bg-gradient-to-br from-cyan-600/10 to-blue-600/10 rounded-lg p-3 border border-cyan-500/20 mt-4'>
                  <div className='flex items-start gap-2'>
                    <span className='text-cyan-400 text-lg'>💡</span>
                    <div className='flex-1'>
                      <div className='text-cyan-300 text-xs font-semibold mb-1'>Pro Tip:</div>
                      <div className='text-white/70 text-xs'>
                        Share your achievements regularly to build your reputation in the community
                        and attract challengers for bigger milestone rewards!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MILESTONES VIEW */}
            {currentView === 'milestones' && (
              <div className='space-y-3'>
                {/* Trustless Work Info */}
                <div className='bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-lg p-3 border border-purple-400/20'>
                  <div className='text-white/90 text-xs leading-relaxed'>
                    <span className='text-cyan-400 font-semibold'>💡 Trustless Milestones:</span>{' '}
                    Lock points in escrow, set a score goal, and challenge others! When completed,
                    points transfer automatically. ⚡
                  </div>
                </div>

                {account && (
                  <div className='bg-gradient-to-br from-cyan-600/20 to-purple-600/20 rounded-lg p-3 border border-cyan-400/30'>
                    <div className='text-white font-semibold text-sm mb-2'>🎯 Create Milestone</div>

                    {/* Milestone Description with @ Mention */}
                    <div className='relative mb-2'>
                      <input
                        ref={challengeDescInputRef}
                        type='text'
                        value={newChallengeDesc}
                        onChange={handleChallengeDescChange}
                        placeholder='Milestone goal... (use @ to challenge someone)'
                        className='w-full p-2 bg-black/30 text-white text-xs rounded border border-white/20'
                        maxLength={100}
                      />

                      {/* @ Mention Dropdown */}
                      {showMentionDropdown && (
                        <div className='absolute z-50 w-full mt-1 bg-slate-800 border border-cyan-400/30 rounded-lg shadow-xl max-h-48 overflow-y-auto'>
                          {mentionResults.length > 0 ? (
                            mentionResults.map(user => (
                              <button
                                key={user.id}
                                onClick={() => handleSelectMentionedUser(user)}
                                className='w-full text-left px-3 py-2 hover:bg-cyan-500/20 border-b border-white/10 last:border-b-0 transition-colors'
                              >
                                <div className='flex items-center justify-between'>
                                  <div>
                                    <div className='text-white text-xs font-semibold'>
                                      {user.displayName}
                                    </div>
                                    <div className='text-white/60 text-xs'>
                                      @{user.username} • Lvl {user.level}
                                    </div>
                                  </div>
                                  <div className='text-green-400 text-xs'>{user.points} pts</div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className='px-3 py-2 text-white/60 text-xs text-center'>
                              {mentionSearch ? 'No users found' : 'Start typing to search...'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Show Selected Target User */}
                    {targetUserId && targetUsername && (
                      <div className='mb-2 p-2 bg-cyan-500/20 border border-cyan-400/30 rounded flex items-center justify-between'>
                        <div className='text-xs'>
                          <span className='text-white/60'>Milestone for: </span>
                          <span className='text-cyan-300 font-semibold'>@{targetUsername}</span>
                        </div>
                        <button
                          onClick={handleClearTargetUser}
                          className='text-red-400 hover:text-red-300 text-xs'
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className='grid grid-cols-2 gap-2 mb-2'>
                      <div>
                        <label className='text-white/60 text-xs'>🎯 Target Score:</label>
                        <input
                          type='number'
                          value={newChallengeScore}
                          onChange={e => setNewChallengeScore(Number(e.target.value))}
                          className='w-full p-2 bg-black/30 text-white text-xs rounded border border-white/20'
                          min={500}
                          max={10000}
                          step={500}
                        />
                      </div>
                      <div>
                        <label className='text-white/60 text-xs'>💰 Reward (Escrow):</label>
                        <input
                          type='number'
                          value={newChallengeReward}
                          onChange={e => setNewChallengeReward(Number(e.target.value))}
                          className='w-full p-2 bg-black/30 text-white text-xs rounded border border-white/20'
                          min={100}
                          max={5000}
                          step={100}
                        />
                      </div>
                    </div>

                    {/* Time Limit Selector */}
                    <div className='mb-2'>
                      <label className='text-white/60 text-xs mb-1 block'>⏰ Time Limit:</label>
                      <select
                        value={newChallengeTimeLimit}
                        onChange={e =>
                          setNewChallengeTimeLimit(e.target.value as ChallengeTimeLimit)
                        }
                        className='w-full p-2 bg-black/30 text-white text-xs rounded border border-white/20'
                      >
                        <option value='today'>Today</option>
                        <option value='this_week'>This Week</option>
                        <option value='this_month'>This Month</option>
                      </select>
                    </div>

                    <button
                      onClick={handleCreateChallenge}
                      className='w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-xs rounded transition-all duration-200'
                    >
                      🎯 Create Milestone & Lock Points
                    </button>
                  </div>
                )}

                {!account && (
                  <div className='bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 text-center'>
                    <span className='text-yellow-300 text-xs'>
                      🔒 Connect wallet to create milestones
                    </span>
                  </div>
                )}

                <div className='text-white/60 text-xs mb-2'>📋 Active Milestones:</div>

                <div className='space-y-2 max-h-96 overflow-y-auto'>
                  {challenges.length === 0 && (
                    <div className='text-white/40 text-xs text-center py-8'>
                      No active milestones yet. Create the first trustless work milestone!
                    </div>
                  )}

                  {challenges.map(challenge => (
                    <div
                      key={challenge.id}
                      className='bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-3 border border-white/10 hover:border-cyan-400/30 transition-all'
                    >
                      {/* Milestone Header */}
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <div className='text-white font-semibold text-xs'>
                              {challenge.challengerName}
                            </div>
                            {challenge.targetUsername && (
                              <span className='text-cyan-400 text-xs'>
                                → @{challenge.targetUsername}
                              </span>
                            )}
                          </div>
                          <div className='text-white/70 text-xs'>{challenge.description}</div>
                        </div>
                        <div className='flex flex-col items-end gap-1'>
                          <div className='text-green-400 font-bold text-sm'>
                            💰 {challenge.pointsReward}
                          </div>
                          <div className='text-xs text-purple-400'>Escrowed</div>
                        </div>
                      </div>

                      {/* Milestone Details */}
                      <div className='flex items-center justify-between mb-2'>
                        <div className='text-cyan-300 text-xs'>🎯 {challenge.requirement}</div>
                        <div className='text-white/50 text-xs'>
                          ⏰{' '}
                          {challenge.timeLimit === 'today'
                            ? 'Today'
                            : challenge.timeLimit === 'this_week'
                              ? 'This Week'
                              : 'This Month'}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex items-center justify-between'>
                        {account && account.id !== challenge.challengerId && (
                          <button
                            onClick={() => handleAcceptChallenge(challenge)}
                            className='px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-xs font-bold rounded-lg transition-all'
                          >
                            ✅ Accept & Commit
                          </button>
                        )}
                        {account && account.id === challenge.challengerId && (
                          <div className='text-yellow-400 text-xs font-semibold'>
                            🔒 Your Milestone (Points Locked)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GameSidebar;
