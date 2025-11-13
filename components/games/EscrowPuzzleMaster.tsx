'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from '@/contexts/auth/AccountContext';
import { useToast } from '@/contexts/ui/ToastContext';
import { gameScoresService } from '@/lib/firebase/firebase-service';
import { accountService } from '@/lib/services/account-service';
import GameSidebar from './GameSidebar';
import Image from 'next/image';

// Game costs
const GAME_COSTS = {
  INITIAL: 150,
  REPLAY: 75,
} as const;

// Points rewards based on moves
const POINTS_REWARDS = {
  PERFECT: 500, // Less than 5 moves
  EXCELLENT: 350, // Less than 10 moves
  GOOD: 200, // Less than 15 moves
} as const;

interface Card {
  id: number;
  content: string;
  type: 'step' | 'description';
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

// Escrow mechanics steps for Trustless Work
const escrowSteps = [
  {
    id: 1,
    step: 'Initialize the Escrow Contract',
    description: 'Create and deploy the smart contract that will hold funds securely',
  },
  {
    id: 2,
    step: 'Fund the Escrow Contract',
    description: 'Deposit funds into the escrow contract to secure the transaction',
  },
  {
    id: 3,
    step: 'Create Milestones',
    description: 'Define work milestones that need to be completed for payment',
  },
  {
    id: 4,
    step: 'Complete Milestones',
    description: 'Freelancer completes and submits work for each milestone',
  },
  {
    id: 5,
    step: 'Client Approval',
    description: 'Client reviews and approves completed milestone work',
  },
  {
    id: 6,
    step: 'Automatic Fund Release',
    description: 'Funds are automatically released to freelancer upon approval',
  },
];

export default function EscrowPuzzleMaster() {
  const { account } = useAccount();
  const { addToast } = useToast();

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [achievements, setAchievements] = useState<string[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isReplay, setIsReplay] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [showPreview, setShowPreview] = useState(false); // Show all cards preview
  const [previewTimeLeft, setPreviewTimeLeft] = useState(5); // Preview countdown
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const gameId = 'escrow-puzzle-master';
  const gameTitle = 'Escrow Puzzle Master';

  // Initialize cards
  const initializeCards = useCallback(() => {
    const newCards: Card[] = [];
    let cardId = 0;

    // Create pairs: one step card and one description card for each escrow step
    escrowSteps.forEach((step) => {
      // Step card
      newCards.push({
        id: cardId++,
        content: step.step,
        type: 'step',
        pairId: step.id,
        isFlipped: false,
        isMatched: false,
      });

      // Description card
      newCards.push({
        id: cardId++,
        content: step.description,
        type: 'description',
        pairId: step.id,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }

    // Initially show all cards for preview
    const cardsWithPreview = newCards.map((card) => ({ ...card, isFlipped: true }));
    setCards(cardsWithPreview);
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('completed');
    }
  }, [timeLeft, gameState]);

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstId, secondId] = flippedCards;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Match found!
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === firstId || card.id === secondId
              ? { ...card, isMatched: true, isFlipped: true }
              : card
          )
        );
        setMatchedPairs((prev) => prev + 1);
        setScore((prev) => prev + 10);
        setFlippedCards([]);

        // Check for achievements
        const newMatchedPairs = matchedPairs + 1;
        if (newMatchedPairs === 3 && !achievements.includes('Halfway Hero')) {
          setAchievements([...achievements, 'Halfway Hero']);
        }
        if (newMatchedPairs === 6 && !achievements.includes('Escrow Master')) {
          setAchievements([...achievements, 'Escrow Master']);
        }

        // Check if game is complete
        if (newMatchedPairs === 6) {
          setTimeout(() => {
            setGameState('completed');
          }, 500);
        }
      } else {
        // No match - flip back after delay (increased time for better readability)
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              flippedCards.includes(card.id) ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedCards([]);
        }, 3000); // Increased from 1000ms to 3000ms (3 seconds) for better readability
      }
    }
  }, [flippedCards, cards, matchedPairs, achievements]);

  const startGame = async () => {
    // Check if user has account and enough points
    if (!account) {
      addToast({
        type: 'error',
        title: '🔒 Account Required',
        message: 'Please connect your wallet to play!',
        duration: 4000,
      });
      return;
    }

    const GAME_COST = isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL;
    const currentPoints = account.totalPoints || account.profile?.totalPoints || 0;
    
    if (currentPoints < GAME_COST) {
      addToast({
        type: 'error',
        title: '💰 Insufficient Points',
        message: `You need ${GAME_COST} points to play. You have ${currentPoints} points.`,
        duration: 5000,
      });
      return;
    }

    // Deduct points from account
    try {
      await accountService.addExperienceAndPoints(account.id, 0, -GAME_COST);
      
      addToast({
        type: 'success',
        title: isReplay ? '🔄 Playing Again!' : '🎮 Game Started!',
        message: `${GAME_COST} points deducted. ${isReplay ? 'Keep going!' : 'Good luck!'}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to deduct points:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not start game. Please try again.',
        duration: 4000,
      });
      return;
    }

    setGameState('playing');
    setTimeLeft(120);
    setScore(0);
    setMoves(0);
    setMatchedPairs(0);
    setFlippedCards([]);
    setAchievements([]);
    setScoreSaved(false);
    setPointsEarned(0);
    setXpEarned(0);
    setPreviewTimeLeft(5);
    // Note: isReplay will be set to true in resetGame() after completion
    initializeCards();
    
    // Show preview for 5 seconds
    setShowPreview(true);
    
    // Clear any existing interval
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
    }
    
    // Countdown timer for preview
    previewIntervalRef.current = setInterval(() => {
      setPreviewTimeLeft((prev) => {
        if (prev <= 1) {
          if (previewIntervalRef.current) {
            clearInterval(previewIntervalRef.current);
            previewIntervalRef.current = null;
          }
          setShowPreview(false);
          // Flip all cards back after preview
          setCards((prevCards) =>
            prevCards.map((card) => ({ ...card, isFlipped: false }))
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCardClick = (cardId: number) => {
    const card = cards.find((c) => c.id === cardId);

    // Don't allow clicking if:
    // - Card is already flipped or matched
    // - Two cards are already flipped (waiting for match check)
    // - Game is not in playing state
    if (
      !card ||
      card.isFlipped ||
      card.isMatched ||
      flippedCards.length >= 2 ||
      gameState !== 'playing'
    ) {
      return;
    }

    // Flip the card
    setCards((prevCards) =>
      prevCards.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    // Add to flipped cards
    if (flippedCards.length === 0) {
      setFlippedCards([cardId]);
    } else {
      setFlippedCards([flippedCards[0], cardId]);
      setMoves((prev) => prev + 1);
    }
  };

  const saveScoreToLeaderboard = async (finalScore: number) => {
    if (!account || scoreSaved) return;

    // finalScore is now the points earned (500, 350, 200, or 0)
    const pointsReward = finalScore;
    let xpReward = 0;
    const newAchievements = [...achievements];
    
    // Calculate XP based on points earned
    if (pointsReward === POINTS_REWARDS.PERFECT) {
      xpReward = 50; // Perfect performance
      if (!newAchievements.includes('Perfect Memory - 500 Points!')) {
        newAchievements.push('Perfect Memory - 500 Points!');
      }
    } else if (pointsReward === POINTS_REWARDS.EXCELLENT) {
      xpReward = 35; // Excellent performance
      if (!newAchievements.includes('Memory Expert - 350 Points!')) {
        newAchievements.push('Memory Expert - 350 Points!');
      }
    } else if (pointsReward === POINTS_REWARDS.GOOD) {
      xpReward = 20; // Good performance
      if (!newAchievements.includes('Quick Learner - 200 Points!')) {
        newAchievements.push('Quick Learner - 200 Points!');
      }
    }
    
    if (newAchievements.length > achievements.length) {
      setAchievements(newAchievements);
    }

    try {
      // Award points and XP
      if (pointsReward > 0) {
        await accountService.addExperienceAndPoints(account.id, xpReward, pointsReward);
        setPointsEarned(pointsReward);
        setXpEarned(xpReward);
      }

      // Submit score to leaderboard
      await gameScoresService.submitScore(
        gameId,
        account.id,
        account.profile?.displayName || account.profile?.username || 'Anonymous',
        finalScore,
        1,
        {
          pairsMatched: matchedPairs,
          moves: moves,
          timeRemaining: timeLeft,
          achievementsUnlocked: achievements.length,
          pointsEarned: pointsReward,
          xpEarned: xpReward,
        }
      );

      setScoreSaved(true);

      if (pointsReward > 0) {
        addToast({
          type: 'success',
          title: '🏆 Score Saved!',
          message: `Earned ${xpReward} XP and ${pointsReward} points!`,
          duration: 4000,
        });
      } else {
        addToast({
          type: 'success',
          title: '🏆 Score Saved!',
          message: `Your score of ${finalScore} has been recorded!`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to save score:', error);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save your score to the leaderboard.',
        duration: 3000,
      });
    }
  };

  const resetGame = () => {
    // Clear preview interval if running
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    
    setGameState('intro');
    setScore(0);
    setMoves(0);
    setMatchedPairs(0);
    setFlippedCards([]);
    setAchievements([]);
    setScoreSaved(false);
    setShowPreview(false);
    setPreviewTimeLeft(5);
    setCards([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
    };
  }, []);

  // Save score when game completes
  useEffect(() => {
    if (gameState === 'completed' && !scoreSaved && account) {
      // Calculate points earned based on performance
      let pointsReward = 0;
      if (matchedPairs === 6) {
        if (moves < 5) {
          pointsReward = POINTS_REWARDS.PERFECT; // 500
        } else if (moves < 10) {
          pointsReward = POINTS_REWARDS.EXCELLENT; // 350
        } else if (moves < 15) {
          pointsReward = POINTS_REWARDS.GOOD; // 200
        }
      }
      // Final score = points earned (0 if didn't complete all pairs)
      setScore(pointsReward);
      saveScoreToLeaderboard(pointsReward);
    }
  }, [gameState, scoreSaved, account, timeLeft, matchedPairs, moves]);

  if (gameState === 'intro') {
    return (
      <div className='relative w-full h-full flex flex-col items-center justify-center' style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Arcade Machine Border & Game Canvas */}
        <div className='relative w-full h-full flex items-center justify-center p-4'>
          {/* Arcade Machine Frame */}
          <div className='relative max-w-[1200px] w-full' style={{ minHeight: '700px', maxHeight: '90vh' }}>
            {/* Outer Frame - Wood texture */}
            <div 
              className='absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 rounded-3xl shadow-2xl' 
              style={{ 
                boxShadow: '0 0 0 8px #422006, 0 0 0 12px #78350f, inset 0 0 30px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.8)'
              }}
            >
            </div>
                  
            {/* CRT Screen Effect Border */}
            <div 
              className='absolute inset-6 rounded-lg overflow-hidden'
              style={{
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                border: '2px solid rgba(0,255,255,0.2)'
              }}
            >
              {/* Game Content */}
              <div className='relative w-full h-full flex flex-col bg-black overflow-y-auto p-6' style={{ minHeight: 'calc(100% - 48px)' }}>
                <div className='max-w-4xl mx-auto text-center w-full'>

                  {/* Game Description */}
                  <div className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8  mt-4'>
                    <h1 className='text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4'>
                      Escrow Puzzle Master
                    </h1>
                    <p className='text-lg text-white/80 leading-relaxed mb-6'>
                      Match escrow mechanics steps with their descriptions! Learn how Trustless Work escrow
                      contracts work by finding all 6 matching pairs. Test your memory and master the escrow
                      flow!
                    </p>

                    <div className='grid md:grid-cols-3 gap-6 mb-6'>
                      <div className='text-center p-4 bg-white/5 rounded-2xl'>
                        <div className='text-3xl mb-2'>🧩</div>
                        <h3 className='text-white font-semibold mb-2'>6 Pairs</h3>
                        <p className='text-white/60 text-sm'>Match all pairs</p>
                      </div>
                      <div className='text-center p-4 bg-white/5 rounded-2xl'>
                        <div className='text-3xl mb-2'>⏱️</div>
                        <h3 className='text-white font-semibold mb-2'>2 Minutes</h3>
                        <p className='text-white/60 text-sm'>Time challenge</p>
                      </div>
                      <div className='text-center p-4 bg-white/5 rounded-2xl'>
                        <div className='text-3xl mb-2'>💰</div>
                        <h3 className='text-white font-semibold mb-2'>
                          60 XLM + NFT Badge
                        </h3>
                        <p className='text-white/60 text-sm'>Rewards</p>
                      </div>
                    </div>

                    <div className='text-center'>
                      {/* Cost & Balance */}
                      <div className='bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl p-4 mb-4 border-2 border-purple-400/50'>
                        <div className='flex items-center justify-between'>
                          <div className='text-white/80 text-sm font-semibold'>💰 Cost:</div>
                          <div className='text-yellow-400 font-bold text-2xl'>
                            {isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL} Points
                          </div>
                        </div>
                        {account && (() => {
                          const currentPoints = account.totalPoints || account.profile?.totalPoints || 0;
                          const GAME_COST = isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL;
                          return (
                            <div className='flex items-center justify-between mt-2 pt-2 border-t border-white/20'>
                              <div className='text-white/80 text-sm'>Balance:</div>
                              <div className={`font-bold text-xl ${currentPoints >= GAME_COST ? 'text-green-400' : 'text-red-400'}`}>
                                {currentPoints} pts
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Start Button */}
                      <button
                        onClick={() => {
                          if (!account) {
                            addToast({
                              type: 'error',
                              title: '🔒 Account Required',
                              message: 'Please connect your wallet to play!',
                              duration: 4000,
                            });
                            return;
                          }
                          const currentPoints = account.totalPoints || account.profile?.totalPoints || 0;
                          const GAME_COST = isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL;
                          if (currentPoints < GAME_COST) {
                            addToast({
                              type: 'error',
                              title: '💰 Insufficient Points',
                              message: `You need ${GAME_COST} points to play. You have ${currentPoints} points.`,
                              duration: 5000,
                            });
                            return;
                          }
                          setShowStartConfirmation(true);
                        }}
                        disabled={!account || (account && (account.totalPoints || account.profile?.totalPoints || 0) < (isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL))}
                        className={`w-full px-12 py-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold text-2xl rounded-3xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/50 ${
                          !account || (account && (account.totalPoints || account.profile?.totalPoints || 0) < (isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL))
                            ? 'opacity-50 cursor-not-allowed animate-none'
                            : 'animate-pulse'
                        }`}
                      >
                        🚀 START GAME
                      </button>

                      {/* Warning Messages */}
                      {!account && (
                        <p className='text-yellow-300 text-xs mt-3'>
                          🔒 Connect wallet to play
                        </p>
                      )}
                      {account && (() => {
                        const currentPoints = account.totalPoints || account.profile?.totalPoints || 0;
                        const GAME_COST = isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL;
                        if (currentPoints < GAME_COST) {
                          return (
                            <p className='text-red-300 text-xs mt-3'>
                              💰 Need {GAME_COST - currentPoints} more points
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ventilation slots at bottom */}
            <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10'>
              {[...Array(8)].map((_, i) => (
                <div key={i} className='w-1 h-3 bg-gray-900 rounded-sm' />
              ))}
            </div>
          </div>
        </div>

        {/* Start Game Confirmation Modal */}
        {showStartConfirmation && (
          <div className='fixed inset-0 flex items-center justify-center z-[100] bg-black/50 backdrop-blur-sm'>
            <div className='bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 rounded-3xl border-2 border-cyan-400/50 p-8 max-w-md w-full mx-4 shadow-2xl'>
              <div className='text-center'>
                {/* Icon */}
                <div className='text-6xl mb-4'>🎮</div>
                
                {/* Title */}
                <h2 className='text-3xl font-bold text-white mb-4'>Start Game?</h2>
                
                {/* Points Cost Info */}
                <div className='bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-4 mb-6 border border-yellow-400/30'>
                  <div className='text-yellow-300 text-sm mb-2'>💰 Entry Cost</div>
                  <div className='text-white text-3xl font-bold mb-1'>
                    {isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL} Points
                  </div>
                  <div className='text-white/70 text-xs'>
                    Your current balance: {account?.totalPoints || account?.profile?.totalPoints || 0} points
                  </div>
                </div>

                {/* Description */}
                <p className='text-white/80 text-sm mb-6 leading-relaxed'>
                  Starting this game will deduct {isReplay ? GAME_COSTS.REPLAY : GAME_COSTS.INITIAL} points from your account. 
                  Match all pairs efficiently to earn up to 500 points and XP!
                </p>

                {/* Rewards Info */}
                <div className='bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-3 mb-6 border border-cyan-400/30'>
                  <div className='text-cyan-300 text-xs mb-2 font-semibold text-center'>🏆 Possible Rewards</div>
                  <div className='space-y-1 text-white/80 text-xs'>
                    <div>• Less than 5 moves: 500 points + 50 XP</div>
                    <div>• Less than 10 moves: 350 points + 35 XP</div>
                    <div>• Less than 15 moves: 200 points + 20 XP</div>
                  </div>
                </div>

                {/* Buttons */}
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    onClick={() => setShowStartConfirmation(false)}
                    className='px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowStartConfirmation(false);
                      startGame();
                    }}
                    className='px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105'
                  >
                    ✅ Confirm & Play
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className='relative w-full h-full flex flex-col items-center justify-center' style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Arcade Machine Border & Game Canvas */}
        <div className='relative w-full h-full flex items-center justify-center p-4'>
          {/* Arcade Machine Frame */}
          <div className='relative max-w-[1200px] w-full' style={{ minHeight: '700px', maxHeight: '90vh' }}>
            {/* Outer Frame - Wood texture */}
            <div 
              className='absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 rounded-3xl shadow-2xl' 
              style={{ 
                boxShadow: '0 0 0 8px #422006, 0 0 0 12px #78350f, inset 0 0 30px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.8)'
              }}
            >
            </div>
                  
            {/* CRT Screen Effect Border */}
            <div 
              className='absolute inset-6 rounded-lg overflow-hidden'
              style={{
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                border: '2px solid rgba(0,255,255,0.2)'
              }}
            >
              {/* Game Content */}
              <div className='relative w-full h-full flex flex-col bg-black overflow-y-auto p-6' style={{ minHeight: 'calc(100% - 48px)' }}>
                  {/* Game Header */}
                  <div className='text-center mb-6 w-full'>
                    <div className='flex justify-between items-center mb-4'>
                      <div className='text-left'>
                        <div className='text-white/60 text-sm'>Pairs Matched: {matchedPairs} / 6</div>
                        <div className='text-white/60 text-sm'>Moves: {moves}</div>
                      </div>
                      <div className='text-right'>
                        <div className='text-white/60 text-sm'>Score: {score}</div>
                        <div className='text-white/60 text-sm'>Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                      </div>
                    </div>

                    <h1 className='text-3xl md:text-4xl font-bold text-white mb-2'>
                      Match the Escrow Steps!
                    </h1>
                    <p className='text-white/80'>
                      Find matching pairs of steps and their descriptions
                    </p>
                  </div>

                  {/* Game Grid */}
                  <div className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-2 border-cyan-400/30 rounded-3xl p-6 mb-4 shadow-2xl w-full'>
                    {showPreview && (
                      <div className='text-center mb-4 text-cyan-300 font-semibold animate-pulse text-lg'>
                        👀 Memorize the cards! Game starts in {previewTimeLeft}s...
                      </div>
                    )}
                    <div className='grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'>
                      {cards.map((card) => {
                        const isFlipped = showPreview || card.isFlipped || card.isMatched;
                        const canInteract = !showPreview && !card.isMatched && flippedCards.length < 2;
                        
                        return (
                          <div
                            key={card.id}
                            className='relative aspect-square'
                            style={{ perspective: '1000px' }}
                          >
                            <div
                              className={`w-full h-full rounded-xl border-2 transition-all duration-500 ${
                                card.isMatched
                                  ? 'border-green-400 bg-green-500/20'
                                  : isFlipped
                                    ? 'border-cyan-400/50 bg-cyan-500/10'
                                    : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/10'
                              } ${canInteract && !card.isFlipped ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default'}`}
                              style={{
                                transformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                              }}
                            >
                              {/* Card Back (Lock Icon) */}
                              <div
                                className='absolute inset-0 flex items-center justify-center p-2 rounded-xl'
                                style={{
                                  backfaceVisibility: 'hidden',
                                  WebkitBackfaceVisibility: 'hidden',
                                  transform: 'rotateY(0deg)',
                                }}
                              >
                                <div className='text-2xl md:text-3xl'>
                                  <Image src='/images/logo/logoicon.png' alt='Lock' width={100} height={100} />
                                </div>
                              </div>
                              
                              {/* Card Front (Content) */}
                              <div
                                className='absolute inset-0 flex items-center justify-center p-2 rounded-xl'
                                style={{
                                  backfaceVisibility: 'hidden',
                                  WebkitBackfaceVisibility: 'hidden',
                                  transform: 'rotateY(180deg)',
                                }}
                              >
                                <div className='text-center w-full'>
                                  <div
                                    className={`text-[10px] mb-1 font-semibold ${
                                      card.type === 'step' ? 'text-cyan-300' : 'text-purple-300'
                                    }`}
                                  >
                                    {card.type === 'step' ? 'STEP' : 'DESC'}
                                  </div>
                                  <div className='text-white text-[11px] font-medium leading-tight px-1'>
                                    {card.content}
                                  </div>
                                  {card.isMatched && (
                                    <div className='text-green-400 text-lg mt-1'>✓</div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Clickable overlay for interaction */}
                              {canInteract && !card.isFlipped && (
                                <button
                                  onClick={() => handleCardClick(card.id)}
                                  className='absolute inset-0 w-full h-full rounded-xl'
                                  style={{ zIndex: 10 }}
                                  aria-label='Flip card'
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Achievements Display */}
                  {achievements.length > 0 && (
                    <div className='bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border border-yellow-400/30 rounded-2xl p-4 mb-4 w-full'>
                      <div className='text-yellow-300 font-semibold text-center'>
                        🏅 Achievement Unlocked: {achievements[achievements.length - 1]}!
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Ventilation slots at bottom */}
              <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10'>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className='w-1 h-3 bg-gray-900 rounded-sm' />
                ))}
              </div>
            </div>
        </div>
      </div>
    );
  }

  if (gameState === 'completed') {
    // Final score is the points earned (already calculated in useEffect)
    const finalScore = score; // This is now the points earned (500, 350, 200, or 0)

    return (
      <div className='relative w-full h-full flex flex-col items-center justify-center' style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Arcade Machine Border & Game Canvas */}
        <div className='relative w-full h-full flex items-center justify-center p-4'>
          {/* Arcade Machine Frame */}
          <div className='relative max-w-[1200px] w-full' style={{ minHeight: '700px', maxHeight: '90vh' }}>
            {/* Outer Frame - Wood texture */}
            <div 
              className='absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 rounded-3xl shadow-2xl' 
              style={{ 
                boxShadow: '0 0 0 8px #422006, 0 0 0 12px #78350f, inset 0 0 30px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.8)'
              }}
            >
            </div>
                  
            {/* CRT Screen Effect Border */}
            <div 
              className='absolute inset-6 rounded-lg overflow-hidden'
              style={{
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                border: '2px solid rgba(0,255,255,0.2)'
              }}
            >
              {/* Game Content */}
              <div className='relative w-full h-full flex flex-col bg-black overflow-y-auto p-6' style={{ minHeight: 'calc(100% - 48px)' }}>
                <div className='max-w-4xl mx-auto text-center w-full'>
                  {/* Game Results */}
                  <div className='mb-8'>
                    <h1 className='text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-4 mt-6'>
                      {matchedPairs === 6 ? 'Perfect Match!' : 'Time\'s Up!'}
                    </h1>
                    <h2 className='text-2xl md:text-3xl font-semibold text-white/90 mb-6'>
                      Final Score: {finalScore} Points <span className='text-white/40 text-sm'>({moves}) moves</span>
                    </h2>
                  </div>

                  {/* Score and Achievements */}
                  <div className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8'>
                    <div className='grid md:grid-cols-2 gap-8 mb-8'>
                      <div>
                        <h3 className='text-2xl font-bold text-white mb-4'>📊 Game Statistics</h3>
                        <div className='space-y-3'>
                          {pointsEarned > 0 && (
                            <>
                              <div className='flex justify-between items-center p-3 bg-green-500/20 rounded-xl border border-green-400/30'>
                                <span className='text-white/70'>Points Earned:</span>
                                <span className='text-green-400 font-semibold'>+{pointsEarned}</span>
                              </div>
                              <div className='flex justify-between items-center p-3 bg-cyan-500/20 rounded-xl border border-cyan-400/30'>
                                <span className='text-white/70'>XP Earned:</span>
                                <span className='text-cyan-400 font-semibold'>+{xpEarned}</span>
                              </div>
                            </>
                          )}
                          <div className='flex justify-between items-center p-3 bg-white/5 rounded-xl'>
                            <span className='text-white/70'>Pairs Matched:</span>
                            <span className='text-white font-semibold'>{matchedPairs} / 6</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className='text-2xl font-bold text-white mb-4'>🏅 Achievements</h3>
                        <div className='space-y-3'>
                          {achievements.length > 0 ? (
                            achievements.map((achievement, index) => (
                              <div
                                key={index}
                                className='p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30'
                              >
                                <div className='text-yellow-400 font-semibold'>⭐ {achievement}</div>
                              </div>
                            ))
                          ) : (
                            <div className='p-3 bg-white/5 rounded-xl border border-white/20'>
                              <div className='text-white/60'>No achievements unlocked yet</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='text-center'>
                      <button
                        onClick={resetGame}
                        className='px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 mr-4'
                      >
                        🎮 Play Again
                      </button>

                      <button
                        onClick={() => (window.location.href = '/mini-games')}
                        className='px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xl rounded-2xl border border-white/20 transition-all duration-300 transform hover:scale-105'
                      >
                        🏠 Back to Nexus Playground
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ventilation slots at bottom */}
            <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10'>
              {[...Array(8)].map((_, i) => (
                <div key={i} className='w-1 h-3 bg-gray-900 rounded-sm' />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GameSidebar gameId={gameId} gameTitle={gameTitle} currentScore={score} currentLevel={1} />
    </>
  );
}
