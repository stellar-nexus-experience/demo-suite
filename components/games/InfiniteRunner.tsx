'use client';

// React & Next.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Contexts & Services
import { useAccount } from '@/contexts/auth/AccountContext';
import { useToast } from '@/contexts/ui/ToastContext';
import { accountService } from '@/lib/services/account-service';
import { gameSocialService } from '@/lib/services/game-social-service';
import { gameScoresService } from '@/lib/firebase/firebase-service';

// Constants
import {
  GAME_PHYSICS,
  SPEED_CONFIGS,
  GAME_COSTS,
  THEMES,
  ANIMATION_CONFIG,
  AUDIO_CONFIG,
  SCORING_CONFIG,
  TIMING_CONFIG,
  OBSTACLE_CONFIG,
  COIN_CONFIG,
  POWER_UP_CONFIG,
  QUIZ_QUESTIONS,
  type SpeedMode,
  type ThemeType,
} from '@/utils/constants/games/infinite-runner';

// Components
import GameSidebar from './GameSidebar';

interface InfiniteRunnerProps {
  gameId: string;
  gameTitle: string;
  embedded?: boolean; // Whether game is embedded in another page
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cactus' | 'bird' | 'rock' | 'blockchain' | 'martian' | 'drone' | 'satellite' | 'meteor';
  verticalSpeed?: number; // For moving enemies
  amplitude?: number; // For wave motion
  phase?: number; // For wave motion offset
}

interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  type: 'grow'; // Can add more types later
}

type GameState = 'ready' | 'playing' | 'paused' | 'gameOver';

const InfiniteRunner: React.FC<InfiniteRunnerProps> = ({ gameId, gameTitle, embedded = false }) => {
  const router = useRouter();
  const { account } = useAccount();
  const { addToast } = useToast();

  // Client-side only check
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false); // For collapsible controls

  // Speed/Difficulty mode
  const [speedMode, setSpeedMode] = useState<SpeedMode>('coffee');
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);

  // Load saved speed mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSpeed = localStorage.getItem('infiniteRunnerSpeedMode') as SpeedMode | null;
      if (savedSpeed && SPEED_CONFIGS[savedSpeed]) {
        setSpeedMode(savedSpeed);
      }
    }
  }, []);

  // Save speed mode to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      localStorage.setItem('infiniteRunnerSpeedMode', speedMode);
    }
  }, [speedMode, isMounted]);

  // Audio refs
  const menuMusicRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const jumpSoundRef = useRef<HTMLAudioElement | null>(null);
  const levelUpSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);
  const grabCoinSoundRef = useRef<HTMLAudioElement | null>(null);
  const extraLifeSoundRef = useRef<HTMLAudioElement | null>(null);
  const groundSlamSoundRef = useRef<HTMLAudioElement | null>(null);
  const plasmaBallSoundRef = useRef<HTMLAudioElement | null>(null);
  const safeZoneSoundRef = useRef<HTMLAudioElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);

  // Player state
  const [playerY, setPlayerY] = useState<number>(GAME_PHYSICS.GROUND_Y);
  const [playerVelocity, setPlayerVelocity] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [isPoweredUp, setIsPoweredUp] = useState(false);
  const [runningFrame, setRunningFrame] = useState(0);

  // Game speed
  const [gameSpeed, setGameSpeed] = useState(5);
  const [baseSpeed, setBaseSpeed] = useState(5);

  // Obstacles and coins
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);

  // Background
  const [bgOffset, setBgOffset] = useState(0);
  const [theme, setTheme] = useState<ThemeType>('day');
  const [bgImageOffset, setBgImageOffset] = useState(0);

  // Web3 Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [lastLevelUpScore, setLastLevelUpScore] = useState(0);
  const [invulnerableUntil, setInvulnerableUntil] = useState(0); // Timestamp for invulnerability

  // Confirmation modal state
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const [showReplayConfirmation, setShowReplayConfirmation] = useState(false);
  const [powerUpSpawnedThisLevel, setPowerUpSpawnedThisLevel] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());

  // Refs
  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const coinIdRef = useRef(0);
  const powerUpIdRef = useRef(0);
  const lastObstacleRef = useRef(0);
  const lastCoinRef = useRef(0);
  const lastPowerUpRef = useRef(0);
  const levelTimerRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0); // For delta time calculation

  // Extract constants for easier access
  const {
    GRAVITY,
    JUMP_FORCE,
    DOUBLE_JUMP_FORCE,
    GROUND_Y,
    PLAYER_X,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    MAX_JUMPS,
    TARGET_FPS,
  } = GAME_PHYSICS;

  // Use imported constants
  const quizQuestions = QUIZ_QUESTIONS;
  const themes = THEMES;

  // Save game progress
  const saveGameProgress = useCallback(
    async (finalScore: number, finalLevel: number, earnedXP: number) => {
      if (!account || progressSaved || isSavingProgress || earnedXP <= 0) {
        return;
      }

      setIsSavingProgress(true);

      try {
        // Calculate points using constant
        const pointsEarned = Math.floor(finalScore / SCORING_CONFIG.POINTS_PER_SCORE);

        // Save to account
        await accountService.addExperienceAndPoints(account.id, earnedXP, pointsEarned);

        // Submit score to game leaderboard
        try {
          await gameScoresService.submitScore(
            gameId,
            account.id,
            account.profile?.displayName || account.profile?.username || 'Anonymous',
            finalScore,
            finalLevel,
            {
              distance: Math.floor(finalScore / 10), // Estimate distance traveled
              coinsCollected: Math.floor(finalScore / 50), // Estimate coins
              timeAlive: Math.floor(finalScore / 100), // Estimate time in seconds
            }
          );
        } catch (scoreError) {
          // Don't fail the entire save if leaderboard submission fails
        }

        setProgressSaved(true);

        addToast({
          type: 'success',
          title: '💾 Progress Saved!',
          message: `Earned ${earnedXP} XP and ${pointsEarned} points!`,
          duration: 5000,
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Save Failed',
          message: 'Could not save your progress. Please try again.',
          duration: 5000,
        });
      } finally {
        setIsSavingProgress(false);
      }
    },
    [account, progressSaved, isSavingProgress, addToast, gameId]
  );

  // Client-side only mounting
  useEffect(() => {
    setIsMounted(true);

    // Initialize audio using constants
    if (typeof window !== 'undefined') {
      menuMusicRef.current = new Audio(AUDIO_CONFIG.MENU_MUSIC.path);
      menuMusicRef.current.loop = AUDIO_CONFIG.MENU_MUSIC.loop;
      menuMusicRef.current.volume = AUDIO_CONFIG.MENU_MUSIC.volume;

      winSoundRef.current = new Audio(AUDIO_CONFIG.WIN_SOUND.path);
      winSoundRef.current.volume = AUDIO_CONFIG.WIN_SOUND.volume;

      jumpSoundRef.current = new Audio(AUDIO_CONFIG.JUMP_SOUND.path);
      jumpSoundRef.current.volume = AUDIO_CONFIG.JUMP_SOUND.volume;

      levelUpSoundRef.current = new Audio(AUDIO_CONFIG.LEVEL_UP_SOUND.path);
      levelUpSoundRef.current.volume = AUDIO_CONFIG.LEVEL_UP_SOUND.volume;

      gameOverSoundRef.current = new Audio(AUDIO_CONFIG.GAME_OVER_SOUND.path);
      gameOverSoundRef.current.volume = AUDIO_CONFIG.GAME_OVER_SOUND.volume;

      hitSoundRef.current = new Audio(AUDIO_CONFIG.HIT_SOUND.path);
      hitSoundRef.current.volume = AUDIO_CONFIG.HIT_SOUND.volume;

      grabCoinSoundRef.current = new Audio(AUDIO_CONFIG.GRAB_COIN_SOUND.path);
      grabCoinSoundRef.current.volume = AUDIO_CONFIG.GRAB_COIN_SOUND.volume;

      extraLifeSoundRef.current = new Audio(AUDIO_CONFIG.EXTRA_LIFE_SOUND.path);
      extraLifeSoundRef.current.volume = AUDIO_CONFIG.EXTRA_LIFE_SOUND.volume;

      groundSlamSoundRef.current = new Audio(AUDIO_CONFIG.GROUND_SLAM_SOUND.path);
      groundSlamSoundRef.current.volume = AUDIO_CONFIG.GROUND_SLAM_SOUND.volume;

      plasmaBallSoundRef.current = new Audio(AUDIO_CONFIG.PLASMA_BALL_SOUND.path);
      plasmaBallSoundRef.current.volume = AUDIO_CONFIG.PLASMA_BALL_SOUND.volume;

      safeZoneSoundRef.current = new Audio(AUDIO_CONFIG.SAFE_ZONE_SOUND.path);
      safeZoneSoundRef.current.loop = AUDIO_CONFIG.SAFE_ZONE_SOUND.loop;
      safeZoneSoundRef.current.volume = AUDIO_CONFIG.SAFE_ZONE_SOUND.volume;
    }

    return () => {
      // Cleanup audio on unmount
      if (menuMusicRef.current) {
        menuMusicRef.current.pause();
        menuMusicRef.current = null;
      }
      if (winSoundRef.current) winSoundRef.current = null;
      if (jumpSoundRef.current) jumpSoundRef.current = null;
      if (levelUpSoundRef.current) levelUpSoundRef.current = null;
      if (gameOverSoundRef.current) gameOverSoundRef.current = null;
      if (hitSoundRef.current) hitSoundRef.current = null;
      if (grabCoinSoundRef.current) grabCoinSoundRef.current = null;
      if (extraLifeSoundRef.current) extraLifeSoundRef.current = null;
      if (groundSlamSoundRef.current) groundSlamSoundRef.current = null;
      if (plasmaBallSoundRef.current) plasmaBallSoundRef.current = null;
      if (safeZoneSoundRef.current) {
        safeZoneSoundRef.current.pause();
        safeZoneSoundRef.current = null;
      }
    };
  }, []);

  // Load active challenges for current user
  useEffect(() => {
    if (!account || gameState !== 'playing') return;

    const loadChallenges = async () => {
      const challenges = await gameSocialService.getOpenChallenges(gameId);
      const userChallenges = challenges.filter(
        c => c.acceptedBy === account.id || (c.targetUserId === account.id && c.status === 'open')
      );
      setActiveChallenges(userChallenges);
    };

    loadChallenges();
  }, [account, gameState, gameId]);

  // Check for challenge completion based on score
  useEffect(() => {
    if (!account || gameState !== 'playing' || activeChallenges.length === 0) return;

    activeChallenges.forEach(async challenge => {
      if (
        challenge.requiredScore &&
        score >= challenge.requiredScore &&
        !completedChallengeIds.has(challenge.id)
      ) {
        try {
          // Mark as completed locally to prevent duplicate completions
          setCompletedChallengeIds(prev => {
            const newSet = new Set(prev);
            newSet.add(challenge.id);
            return newSet;
          });

          // Complete challenge and award points
          const result = await gameSocialService.completeChallenge(challenge.id, account.id);

          // Award points
          await accountService.addExperienceAndPoints(account.id, 0, result.pointsReward);

          addToast({
            type: 'success',
            title: '🎯 Challenge Completed!',
            message: `Earned ${result.pointsReward} points!`,
            duration: 5000,
          });

          // Post to chat
          gameSocialService.sendGameMessage(
            gameId,
            account.id,
            account.profile?.username || account.profile?.displayName || 'Anonymous',
            `Completed challenge: ${challenge.requirement}! Won ${result.pointsReward} points! 🏆`,
            'achievement'
          );
        } catch (error) {
          // Failed to complete challenge
        }
      }
    });
  }, [score, activeChallenges, account, gameState, gameId, completedChallengeIds, addToast]);

  // Handle menu music based on game state
  useEffect(() => {
    if (gameState === 'ready') {
      // Play menu music on ready screen
      menuMusicRef.current?.play().catch(() => {});
    } else {
      // Stop menu music when game starts or ends
      if (menuMusicRef.current) {
        menuMusicRef.current.pause();
        menuMusicRef.current.currentTime = 0;
      }
    }
  }, [gameState]);

  // Disable scrolling when game is active
  useEffect(() => {
    if (gameState === 'playing') {
      // Disable scroll
      document.body.style.overflow = 'hidden';

      // Prevent arrow key scrolling
      const preventScroll = (e: KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      };

      window.addEventListener('keydown', preventScroll);

      return () => {
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', preventScroll);
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [gameState]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Running animation - cycle through sprite frames
  useEffect(() => {
    if (gameState !== 'playing') return;

    const animationSpeed = ANIMATION_CONFIG.RUNNING_FRAME_SPEED;
    const totalFrames = ANIMATION_CONFIG.TOTAL_RUNNING_FRAMES;

    const interval = setInterval(() => {
      setRunningFrame(prev => (prev + 1) % totalFrames);
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [gameState]);

  // SafeZone sound - play when invulnerable
  useEffect(() => {
    if (gameState !== 'playing') {
      // Stop safezone sound if game is not playing
      if (safeZoneSoundRef.current) {
        safeZoneSoundRef.current.pause();
        safeZoneSoundRef.current.currentTime = 0;
      }
      return;
    }

    const checkInvulnerability = () => {
      const isInvulnerable = Date.now() < invulnerableUntil;

      if (isInvulnerable && safeZoneSoundRef.current) {
        // Play safezone sound if not already playing
        if (safeZoneSoundRef.current.paused) {
          safeZoneSoundRef.current.currentTime = 0;
          safeZoneSoundRef.current.play().catch(() => {});
        }
      } else if (safeZoneSoundRef.current && !safeZoneSoundRef.current.paused) {
        // Stop safezone sound when invulnerability ends
        safeZoneSoundRef.current.pause();
        safeZoneSoundRef.current.currentTime = 0;
      }
    };

    // Check immediately
    checkInvulnerability();

    // Check at configured interval to ensure sound stops when invulnerability ends
    const interval = setInterval(checkInvulnerability, TIMING_CONFIG.SAFE_ZONE_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (safeZoneSoundRef.current) {
        safeZoneSoundRef.current.pause();
        safeZoneSoundRef.current.currentTime = 0;
      }
    };
  }, [gameState, invulnerableUntil]);

  // Enter fullscreen on game start
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  // Start game (initial play - costs 500 points)
  const startGame = useCallback(
    async (isReplay: boolean = false) => {
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
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Could not start game. Please try again.',
          duration: 4000,
        });
        return;
      }

      // Get the base speed from selected mode
      const modeSpeed = SPEED_CONFIGS[speedMode].baseSpeed;

      setGameState('playing');
      setScore(0);
      setLevel(1);
      setXpEarned(0);
      setProgressSaved(false);
      setIsSavingProgress(false);
      setPlayerY(GROUND_Y);
      setPlayerVelocity(0);
      setIsJumping(false);
      setIsDucking(false);
      setJumpCount(0);
      setGameSpeed(modeSpeed);
      setBaseSpeed(modeSpeed);
      setObstacles([]);
      setCoins([]);
      setPowerUps([]);
      setIsPoweredUp(false);
      setPowerUpSpawnedThisLevel(false);
      setBgOffset(0);
      setBgImageOffset(0);
      setTheme('day');
      setLastLevelUpScore(0);
      obstacleIdRef.current = 0;
      coinIdRef.current = 0;
      powerUpIdRef.current = 0;
      lastObstacleRef.current = 0;
      lastCoinRef.current = 0;
      lastPowerUpRef.current = 0;
      levelTimerRef.current = 0;
      frameCountRef.current = 0;
      lastFrameTimeRef.current = 0;

      // Give player initial invulnerability at start
      setInvulnerableUntil(Date.now() + TIMING_CONFIG.INITIAL_INVULNERABILITY_MS);

      // Play win sound when starting game
      if (winSoundRef.current) {
        winSoundRef.current.currentTime = 0;
        winSoundRef.current.play().catch(() => {});
      }

      // Don't auto-enter fullscreen - let user choose with button
    },
    [account, addToast, speedMode]
  );

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key for pause/resume in any state
      if (e.code === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
        setGameState(gameState === 'paused' ? 'playing' : 'paused');
        return;
      }

      if (gameState !== 'playing') {
        // Removed space key to start game to avoid conflicts with sidebar
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'ArrowUp':
          // Allow double jump
          if (jumpCount < MAX_JUMPS) {
            if (jumpCount === 0) {
              setPlayerVelocity(JUMP_FORCE);
              setIsJumping(true);
            } else {
              // Double jump with visual feedback
              setPlayerVelocity(DOUBLE_JUMP_FORCE);
            }
            setJumpCount(prev => prev + 1);

            // Play jump sound
            if (jumpSoundRef.current) {
              jumpSoundRef.current.currentTime = 0;
              jumpSoundRef.current.play().catch(() => {});
            }
          }
          break;
        case 'ArrowDown':
          // Ground slam if in the air, otherwise duck
          if (playerY < GROUND_Y) {
            // Fast fall / Ground slam!
            setPlayerVelocity(20); // Strong downward velocity for quick descent
            setIsDucking(false); // Don't duck while falling

            // Play ground slam sound
            if (groundSlamSoundRef.current) {
              groundSlamSoundRef.current.currentTime = 0;
              groundSlamSoundRef.current.play().catch(() => {});
            }
          } else {
            // Normal duck on ground - Transform to plasma ball!
            setIsDucking(true);

            // Play plasma ball sound
            if (plasmaBallSoundRef.current) {
              plasmaBallSoundRef.current.currentTime = 0;
              plasmaBallSoundRef.current.play().catch(() => {});
            }
          }
          break;
        case 'ArrowRight':
          setGameSpeed(Math.min(baseSpeed * 1.5, 15));
          break;
        case 'ArrowLeft':
          setGameSpeed(Math.max(baseSpeed * 0.5, 2));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowDown':
          setIsDucking(false);
          break;
        case 'ArrowRight':
        case 'ArrowLeft':
          setGameSpeed(baseSpeed);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isJumping, playerY, baseSpeed, startGame]);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = (currentTime: number) => {
      // Calculate delta time for frame-rate independence
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
      }
      const deltaTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      // Normalize to 60 FPS (16.67ms per frame)
      const deltaMultiplier = deltaTime / (1000 / TARGET_FPS);

      // Update player physics with delta time
      setPlayerVelocity(v => v + GRAVITY * deltaMultiplier);
      setPlayerY(y => {
        const newY = y + playerVelocity * deltaMultiplier;
        if (newY >= GROUND_Y) {
          setIsJumping(false);
          setJumpCount(0); // Reset jump count when landing
          return GROUND_Y;
        }
        return newY;
      });

      // Update background with delta time normalization
      const normalizedSpeed = gameSpeed * deltaMultiplier;
      setBgOffset(offset => (offset + normalizedSpeed) % 1000);
      setBgImageOffset(offset => (offset + normalizedSpeed * 0.5) % 2000); // Slower parallax for background image

      // Update score - only if not in safe zone
      const isInSafeZone = Date.now() < invulnerableUntil;
      if (!isInSafeZone) {
        // Increment frame counter
        frameCountRef.current += 1;

        setScore(s => {
          // Score increment slows down with level to make it harder
          // Level 1: +1 every frame, Level 2: +1 every 2 frames, Level 3: +1 every 3 frames, etc.
          const shouldIncrement = frameCountRef.current % level === 0;
          const newScore = shouldIncrement ? s + 1 : s;

          // Level up at configured threshold
          // Check if we've crossed the threshold (handles cases where score jumps past exact multiples)
          const currentThreshold = Math.floor(newScore / SCORING_CONFIG.LEVEL_UP_THRESHOLD);
          const lastThreshold = Math.floor(lastLevelUpScore / SCORING_CONFIG.LEVEL_UP_THRESHOLD);

          if (newScore > 0 && currentThreshold > lastThreshold) {
            setLastLevelUpScore(newScore);

            // Play level up sound
            if (levelUpSoundRef.current) {
              levelUpSoundRef.current.currentTime = 0;
              levelUpSoundRef.current.play().catch(() => {});
            }

            // Pause game and show quiz
            setTimeout(() => {
              setGameState('paused');
              setShowQuiz(true);
              setCurrentQuestion(Math.floor(Math.random() * quizQuestions.length));
              setQuizAnswered(false);
              setIsAnswerCorrect(false);
            }, 100);
          }

          return newScore;
        });
      }

      // Spawn obstacles (but not during invulnerability period)
      const isInvulnerable = Date.now() < invulnerableUntil;

      lastObstacleRef.current += 1;
      // Add randomness to obstacle interval for more variety
      const baseInterval = Math.max(
        OBSTACLE_CONFIG.BASE_INTERVAL - level * OBSTACLE_CONFIG.INTERVAL_DECREASE_PER_LEVEL,
        OBSTACLE_CONFIG.MIN_INTERVAL
      );
      const obstacleInterval =
        baseInterval +
        Math.floor(Math.random() * OBSTACLE_CONFIG.RANDOM_VARIATION) -
        OBSTACLE_CONFIG.RANDOM_VARIATION / 2;
      if (lastObstacleRef.current > obstacleInterval && !isInvulnerable) {
        lastObstacleRef.current = 0;
        const obstacleTypes: Obstacle['type'][] = ['cactus', 'rock'];

        // Add new obstacle types at higher levels
        if (level >= 2) obstacleTypes.push('bird', 'blockchain', 'drone');
        if (level >= 3) obstacleTypes.push('martian', 'satellite');
        if (level >= 4) obstacleTypes.push('meteor');

        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const isFlying =
          type === 'bird' || type === 'drone' || type === 'satellite' || type === 'meteor';

        // Different heights and behaviors for different types with MORE RANDOMNESS
        let yPos = GROUND_Y;
        let verticalSpeed = 0;
        let amplitude = 0;

        if (type === 'cactus' || type === 'rock') {
          // Ground obstacles - randomize height slightly
          yPos = GROUND_Y - Math.random() * 5;
        } else if (type === 'bird') {
          yPos = GROUND_Y - 70 - Math.random() * 60; // More height variation
          verticalSpeed = 0.3 + Math.random() * 0.8; // More speed variation
          amplitude = 10 + Math.random() * 20; // More wave amplitude
        } else if (type === 'drone') {
          yPos = GROUND_Y - 80 - Math.random() * 80; // Much more variation
          verticalSpeed = 0.8 + Math.random() * 1.2; // Variable speed
          amplitude = 15 + Math.random() * 25; // Variable amplitude
        } else if (type === 'satellite') {
          yPos = GROUND_Y - 130 - Math.random() * 50; // More variation
          verticalSpeed = 0.2 + Math.random() * 0.4; // Variable speed
          amplitude = 5 + Math.random() * 10;
        } else if (type === 'meteor') {
          yPos = GROUND_Y - 150 - Math.random() * 80; // Much more variation
          verticalSpeed = 1.5 + Math.random() * 2.5; // Variable speed
          amplitude = 20 + Math.random() * 30;
        } else if (type === 'blockchain') {
          // Mid-height obstacles with variation
          yPos = GROUND_Y - 30 - Math.random() * 40;
        } else if (type === 'martian') {
          // Mid-height obstacles with variation
          yPos = GROUND_Y - 30 - Math.random() * 40;
        }

        // Add size variation for more unpredictability
        const sizeVariation =
          OBSTACLE_CONFIG.SIZE_VARIATION_MIN +
          Math.random() * (OBSTACLE_CONFIG.SIZE_VARIATION_MAX - OBSTACLE_CONFIG.SIZE_VARIATION_MIN);
        const baseWidth =
          type === 'blockchain' || type === 'martian' ? 50 : type === 'satellite' ? 40 : 30;
        const baseHeight =
          type === 'blockchain' || type === 'martian'
            ? 50
            : type === 'satellite'
              ? 40
              : isFlying
                ? 30
                : 40;

        setObstacles(obs => [
          ...obs,
          {
            id: obstacleIdRef.current++,
            x: 800,
            y: yPos,
            width: Math.floor(baseWidth * sizeVariation),
            height: Math.floor(baseHeight * sizeVariation),
            type,
            verticalSpeed: isFlying ? verticalSpeed : 0,
            amplitude: isFlying ? amplitude : 0,
            phase: Math.random() * Math.PI * 2,
          },
        ]);
      }

      // Spawn coins (only if not in safe zone) with random intervals
      if (!isInSafeZone) {
        lastCoinRef.current += 1;
        const coinInterval =
          COIN_CONFIG.BASE_INTERVAL + Math.floor(Math.random() * COIN_CONFIG.RANDOM_VARIATION);
        if (lastCoinRef.current > coinInterval) {
          lastCoinRef.current = 0;
          setCoins(c => [
            ...c,
            {
              id: coinIdRef.current++,
              x: 800,
              y:
                GROUND_Y -
                COIN_CONFIG.BASE_HEIGHT_OFFSET -
                Math.random() * COIN_CONFIG.HEIGHT_VARIATION,
              collected: false,
            },
          ]);
        }
      }

      // Spawn power-ups (only once per level, after safe zone ends)
      if (!powerUpSpawnedThisLevel && !isInSafeZone) {
        lastPowerUpRef.current += 1;
        // Spawn after configured delay into the level (after safe zone)
        const powerUpInterval =
          POWER_UP_CONFIG.SPAWN_DELAY_MIN +
          Math.random() * (POWER_UP_CONFIG.SPAWN_DELAY_MAX - POWER_UP_CONFIG.SPAWN_DELAY_MIN);
        if (lastPowerUpRef.current > powerUpInterval) {
          setPowerUpSpawnedThisLevel(true);
          lastPowerUpRef.current = 0;
          setPowerUps(p => [
            ...p,
            {
              id: powerUpIdRef.current++,
              x: 800,
              y: GROUND_Y - POWER_UP_CONFIG.HEIGHT_OFFSET,
              collected: false,
              type: 'grow',
            },
          ]);
        }
      }

      // Move obstacles with dynamic vertical movement (normalized with delta time)
      setObstacles(obs =>
        obs
          .map(o => {
            let newY = o.y;

            // Apply wave motion to flying enemies
            if (o.verticalSpeed && o.amplitude && o.phase !== undefined) {
              const time = Date.now() / 1000;
              newY = o.y + Math.sin(time * o.verticalSpeed + o.phase) * o.amplitude;

              // Keep within bounds
              newY = Math.max(GROUND_Y - 220, Math.min(GROUND_Y - 50, newY));
            }

            return { ...o, x: o.x - normalizedSpeed, y: newY };
          })
          .filter(o => o.x > -100)
      );

      // Move coins (normalized with delta time)
      setCoins(c =>
        c.map(coin => ({ ...coin, x: coin.x - normalizedSpeed })).filter(coin => coin.x > -50)
      );

      // Move power-ups (normalized with delta time)
      setPowerUps(p =>
        p
          .map(powerUp => ({ ...powerUp, x: powerUp.x - normalizedSpeed }))
          .filter(powerUp => powerUp.x > -50)
      );

      // Check collisions with obstacles (skip if invulnerable)
      const isInvulnerableNow = Date.now() < invulnerableUntil;

      // Adjust hitbox when ducking (plasma ball form) - make it smaller and circular
      const playerWidth = isDucking ? 30 : PLAYER_WIDTH; // Plasma ball is 30px diameter
      const playerHeight = isDucking ? 30 : PLAYER_HEIGHT; // Circular hitbox
      const playerTop = isDucking ? GROUND_Y - 15 : playerY; // Center the plasma ball vertically
      const playerLeft = isDucking ? PLAYER_X + 10 : PLAYER_X; // Center the plasma ball horizontally

      const collision =
        !isInvulnerableNow &&
        obstacles.some(obs => {
          const playerRight = playerLeft + playerWidth;
          const playerBottom = playerTop + playerHeight;
          const obsRight = obs.x + obs.width;
          const obsBottom = obs.y + obs.height;

          return (
            playerLeft < obsRight &&
            playerRight > obs.x &&
            playerTop < obsBottom &&
            playerBottom > obs.y
          );
        });

      if (collision) {
        // Play hit sound on collision
        if (hitSoundRef.current) {
          hitSoundRef.current.currentTime = 0;
          hitSoundRef.current.play().catch(() => {});
        }

        if (isPoweredUp) {
          // If powered up, lose power-up instead of dying
          setIsPoweredUp(false);
          // Give invulnerability after losing power-up
          setInvulnerableUntil(Date.now() + TIMING_CONFIG.POWER_UP_LOST_INVULNERABILITY_MS);
          // Add visual feedback
          addToast({
            type: 'warning',
            title: '⚠️ Power-Up Lost!',
            message: 'Energy aura faded!',
            duration: 2000,
          });
        } else {
          // Normal death - game over
          setGameState('gameOver');

          // Play game over sound after hit sound
          setTimeout(() => {
            if (gameOverSoundRef.current) {
              gameOverSoundRef.current.currentTime = 0;
              gameOverSoundRef.current.play().catch(() => {});
            }
          }, 200);

          if (score > highScore) {
            setHighScore(score);
          }
          // Calculate XP earned using constant
          const earnedXP = Math.floor(score / SCORING_CONFIG.XP_PER_SCORE);
          setXpEarned(earnedXP);

          // Save progress automatically
          setTimeout(() => {
            saveGameProgress(score, level, earnedXP);
          }, 1000);

          return;
        }
      }

      // Check coin collection (use adjusted hitbox for plasma ball form)
      setCoins(c =>
        c.map(coin => {
          if (coin.collected) return coin;

          const playerWidth = isDucking ? 30 : PLAYER_WIDTH; // Match plasma ball size
          const playerHeight = isDucking ? 30 : PLAYER_HEIGHT;
          const playerTop = isDucking ? GROUND_Y - 15 : playerY;
          const playerLeft = isDucking ? PLAYER_X + 10 : PLAYER_X;

          const playerRight = playerLeft + playerWidth;
          const playerBottom = playerTop + playerHeight;
          const coinRight = coin.x + 20;
          const coinBottom = coin.y + 20;

          if (
            playerLeft < coinRight &&
            playerRight > coin.x &&
            playerTop < coinBottom &&
            playerBottom > coin.y
          ) {
            setScore(s => {
              const newScore = s + SCORING_CONFIG.COIN_VALUE;

              // Check if collecting this coin causes a level-up threshold crossing
              const currentThreshold = Math.floor(newScore / SCORING_CONFIG.LEVEL_UP_THRESHOLD);
              const lastThreshold = Math.floor(
                lastLevelUpScore / SCORING_CONFIG.LEVEL_UP_THRESHOLD
              );

              if (newScore > 0 && currentThreshold > lastThreshold) {
                setLastLevelUpScore(newScore);

                // Play level up sound
                if (levelUpSoundRef.current) {
                  levelUpSoundRef.current.currentTime = 0;
                  levelUpSoundRef.current.play().catch(() => {});
                }

                // Pause game and show quiz
                setTimeout(() => {
                  setGameState('paused');
                  setShowQuiz(true);
                  setCurrentQuestion(Math.floor(Math.random() * quizQuestions.length));
                  setQuizAnswered(false);
                  setIsAnswerCorrect(false);
                }, 100);
              }

              return newScore;
            });

            // Play grab coin sound
            if (grabCoinSoundRef.current) {
              grabCoinSoundRef.current.currentTime = 0;
              grabCoinSoundRef.current.play().catch(() => {});
            }

            return { ...coin, collected: true };
          }
          return coin;
        })
      );

      // Check power-up collection
      setPowerUps(p =>
        p.map(powerUp => {
          if (powerUp.collected) return powerUp;

          const playerWidth = isDucking ? 30 : PLAYER_WIDTH; // Match plasma ball size
          const playerHeight = isDucking ? 30 : PLAYER_HEIGHT;
          const playerTop = isDucking ? GROUND_Y - 15 : playerY;
          const playerLeft = isDucking ? PLAYER_X + 10 : PLAYER_X;

          const playerRight = playerLeft + playerWidth;
          const playerBottom = playerTop + playerHeight;
          const powerUpRight = powerUp.x + 30;
          const powerUpBottom = powerUp.y + 30;

          if (
            playerLeft < powerUpRight &&
            playerRight > powerUp.x &&
            playerTop < powerUpBottom &&
            playerBottom > powerUp.y
          ) {
            // Transform to powered-up state
            setIsPoweredUp(true);

            // Play extra life sound for power-up
            if (extraLifeSoundRef.current) {
              extraLifeSoundRef.current.currentTime = 0;
              extraLifeSoundRef.current.play().catch(() => {});
            }

            // Add visual feedback
            addToast({
              type: 'success',
              title: '⚡ Power Surge!',
              message: 'Energy Aura Activated! Extra life granted!',
              duration: 3000,
            });

            return { ...powerUp, collected: true };
          }
          return powerUp;
        })
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [
    gameState,
    playerVelocity,
    gameSpeed,
    obstacles,
    coins,
    isDucking,
    playerY,
    score,
    highScore,
    level,
    baseSpeed,
    addToast,
    saveGameProgress,
  ]);

  // Render obstacle with improved graphics
  const renderObstacle = (obs: Obstacle) => {
    const currentTheme = themes[theme];

    switch (obs.type) {
      case 'cactus':
        return (
          <g key={obs.id} transform={`translate(${obs.x}, ${obs.y})`}>
            {/* Broken spaceship piece - angular wreckage */}
            {/* Main body fragment */}
            <polygon
              points='15,0 28,12 25,35 20,40 8,40 5,35 2,12'
              className='fill-gray-600'
              stroke='#555'
              strokeWidth='2'
            />
            {/* Metal plating highlights */}
            <polygon points='15,5 22,15 20,30 10,30 8,15' className='fill-gray-500' opacity='0.8' />
            {/* Broken edge with jagged metal */}
            <polygon points='2,12 8,8 12,15 8,18' className='fill-gray-700' />
            <polygon points='28,12 22,8 18,15 22,18' className='fill-gray-700' />
            {/* Exposed wiring/circuits */}
            <line x1='10' y1='10' x2='8' y2='20' stroke='#00FFFF' strokeWidth='1.5' opacity='0.7' />
            <line
              x1='20'
              y1='12'
              x2='22'
              y2='22'
              stroke='#00FFFF'
              strokeWidth='1.5'
              opacity='0.7'
            />
            <circle cx='8' cy='20' r='2' className='fill-cyan-400' opacity='0.8' />
            <circle cx='22' cy='22' r='2' className='fill-cyan-400' opacity='0.8' />
            {/* Damaged panels */}
            <rect x='10' y='15' width='10' height='8' className='fill-red-900' opacity='0.6' />
            <rect x='12' y='25' width='6' height='6' className='fill-orange-800' opacity='0.5' />
            {/* Scorch marks */}
            <ellipse cx='15' cy='18' rx='6' ry='4' className='fill-black' opacity='0.4' />
          </g>
        );
      case 'rock':
        return (
          <g key={obs.id} transform={`translate(${obs.x}, ${obs.y})`}>
            {/* Space asteroid - irregular shape */}
            <polygon
              points='15,0 28,8 30,20 25,35 15,40 5,35 0,20 3,8'
              className='fill-gray-600'
              stroke='#555'
              strokeWidth='2'
            />
            {/* Asteroid surface texture */}
            <polygon points='15,5 24,15 20,30 10,30 6,15' className='fill-gray-500' opacity='0.7' />
            {/* Craters - multiple impact marks */}
            <circle cx='10' cy='12' r='4' className='fill-gray-700' opacity='0.8' />
            <circle cx='10' cy='12' r='3' className='fill-gray-800' opacity='0.6' />
            <circle cx='20' cy='20' r='3.5' className='fill-gray-700' opacity='0.8' />
            <circle cx='20' cy='20' r='2.5' className='fill-gray-800' opacity='0.6' />
            <circle cx='15' cy='28' r='3' className='fill-gray-700' opacity='0.8' />
            <circle cx='15' cy='28' r='2' className='fill-gray-800' opacity='0.6' />
            {/* Small craters */}
            <circle cx='8' cy='22' r='2' className='fill-gray-800' opacity='0.5' />
            <circle cx='22' cy='10' r='1.5' className='fill-gray-800' opacity='0.5' />
            <circle cx='18' cy='32' r='2' className='fill-gray-800' opacity='0.5' />
            {/* Mineral deposits (cyan glow) */}
            <circle cx='12' cy='18' r='1.5' className='fill-cyan-400' opacity='0.6'>
              <animate
                attributeName='opacity'
                values='0.6;0.3;0.6'
                dur='2s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='16' cy='15' r='1' className='fill-cyan-400' opacity='0.5'>
              <animate
                attributeName='opacity'
                values='0.5;0.2;0.5'
                dur='2.5s'
                repeatCount='indefinite'
              />
            </circle>
            {/* Shadow side */}
            <polygon points='15,20 5,35 10,38 15,40' className='fill-black' opacity='0.3' />
          </g>
        );
      case 'bird':
        return (
          <g key={obs.id} transform={`translate(${obs.x}, ${obs.y})`}>
            {/* Small Alien Spacecraft - UFO style */}
            {/* Energy field */}
            <ellipse cx='15' cy='15' rx='18' ry='14' className='fill-green-400' opacity='0.2'>
              <animate
                attributeName='opacity'
                values='0.2;0.4;0.2'
                dur='0.8s'
                repeatCount='indefinite'
              />
            </ellipse>
            {/* Main saucer body */}
            <ellipse
              cx='15'
              cy='15'
              rx='15'
              ry='10'
              className='fill-gray-600'
              stroke='#555'
              strokeWidth='1.5'
            />
            <ellipse cx='15' cy='14' rx='14' ry='8' className='fill-gray-500' />
            {/* Dome cockpit */}
            <ellipse
              cx='15'
              cy='10'
              rx='8'
              ry='6'
              className='fill-cyan-300'
              opacity='0.7'
              stroke='#00FFFF'
              strokeWidth='1'
            />
            <ellipse cx='15' cy='9' rx='6' ry='4' className='fill-white' opacity='0.5' />
            {/* Lights underneath - pulsing */}
            <circle cx='8' cy='18' r='2' className='fill-red-500' opacity='0.8'>
              <animate
                attributeName='opacity'
                values='0.8;0.3;0.8'
                dur='0.4s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='15' cy='19' r='2' className='fill-green-400' opacity='0.8'>
              <animate
                attributeName='opacity'
                values='0.8;0.3;0.8'
                dur='0.5s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='22' cy='18' r='2' className='fill-blue-400' opacity='0.8'>
              <animate
                attributeName='opacity'
                values='0.8;0.3;0.8'
                dur='0.6s'
                repeatCount='indefinite'
              />
            </circle>
            {/* Panel details */}
            <line x1='5' y1='15' x2='25' y2='15' stroke='#444' strokeWidth='0.5' />
            <line x1='10' y1='13' x2='20' y2='13' stroke='#444' strokeWidth='0.5' />
            {/* Antenna */}
            <line x1='15' y1='6' x2='15' y2='3' stroke='#666' strokeWidth='1' />
            <circle cx='15' cy='3' r='1.5' className='fill-red-500'>
              <animate attributeName='opacity' values='1;0.3;1' dur='1s' repeatCount='indefinite' />
            </circle>
          </g>
        );
      case 'blockchain':
        return (
          <g key={obs.id} transform={`translate(${obs.x}, ${obs.y})`}>
            {/* First block */}
            <rect
              x='0'
              y='0'
              width='20'
              height='20'
              className='fill-cyan-500'
              stroke='#00CED1'
              strokeWidth='2'
              rx='2'
            />
            <rect
              x='3'
              y='3'
              width='14'
              height='14'
              className='fill-cyan-400'
              opacity='0.5'
              rx='1'
            />
            <text x='10' y='14' textAnchor='middle' className='fill-white font-bold text-xs'>
              B
            </text>

            {/* Second block */}
            <rect
              x='15'
              y='15'
              width='20'
              height='20'
              className='fill-purple-500'
              stroke='#8B00FF'
              strokeWidth='2'
              rx='2'
            />
            <rect
              x='18'
              y='18'
              width='14'
              height='14'
              className='fill-purple-400'
              opacity='0.5'
              rx='1'
            />
            <text x='25' y='29' textAnchor='middle' className='fill-white font-bold text-xs'>
              L
            </text>

            {/* Third block */}
            <rect
              x='30'
              y='30'
              width='20'
              height='20'
              className='fill-pink-500'
              stroke='#FF1493'
              strokeWidth='2'
              rx='2'
            />
            <rect
              x='33'
              y='33'
              width='14'
              height='14'
              className='fill-pink-400'
              opacity='0.5'
              rx='1'
            />
            <text x='40' y='44' textAnchor='middle' className='fill-white font-bold text-xs'>
              K
            </text>

            {/* Connection lines with glow */}
            <line x1='10' y1='10' x2='25' y2='25' stroke='#00FFFF' strokeWidth='3' opacity='0.8' />
            <line x1='10' y1='10' x2='25' y2='25' stroke='#FFFFFF' strokeWidth='1' />
            <line x1='25' y1='25' x2='40' y2='40' stroke='#FF00FF' strokeWidth='3' opacity='0.8' />
            <line x1='25' y1='25' x2='40' y2='40' stroke='#FFFFFF' strokeWidth='1' />
          </g>
        );
      case 'martian':
        return (
          <g key={obs.id} transform={`translate(${obs.x}, ${obs.y})`}>
            {/* Martian Alien - Mars themed */}
            {/* Head - large oval */}
            <ellipse
              cx='25'
              cy='15'
              rx='18'
              ry='20'
              className='fill-red-700'
              stroke='#8B4513'
              strokeWidth='2'
            />
            <ellipse cx='25' cy='12' rx='15' ry='18' className='fill-red-600' />

            {/* Large eyes - glowing */}
            <ellipse cx='18' cy='10' rx='6' ry='8' className='fill-black' />
            <ellipse cx='32' cy='10' rx='6' ry='8' className='fill-black' />
            <ellipse cx='18' cy='9' rx='4' ry='6' className='fill-cyan-400' opacity='0.8'>
              <animate
                attributeName='opacity'
                values='0.8;1;0.8'
                dur='1.5s'
                repeatCount='indefinite'
              />
            </ellipse>
            <ellipse cx='32' cy='9' rx='4' ry='6' className='fill-cyan-400' opacity='0.8'>
              <animate
                attributeName='opacity'
                values='0.8;1;0.8'
                dur='1.5s'
                repeatCount='indefinite'
              />
            </ellipse>
            <circle cx='18' cy='8' r='2' className='fill-white' />
            <circle cx='32' cy='8' r='2' className='fill-white' />

            {/* Small nose/mouth */}
            <ellipse cx='25' cy='18' rx='3' ry='2' className='fill-red-800' />
            <line x1='22' y1='18' x2='28' y2='18' stroke='#8B4513' strokeWidth='1.5' />

            {/* Antenna on head */}
            <line x1='25' y1='0' x2='25' y2='-5' stroke='#8B4513' strokeWidth='2' />
            <circle cx='25' cy='-5' r='3' className='fill-red-500'>
              <animate
                attributeName='opacity'
                values='0.8;1;0.8'
                dur='1s'
                repeatCount='indefinite'
              />
            </circle>

            {/* Body - smaller oval */}
            <ellipse
              cx='25'
              cy='35'
              rx='14'
              ry='12'
              className='fill-red-800'
              stroke='#8B4513'
              strokeWidth='2'
            />
            <ellipse cx='25' cy='33' rx='12' ry='10' className='fill-red-700' />

            {/* Arms - extended outward */}
            <ellipse cx='8' cy='32' rx='6' ry='10' className='fill-red-700' />
            <ellipse cx='42' cy='32' rx='6' ry='10' className='fill-red-700' />
            {/* Hands */}
            <circle cx='5' cy='35' r='3' className='fill-red-800' />
            <circle cx='45' cy='35' r='3' className='fill-red-800' />

            {/* Legs */}
            <ellipse cx='18' cy='45' rx='5' ry='8' className='fill-red-800' />
            <ellipse cx='32' cy='45' rx='5' ry='8' className='fill-red-800' />
            {/* Feet */}
            <ellipse cx='18' cy='52' rx='6' ry='3' className='fill-red-900' />
            <ellipse cx='32' cy='52' rx='6' ry='3' className='fill-red-900' />

            {/* Dust cloud effect around feet (Mars dust) */}
            <ellipse cx='18' cy='55' rx='8' ry='4' className='fill-orange-800' opacity='0.4'>
              <animate
                attributeName='opacity'
                values='0.4;0.6;0.4'
                dur='1.5s'
                repeatCount='indefinite'
              />
            </ellipse>
            <ellipse cx='32' cy='55' rx='8' ry='4' className='fill-orange-800' opacity='0.4'>
              <animate
                attributeName='opacity'
                values='0.4;0.6;0.4'
                dur='1.5s'
                repeatCount='indefinite'
              />
            </ellipse>

            {/* Chest detail - simple pattern */}
            <circle cx='20' cy='33' r='2' className='fill-red-900' />
            <circle cx='25' cy='33' r='2' className='fill-red-900' />
            <circle cx='30' cy='33' r='2' className='fill-red-900' />
          </g>
        );
      case 'drone':
        return (
          <g key={obs.id} transform={`translate(${obs.x}, ${obs.y})`}>
            {/* Main body */}
            <rect
              x='10'
              y='10'
              width='20'
              height='10'
              className='fill-gray-700'
              stroke='#555'
              strokeWidth='1'
              rx='2'
            />
            {/* Propeller arms */}
            <line x1='15' y1='15' x2='5' y2='5' stroke='#666' strokeWidth='2' />
            <line x1='25' y1='15' x2='35' y2='5' stroke='#666' strokeWidth='2' />
            <line x1='15' y1='15' x2='5' y2='25' stroke='#666' strokeWidth='2' />
            <line x1='25' y1='15' x2='35' y2='25' stroke='#666' strokeWidth='2' />
            {/* Propellers (spinning) */}
            <circle cx='5' cy='5' r='4' className='fill-red-500' opacity='0.6'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                from='0 5 5'
                to='360 5 5'
                dur='0.2s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='35' cy='5' r='4' className='fill-red-500' opacity='0.6'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                from='0 35 5'
                to='360 35 5'
                dur='0.2s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='5' cy='25' r='4' className='fill-red-500' opacity='0.6'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                from='0 5 25'
                to='360 5 25'
                dur='0.2s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='35' cy='25' r='4' className='fill-red-500' opacity='0.6'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                from='0 35 25'
                to='360 35 25'
                dur='0.2s'
                repeatCount='indefinite'
              />
            </circle>
            {/* Camera/sensor */}
            <circle cx='20' cy='15' r='3' className='fill-blue-400' />
          </g>
        );
      case 'satellite':
        return (
          <g key={obs.id} transform={`translate(${obs.x}, ${obs.y})`}>
            {/* Main body */}
            <rect
              x='15'
              y='10'
              width='20'
              height='20'
              className='fill-gray-600'
              stroke='#888'
              strokeWidth='1'
            />
            <rect x='18' y='13' width='14' height='14' className='fill-blue-300' opacity='0.3' />
            {/* Solar panels */}
            <rect
              x='0'
              y='15'
              width='15'
              height='10'
              className='fill-blue-900'
              stroke='#4169E1'
              strokeWidth='1'
            />
            <rect
              x='35'
              y='15'
              width='15'
              height='10'
              className='fill-blue-900'
              stroke='#4169E1'
              strokeWidth='1'
            />
            {/* Panel lines */}
            {[...Array(3)].map((_, i) => (
              <line
                key={`left-${i}`}
                x1={5 * i}
                y1='15'
                x2={5 * i}
                y2='25'
                stroke='#4169E1'
                strokeWidth='0.5'
              />
            ))}
            {[...Array(3)].map((_, i) => (
              <line
                key={`right-${i}`}
                x1={35 + 5 * i}
                y1='15'
                x2={35 + 5 * i}
                y2='25'
                stroke='#4169E1'
                strokeWidth='0.5'
              />
            ))}
            {/* Antenna */}
            <line x1='25' y1='10' x2='25' y2='0' stroke='#888' strokeWidth='1.5' />
            <circle cx='25' cy='0' r='2' className='fill-red-500' />
          </g>
        );
      case 'meteor':
        return (
          <g key={obs.id} transform={`translate(${obs.x}, ${obs.y})`}>
            {/* Meteor trail */}
            <ellipse cx='10' cy='15' rx='40' ry='8' className='fill-orange-500' opacity='0.3' />
            <ellipse cx='20' cy='15' rx='30' ry='6' className='fill-red-500' opacity='0.4' />
            {/* Main meteor */}
            <circle
              cx='40'
              cy='15'
              r='15'
              className='fill-gray-700'
              stroke='#555'
              strokeWidth='2'
            />
            <circle cx='40' cy='15' r='12' className='fill-gray-600' />
            {/* Craters */}
            <circle cx='35' cy='12' r='3' className='fill-gray-800' opacity='0.5' />
            <circle cx='43' cy='18' r='2' className='fill-gray-800' opacity='0.5' />
            <circle cx='42' cy='10' r='2.5' className='fill-gray-800' opacity='0.5' />
            {/* Fire effect */}
            <ellipse cx='50' cy='15' rx='8' ry='10' className='fill-orange-600' opacity='0.6'>
              <animate attributeName='rx' values='8;10;8' dur='0.3s' repeatCount='indefinite' />
            </ellipse>
            <ellipse cx='53' cy='15' rx='5' ry='7' className='fill-yellow-500' opacity='0.7'>
              <animate attributeName='rx' values='5;7;5' dur='0.2s' repeatCount='indefinite' />
            </ellipse>
          </g>
        );
    }
  };

  const currentTheme = themes[theme];

  // Get background image based on level
  const getBackgroundImage = () => {
    // Use level 1-5, cycling back to level 5 for higher levels
    const bgLevel = Math.min(level, 5);
    return `/images/loop-bg/level${bgLevel}.svg`;
  };

  // Prevent hydration issues - only render on client
  if (!isMounted) {
    return (
      <div className='relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
        <div className='text-white text-2xl'>Loading game...</div>
      </div>
    );
  }

  return (
    <div className='relative w-full h-full flex flex-col items-center justify-center'>
      {/* Arcade Machine Border & Game Canvas */}
      <div className='relative w-full h-full flex items-center justify-center p-4'>
        {/* Arcade Machine Frame */}
        <div className='relative max-w-[1200px] max-h-[700px] w-full h-full'>
          {/* Outer Frame - Wood texture */}
          <div
            className='absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 rounded-3xl shadow-2xl'
            style={{
              boxShadow:
                '0 0 0 8px #422006, 0 0 0 12px #78350f, inset 0 0 30px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.8)',
            }}
          ></div>

          {/* CRT Screen Effect Border */}
          <div
            className='absolute inset-6 rounded-lg overflow-hidden'
            style={{
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
              border: '2px solid rgba(0,255,255,0.2)',
            }}
          >
            {/* Game Canvas */}
            <div className='relative w-full h-full flex items-center justify-center bg-black overflow-hidden'>
              {/* Parallax Background Image - Scrolling */}
              <div
                className='absolute inset-0 w-full h-full'
                style={{
                  backgroundImage: `url('${getBackgroundImage()}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: `${-bgImageOffset * 0.3}px center`,
                  backgroundRepeat: 'repeat-x',
                  opacity: 0.6,
                  filter: 'brightness(0.7)',
                }}
              />

              {/* Dark overlay to maintain game visibility */}
              <div className='absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40' />

              {/* Stats Overlay */}
              <div className='absolute top-4 left-4 right-20 flex justify-between items-start z-10'>
                <div className='bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-xl'>
                  <div className='text-white font-bold text-2xl mb-1'>Score: {score}</div>
                  <div className='text-white/80 text-sm'>High Score: {highScore}</div>
                  <div className='text-cyan-400 text-sm font-semibold'>Level: {level}</div>
                  <div className='text-purple-400 text-xs font-semibold mt-1'>
                    {SPEED_CONFIGS[speedMode].label}
                  </div>
                  {/* Power-up status indicator */}
                  {isPoweredUp && (
                    <div className='text-yellow-400 text-xs font-bold mt-2 animate-pulse'>
                      ⚡ Energy Aura! Extra Life!
                    </div>
                  )}
                  {/* Invulnerability indicator */}
                  {Date.now() < invulnerableUntil && (
                    <div className='text-green-400 text-xs font-bold mt-2 animate-pulse'>
                      🛡️ Safe Zone! {Math.ceil((invulnerableUntil - Date.now()) / 1000)}s
                    </div>
                  )}
                </div>

                <div className='bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-xl'>
                  <div className='text-white/80 text-xs mb-2 font-semibold'>Controls:</div>
                  <div className='text-white text-xs space-y-1'>
                    <div>⬆️ SPACE/↑: Jump (x2!)</div>
                    <div>⬇️ ↓: Crouch / Ground Slam</div>
                    <div>➡️ →: Speed Up</div>
                    <div>⬅️ ←: Slow Down</div>
                    <div>⏸️ ESC: Pause</div>
                  </div>
                </div>
              </div>

              {/* Game SVG */}
              <svg
                className='w-full h-full relative z-10'
                viewBox='0 0 800 400'
                preserveAspectRatio='xMidYMid slice'
                style={{
                  background: 'transparent',
                }}
              >
                {/* Ground */}
                <rect
                  x='0'
                  y={GROUND_Y + PLAYER_HEIGHT}
                  width='800'
                  height='100'
                  className={currentTheme.ground}
                />
                <rect
                  x='0'
                  y={GROUND_Y + PLAYER_HEIGHT + 10}
                  width='800'
                  height='90'
                  className={currentTheme.accent}
                />

                {/* Ground decoration - Metal panels and tech lines */}
                {[...Array(20)].map((_, i) => (
                  <g key={`ground-${i}`}>
                    {/* Metal panel */}
                    <rect
                      x={(bgOffset + i * 40) % 800}
                      y={GROUND_Y + PLAYER_HEIGHT - 5}
                      width='35'
                      height='5'
                      className='fill-cyan-400'
                      opacity='0.15'
                    />
                    {/* Tech detail lines */}
                    <line
                      x1={(bgOffset + i * 40 + 5) % 800}
                      y1={GROUND_Y + PLAYER_HEIGHT - 3}
                      x2={(bgOffset + i * 40 + 30) % 800}
                      y2={GROUND_Y + PLAYER_HEIGHT - 3}
                      stroke='#00FFFF'
                      strokeWidth='0.5'
                      opacity='0.3'
                    />
                  </g>
                ))}

                {/* Coins */}
                {coins
                  .filter(c => !c.collected)
                  .map(coin => (
                    <g key={coin.id} transform={`translate(${coin.x}, ${coin.y})`}>
                      <circle
                        cx='10'
                        cy='10'
                        r='10'
                        className='fill-yellow-400'
                        stroke='#FFA500'
                        strokeWidth='2'
                      />
                      <text
                        x='10'
                        y='14'
                        textAnchor='middle'
                        className='fill-orange-600 font-bold text-xs'
                      >
                        $
                      </text>
                    </g>
                  ))}

                {/* Power-Ups - Plasma Ball */}
                {powerUps
                  .filter(p => !p.collected)
                  .map(powerUp => (
                    <g key={powerUp.id} transform={`translate(${powerUp.x}, ${powerUp.y})`}>
                      {/* Outer glow pulse */}
                      <circle cx='15' cy='15' r='20' className='fill-cyan-400' opacity='0.2'>
                        <animate
                          attributeName='r'
                          values='20;25;20'
                          dur='0.8s'
                          repeatCount='indefinite'
                        />
                        <animate
                          attributeName='opacity'
                          values='0.2;0.4;0.2'
                          dur='0.8s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      {/* Middle glow */}
                      <circle cx='15' cy='15' r='16' className='fill-blue-400' opacity='0.4'>
                        <animate
                          attributeName='r'
                          values='16;18;16'
                          dur='0.6s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      {/* Electric arcs */}
                      <path
                        d='M 15 3 Q 12 8 15 15'
                        stroke='#00FFFF'
                        strokeWidth='1.5'
                        fill='none'
                        opacity='0.8'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.8;0.3;0.8'
                          dur='0.3s'
                          repeatCount='indefinite'
                        />
                      </path>
                      <path
                        d='M 27 15 Q 22 12 15 15'
                        stroke='#FFFFFF'
                        strokeWidth='1.5'
                        fill='none'
                        opacity='0.7'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.7;0.3;0.7'
                          dur='0.4s'
                          repeatCount='indefinite'
                        />
                      </path>
                      <path
                        d='M 15 27 Q 18 22 15 15'
                        stroke='#00FFFF'
                        strokeWidth='1.5'
                        fill='none'
                        opacity='0.6'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.6;0.3;0.6'
                          dur='0.35s'
                          repeatCount='indefinite'
                        />
                      </path>
                      <path
                        d='M 3 15 Q 8 18 15 15'
                        stroke='#FFFFFF'
                        strokeWidth='1.5'
                        fill='none'
                        opacity='0.8'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.8;0.3;0.8'
                          dur='0.45s'
                          repeatCount='indefinite'
                        />
                      </path>
                      {/* Energy particles */}
                      <circle cx='10' cy='8' r='1.5' className='fill-cyan-300'>
                        <animate
                          attributeName='cy'
                          values='8;5;8'
                          dur='0.6s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      <circle cx='20' cy='22' r='1.5' className='fill-white'>
                        <animate
                          attributeName='cy'
                          values='22;25;22'
                          dur='0.7s'
                          repeatCount='indefinite'
                        />
                      </circle>
                    </g>
                  ))}

                {/* Obstacles */}
                {obstacles.map(renderObstacle)}

                {/* Player - Dynamic Character */}
                <g transform={`translate(${PLAYER_X}, ${isDucking ? GROUND_Y : playerY})`}>
                  {/* Invulnerability shield */}
                  {Date.now() < invulnerableUntil && (
                    <g>
                      <circle cx='25' cy='20' r='35' className='fill-cyan-400' opacity='0.2'>
                        <animate
                          attributeName='r'
                          from='30'
                          to='40'
                          dur='1s'
                          repeatCount='indefinite'
                        />
                        <animate
                          attributeName='opacity'
                          from='0.3'
                          to='0.1'
                          dur='1s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      <circle
                        cx='25'
                        cy='20'
                        r='32'
                        stroke='#00FFFF'
                        strokeWidth='2'
                        fill='none'
                        opacity='0.6'
                      >
                        <animate
                          attributeName='r'
                          from='28'
                          to='38'
                          dur='1.5s'
                          repeatCount='indefinite'
                        />
                        <animate
                          attributeName='opacity'
                          from='0.8'
                          to='0.2'
                          dur='1.5s'
                          repeatCount='indefinite'
                        />
                      </circle>
                    </g>
                  )}

                  {/* Character or Plasma Ball when ducking */}
                  {isDucking ? (
                    // Plasma Ball Form when ducking
                    <g transform='translate(10, 15)'>
                      {/* Outer glow pulse */}
                      <circle cx='15' cy='15' r='25' className='fill-cyan-400' opacity='0.2'>
                        <animate
                          attributeName='r'
                          values='25;30;25'
                          dur='0.4s'
                          repeatCount='indefinite'
                        />
                        <animate
                          attributeName='opacity'
                          values='0.2;0.4;0.2'
                          dur='0.4s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      {/* Middle glow */}
                      <circle cx='15' cy='15' r='20' className='fill-blue-400' opacity='0.5'>
                        <animate
                          attributeName='r'
                          values='20;22;20'
                          dur='0.3s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      {/* Core plasma ball */}
                      <circle
                        cx='15'
                        cy='15'
                        r='15'
                        className='fill-cyan-300'
                        stroke='#00FFFF'
                        strokeWidth='2'
                        opacity='0.9'
                      />
                      <circle cx='15' cy='15' r='12' className='fill-blue-500' opacity='0.8' />
                      <circle cx='15' cy='15' r='9' className='fill-white' opacity='0.9'>
                        <animate
                          attributeName='opacity'
                          values='0.9;0.6;0.9'
                          dur='0.5s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      {/* Electric arcs - faster animation for speed effect */}
                      <path
                        d='M 15 0 Q 12 7 15 15'
                        stroke='#00FFFF'
                        strokeWidth='2'
                        fill='none'
                        opacity='0.8'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.8;0.2;0.8'
                          dur='0.2s'
                          repeatCount='indefinite'
                        />
                      </path>
                      <path
                        d='M 30 15 Q 23 12 15 15'
                        stroke='#FFFFFF'
                        strokeWidth='2'
                        fill='none'
                        opacity='0.7'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.7;0.2;0.7'
                          dur='0.25s'
                          repeatCount='indefinite'
                        />
                      </path>
                      <path
                        d='M 15 30 Q 18 23 15 15'
                        stroke='#00FFFF'
                        strokeWidth='2'
                        fill='none'
                        opacity='0.6'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.6;0.2;0.6'
                          dur='0.22s'
                          repeatCount='indefinite'
                        />
                      </path>
                      <path
                        d='M 0 15 Q 7 18 15 15'
                        stroke='#FFFFFF'
                        strokeWidth='2'
                        fill='none'
                        opacity='0.8'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.8;0.2;0.8'
                          dur='0.28s'
                          repeatCount='indefinite'
                        />
                      </path>
                      {/* Energy particles spinning */}
                      <circle cx='10' cy='8' r='2' className='fill-cyan-300'>
                        <animate
                          attributeName='cy'
                          values='8;5;8'
                          dur='0.3s'
                          repeatCount='indefinite'
                        />
                        <animate
                          attributeName='cx'
                          values='10;12;10'
                          dur='0.4s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      <circle cx='20' cy='22' r='2' className='fill-white'>
                        <animate
                          attributeName='cy'
                          values='22;25;22'
                          dur='0.35s'
                          repeatCount='indefinite'
                        />
                        <animate
                          attributeName='cx'
                          values='20;18;20'
                          dur='0.3s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      <circle cx='8' cy='15' r='1.5' className='fill-cyan-400'>
                        <animate
                          attributeName='cx'
                          values='8;5;8'
                          dur='0.4s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      <circle cx='22' cy='15' r='1.5' className='fill-blue-300'>
                        <animate
                          attributeName='cx'
                          values='22;25;22'
                          dur='0.45s'
                          repeatCount='indefinite'
                        />
                      </circle>
                      {/* Speed trail effect */}
                      <ellipse
                        cx='-5'
                        cy='10'
                        rx='8'
                        ry='12'
                        className='fill-cyan-400'
                        opacity='0.3'
                      >
                        <animate
                          attributeName='opacity'
                          values='0.3;0.1;0.3'
                          dur='0.3s'
                          repeatCount='indefinite'
                        />
                      </ellipse>
                    </g>
                  ) : (
                    // Normal Character Form
                    <g>
                      {/* Powered-Up Energy Aura - Purple Neon Effect */}
                      {isPoweredUp && (
                        <g>
                          {/* Outer energy ring - purple neon glow */}
                          <circle cx='25' cy='20' r='40' className='fill-purple-400' opacity='0.2'>
                            <animate
                              attributeName='r'
                              values='40;45;40'
                              dur='1.2s'
                              repeatCount='indefinite'
                            />
                            <animate
                              attributeName='opacity'
                              values='0.2;0.35;0.2'
                              dur='1.2s'
                              repeatCount='indefinite'
                            />
                          </circle>

                          {/* Middle energy ring - magenta */}
                          <circle
                            cx='25'
                            cy='20'
                            r='35'
                            className='fill-fuchsia-500'
                            opacity='0.25'
                          >
                            <animate
                              attributeName='r'
                              values='35;38;35'
                              dur='1s'
                              repeatCount='indefinite'
                            />
                            <animate
                              attributeName='opacity'
                              values='0.25;0.4;0.25'
                              dur='1s'
                              repeatCount='indefinite'
                            />
                          </circle>

                          {/* Inner power ring - bright neon purple */}
                          <circle
                            cx='25'
                            cy='20'
                            r='32'
                            stroke='#A855F7'
                            strokeWidth='2'
                            fill='none'
                            opacity='0.7'
                          >
                            <animate
                              attributeName='r'
                              values='30;34;30'
                              dur='0.8s'
                              repeatCount='indefinite'
                            />
                            <animate
                              attributeName='opacity'
                              values='0.7;1;0.7'
                              dur='0.8s'
                              repeatCount='indefinite'
                            />
                          </circle>

                          {/* Rotating energy particles */}
                          <g>
                            {/* Particle 1 - Purple */}
                            <circle cx='45' cy='20' r='3' className='fill-purple-400' opacity='0.9'>
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='3s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.4;0.9'
                                dur='1.5s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            {/* Particle glow 1 */}
                            <circle cx='45' cy='20' r='5' className='fill-purple-300' opacity='0.5'>
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='3s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='r'
                                values='5;7;5'
                                dur='1.5s'
                                repeatCount='indefinite'
                              />
                            </circle>

                            {/* Particle 2 - Pink */}
                            <circle cx='5' cy='20' r='3' className='fill-pink-400' opacity='0.9'>
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='3s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.4;0.9'
                                dur='1.5s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            {/* Particle glow 2 */}
                            <circle cx='5' cy='20' r='5' className='fill-pink-300' opacity='0.5'>
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='3s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='r'
                                values='5;7;5'
                                dur='1.5s'
                                repeatCount='indefinite'
                              />
                            </circle>

                            {/* Particle 3 - Violet */}
                            <circle cx='25' cy='0' r='3' className='fill-violet-400' opacity='0.9'>
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='3s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.4;0.9'
                                dur='1.5s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            {/* Particle glow 3 */}
                            <circle cx='25' cy='0' r='5' className='fill-violet-300' opacity='0.5'>
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='3s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='r'
                                values='5;7;5'
                                dur='1.5s'
                                repeatCount='indefinite'
                              />
                            </circle>

                            {/* Particle 4 - Fuchsia */}
                            <circle
                              cx='25'
                              cy='40'
                              r='3'
                              className='fill-fuchsia-400'
                              opacity='0.9'
                            >
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='3s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.4;0.9'
                                dur='1.5s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            {/* Particle glow 4 */}
                            <circle
                              cx='25'
                              cy='40'
                              r='5'
                              className='fill-fuchsia-300'
                              opacity='0.5'
                            >
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='3s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='r'
                                values='5;7;5'
                                dur='1.5s'
                                repeatCount='indefinite'
                              />
                            </circle>
                          </g>

                          {/* Counter-rotating energy particles (faster) */}
                          <g>
                            {/* Diagonal particle 1 */}
                            <circle
                              cx='40'
                              cy='5'
                              r='2.5'
                              className='fill-purple-300'
                              opacity='0.9'
                            >
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='360 25 20'
                                to='0 25 20'
                                dur='2s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            {/* Diagonal particle 2 */}
                            <circle cx='10' cy='35' r='2.5' className='fill-pink-300' opacity='0.9'>
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='360 25 20'
                                to='0 25 20'
                                dur='2s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            {/* Diagonal particle 3 */}
                            <circle
                              cx='40'
                              cy='35'
                              r='2.5'
                              className='fill-fuchsia-300'
                              opacity='0.9'
                            >
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='360 25 20'
                                to='0 25 20'
                                dur='2s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            {/* Diagonal particle 4 */}
                            <circle
                              cx='10'
                              cy='5'
                              r='2.5'
                              className='fill-violet-300'
                              opacity='0.9'
                            >
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='360 25 20'
                                to='0 25 20'
                                dur='2s'
                                repeatCount='indefinite'
                              />
                            </circle>
                          </g>

                          {/* Floating sparkles around character */}
                          <g>
                            <circle cx='15' cy='5' r='1.5' className='fill-white' opacity='0.9'>
                              <animate
                                attributeName='cy'
                                values='5;0;5'
                                dur='2s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.3;0.9'
                                dur='2s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            <circle cx='35' cy='10' r='1.5' className='fill-cyan-200' opacity='0.9'>
                              <animate
                                attributeName='cy'
                                values='10;5;10'
                                dur='1.8s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.3;0.9'
                                dur='1.8s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            <circle cx='10' cy='25' r='1.5' className='fill-white' opacity='0.9'>
                              <animate
                                attributeName='cy'
                                values='25;20;25'
                                dur='2.2s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.3;0.9'
                                dur='2.2s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            <circle
                              cx='40'
                              cy='25'
                              r='1.5'
                              className='fill-purple-200'
                              opacity='0.9'
                            >
                              <animate
                                attributeName='cy'
                                values='25;30;25'
                                dur='1.9s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.3;0.9'
                                dur='1.9s'
                                repeatCount='indefinite'
                              />
                            </circle>
                            <circle cx='25' cy='3' r='1.5' className='fill-pink-200' opacity='0.9'>
                              <animate
                                attributeName='cy'
                                values='3;-2;3'
                                dur='2.1s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.9;0.3;0.9'
                                dur='2.1s'
                                repeatCount='indefinite'
                              />
                            </circle>
                          </g>

                          {/* Energy burst effect - Star shape */}
                          <g opacity='0.4'>
                            <path
                              d='M 25 10 L 27 15 L 32 15 L 28 19 L 30 24 L 25 21 L 20 24 L 22 19 L 18 15 L 23 15 Z'
                              className='fill-purple-400'
                            >
                              <animateTransform
                                attributeName='transform'
                                type='rotate'
                                from='0 25 20'
                                to='360 25 20'
                                dur='4s'
                                repeatCount='indefinite'
                              />
                              <animate
                                attributeName='opacity'
                                values='0.4;0.7;0.4'
                                dur='2s'
                                repeatCount='indefinite'
                              />
                            </path>
                          </g>
                        </g>
                      )}

                      {/* Character Sprite - Running Animation */}
                      <foreignObject
                        x='-15'
                        y='-15'
                        width={PLAYER_WIDTH + 30}
                        height={PLAYER_HEIGHT + 30}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            transformOrigin: 'bottom center',
                            overflow: 'visible',
                          }}
                        >
                          <Image
                            src={`/images/sprites/run/${runningFrame + 1}.png`}
                            alt='Running character'
                            width={PLAYER_WIDTH - 10}
                            height={PLAYER_HEIGHT - 10}
                            style={{
                              objectFit: 'contain',
                              imageRendering: 'pixelated',
                              transformOrigin: 'bottom center',
                              transition: 'transform 0.15s ease-out',
                              maxWidth: 'none',
                              filter:
                                Date.now() < invulnerableUntil
                                  ? 'drop-shadow(0 0 10px rgba(0,255,255,0.8)) drop-shadow(0 3px 6px rgba(0,0,0,0.4))'
                                  : isPoweredUp
                                    ? 'drop-shadow(0 0 15px rgba(168,85,247,0.9)) drop-shadow(0 0 25px rgba(217,70,239,0.6)) drop-shadow(0 3px 6px rgba(0,0,0,0.4)) brightness(1.15) saturate(1.2)'
                                    : 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
                            }}
                            priority
                          />
                        </div>
                      </foreignObject>

                      {/* Sweat/Speed effect droplets around character - Rendered on top */}
                      {gameState === 'playing' && (
                        <g>
                          {/* Speed line 1 */}
                          <line
                            x1='15'
                            y1='0'
                            x2='5'
                            y2='2'
                            stroke='#FFFFFF'
                            strokeWidth='1.5'
                            opacity='0.4'
                          >
                            <animate
                              attributeName='opacity'
                              values='0.4;0.6;0'
                              dur='0.5s'
                              repeatCount='indefinite'
                            />
                            <animate
                              attributeName='x1'
                              values='15;10;5'
                              dur='0.5s'
                              repeatCount='indefinite'
                            />
                          </line>
                          {/* Speed line 2 */}
                          <line
                            x1='18'
                            y1='5'
                            x2='8'
                            y2='7'
                            stroke='#00FFFF'
                            strokeWidth='1.5'
                            opacity='0.3'
                          >
                            <animate
                              attributeName='opacity'
                              values='0.3;0.5;0'
                              dur='0.6s'
                              repeatCount='indefinite'
                              begin='0.1s'
                            />
                            <animate
                              attributeName='x1'
                              values='18;12;6'
                              dur='0.6s'
                              repeatCount='indefinite'
                              begin='0.1s'
                            />
                          </line>
                        </g>
                      )}
                    </g>
                  )}
                  {/* Double jump indicator */}
                  {jumpCount === 2 && (
                    <g>
                      <circle cx='20' cy='25' r='15' className='fill-cyan-400' opacity='0.3'>
                        <animate attributeName='r' from='15' to='25' dur='0.3s' repeatCount='1' />
                        <animate
                          attributeName='opacity'
                          from='0.5'
                          to='0'
                          dur='0.3s'
                          repeatCount='1'
                        />
                      </circle>
                    </g>
                  )}
                </g>
              </svg>

              {/* Ready Screen */}
              {gameState === 'ready' && (
                <div className='absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40'>
                  <div className='text-center bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-3xl border-2 border-cyan-400/30 max-w-2xl w-full mx-4 shadow-2xl'>
                    {/* Title */}
                    <h1 className='text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-3'>
                      {gameTitle}
                    </h1>

                    {/* Quick Info */}
                    <div className='bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-3 mb-4 border border-purple-400/30'>
                      <p className='text-cyan-300 font-semibold text-sm'>
                        🎯 Level up every 1,000 points • 🧠 Answer Web3 quizzes
                      </p>
                    </div>

                    {/* Current Speed Mode Indicator */}
                    <div className='bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl p-3 mb-4 border border-cyan-400/30'>
                      <div className='flex items-center justify-center gap-2'>
                        <span className='text-white/70 text-sm'>Current Speed:</span>
                        <span className='text-cyan-300 font-bold text-sm'>
                          {SPEED_CONFIGS[speedMode].label}
                        </span>
                      </div>
                      <p className='text-white/50 text-xs mt-1'>
                        ⚙️ Change speed when starting or replaying
                      </p>
                    </div>

                    {/* Compact Controls */}
                    <div className='bg-black/30 rounded-xl p-4 mb-4 border border-white/10'>
                      <div className='grid grid-cols-2 gap-2 text-white/70 text-xs'>
                        <div className='flex items-center gap-1.5'>
                          <span>⬆️</span>
                          <span>Jump (x2!)</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <span>⬇️</span>
                          <span>Crouch / Slam</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <span>➡️</span>
                          <span>Speed Up</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <span>⬅️</span>
                          <span>Slow Down</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost & Balance */}
                    <div className='bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl p-4 mb-4 border-2 border-purple-400/50'>
                      <div className='flex items-center justify-between'>
                        <div className='text-white/80 text-sm font-semibold'>💰 Cost:</div>
                        <div className='text-yellow-400 font-bold text-2xl'>
                          {GAME_COSTS.INITIAL} Points
                        </div>
                      </div>
                      {account &&
                        (() => {
                          const currentPoints =
                            account.totalPoints || account.profile?.totalPoints || 0;
                          return (
                            <div className='flex items-center justify-between mt-2 pt-2 border-t border-white/20'>
                              <div className='text-white/80 text-sm'>Balance:</div>
                              <div
                                className={`font-bold text-xl ${currentPoints >= GAME_COSTS.INITIAL ? 'text-green-400' : 'text-red-400'}`}
                              >
                                {currentPoints} pts
                              </div>
                            </div>
                          );
                        })()}
                    </div>

                    {/* Start Button */}
                    <button
                      onClick={() => {
                        if (
                          !account ||
                          (account.totalPoints || account.profile?.totalPoints || 0) <
                            GAME_COSTS.INITIAL
                        ) {
                          return;
                        }
                        setShowStartConfirmation(true);
                      }}
                      disabled={
                        !account ||
                        (account &&
                          (account.totalPoints || account.profile?.totalPoints || 0) <
                            GAME_COSTS.INITIAL)
                      }
                      className={`w-full px-10 py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold text-2xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/50 ${
                        !account ||
                        (account &&
                          (account.totalPoints || account.profile?.totalPoints || 0) <
                            GAME_COSTS.INITIAL)
                          ? 'opacity-50 cursor-not-allowed animate-none'
                          : 'animate-pulse'
                      }`}
                    >
                      🚀 START GAME
                    </button>

                    {/* Warning Messages */}
                    {!account && (
                      <p className='text-yellow-300 text-xs mt-3'>🔒 Connect wallet to play</p>
                    )}
                    {account &&
                      (account.totalPoints || account.profile?.totalPoints || 0) <
                        GAME_COSTS.INITIAL && (
                        <p className='text-red-300 text-xs mt-3'>
                          💰 Need{' '}
                          {GAME_COSTS.INITIAL -
                            (account.totalPoints || account.profile?.totalPoints || 0)}{' '}
                          more points
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Web3 Quiz Modal */}
              {showQuiz && gameState === 'paused' && (
                <div className='absolute inset-0 flex items-center justify-center z-50'>
                  <div className='text-center bg-gradient-to-br from-purple-900/90 to-cyan-900/90 p-6 rounded-3xl border-2 border-cyan-400/50 max-w-xl w-full mx-4 shadow-2xl'>
                    {/* Header */}
                    <h2 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2'>
                      🧠 Level Up Challenge!
                    </h2>
                    <p className='text-cyan-300 text-sm mb-4'>
                      Answer correctly → Level {level + 1}
                    </p>

                    {!quizAnswered ? (
                      <>
                        <div className='bg-black/30 rounded-xl p-5 mb-4 border border-cyan-400/30'>
                          <h3 className='text-white text-lg font-semibold mb-4'>
                            {quizQuestions[currentQuestion].question}
                          </h3>

                          <div className='space-y-2'>
                            {quizQuestions[currentQuestion].options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  const isCorrect =
                                    index === quizQuestions[currentQuestion].correctAnswer;
                                  setQuizAnswered(true);
                                  setIsAnswerCorrect(isCorrect);

                                  if (isCorrect) {
                                    // Play win sound for correct answer
                                    if (winSoundRef.current) {
                                      winSoundRef.current.currentTime = 0;
                                      winSoundRef.current.play().catch(() => {});
                                    }

                                    // Correct answer - level up!
                                    setLevel(l => {
                                      const newLevel = l + 1;

                                      // Increase base speed
                                      setBaseSpeed(s => Math.min(s + 1, 10));
                                      setGameSpeed(s => Math.min(s + 1, 10));

                                      // Change theme
                                      if (newLevel === 2) setTheme('sunset');
                                      else if (newLevel === 3) setTheme('night');
                                      else if (newLevel >= 4) setTheme('cyber');

                                      // Reset background offsets for smooth transition
                                      setBgOffset(0);
                                      setBgImageOffset(0);

                                      // Give invulnerability after level up
                                      setInvulnerableUntil(
                                        Date.now() + TIMING_CONFIG.LEVEL_UP_INVULNERABILITY_MS
                                      );

                                      // Clear existing obstacles for fair start
                                      setObstacles([]);

                                      // Reset power-up spawn for new level
                                      setPowerUpSpawnedThisLevel(false);
                                      lastPowerUpRef.current = 0;

                                      // Post achievement to chat
                                      if (account && newLevel >= 3) {
                                        setTimeout(() => {
                                          gameSocialService
                                            .sendGameMessage(
                                              gameId,
                                              account.id,
                                              account.profile?.username ||
                                                account.profile?.displayName ||
                                                'Anonymous',
                                              `Reached Level ${newLevel}! 🎉`,
                                              'achievement'
                                            )
                                            .catch(() => {});
                                        }, 500);
                                      }

                                      return newLevel;
                                    });
                                  } else {
                                    // Wrong answer - still give safe zone to resume
                                    setInvulnerableUntil(
                                      Date.now() + TIMING_CONFIG.WRONG_ANSWER_INVULNERABILITY_MS
                                    );
                                  }
                                }}
                                className='w-full p-3 text-left rounded-lg border-2 border-white/20 hover:border-cyan-400/50 bg-white/5 hover:bg-cyan-500/20 text-white text-sm font-medium transition-all duration-200 transform hover:scale-102'
                              >
                                <span className='mr-2 font-bold'>
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className='bg-black/30 rounded-xl p-5 mb-4 border-2 border-cyan-400/50'>
                          <h3
                            className={`text-2xl font-bold mb-3 ${isAnswerCorrect ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {isAnswerCorrect ? '✅ Correct!' : '❌ Incorrect'}
                          </h3>
                          <p className='text-white/80 text-sm mb-3'>
                            {quizQuestions[currentQuestion].explanation}
                          </p>
                          {isAnswerCorrect ? (
                            <div className='bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg p-3 border border-cyan-400/30'>
                              <p className='text-cyan-300 font-bold text-lg'>
                                🎊 Level {level} Unlocked!
                              </p>
                              <p className='text-white/70 text-xs mt-1'>
                                ⚡ Speed up {level === 2 && '• 🌅 Sunset'}
                                {level === 3 && '• 🌙 Night'}
                                {level >= 4 && '• 🌐 Cyber'} • 🛡️ 4s safe zone
                              </p>
                            </div>
                          ) : (
                            <div className='bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg p-3 border border-red-400/30'>
                              <p className='text-red-300 font-bold text-lg'>💪 Keep Trying!</p>
                              <p className='text-white/70 text-xs mt-1'>
                                Same level • 🛡️ 2s safe zone
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setShowQuiz(false);
                            setGameState('playing');
                            levelTimerRef.current = 0;
                          }}
                          className='w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl transition-all duration-200 transform hover:scale-105'
                        >
                          ▶️ Continue Playing
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Paused Screen (only show if not showing quiz) */}
              {gameState === 'paused' && !showQuiz && (
                <div className='absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50'>
                  <div className='text-center bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-3xl border border-white/20 w-full max-w-md mx-4'>
                    <h2 className='text-3xl font-bold text-white mb-2'>⏸️ PAUSED</h2>
                    <p className='text-white/70 text-sm mb-6'>Press ESC to continue</p>
                    <div className='space-y-2'>
                      <button
                        onClick={() => setGameState('playing')}
                        className='w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl transition-all duration-200 transform hover:scale-105'
                      >
                        ▶️ Continue
                      </button>
                      <button
                        onClick={() => {
                          if (embedded) {
                            // If embedded, just reset to ready state
                            setGameState('ready');
                            setScore(0);
                            setLevel(1);
                            setObstacles([]);
                            setCoins([]);
                          } else {
                            // If standalone, navigate back
                            router.push(`/mini-games/${gameId}`);
                          }
                        }}
                        className='w-full px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-lg border border-white/20 transition-all duration-200'
                      >
                        🏠 {embedded ? 'Back to Start' : 'Exit to Menu'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Over Screen */}
              {gameState === 'gameOver' && (
                <div className='absolute inset-0 flex items-center justify-center z-50'>
                  <div className='text-center bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-3xl border border-white/20 max-w-lg w-full mx-4'>
                    {/* Header */}
                    <div className='text-5xl mb-3'>💀</div>
                    <h2 className='text-3xl font-bold text-white mb-4'>Game Over!</h2>

                    {/* Stats Grid - Compact */}
                    <div className='bg-white/5 rounded-xl p-4 mb-4'>
                      <div className='grid grid-cols-2 gap-3 text-white'>
                        <div>
                          <div className='text-white/60 text-xs'>Score</div>
                          <div className='text-2xl font-bold'>{score}</div>
                        </div>
                        <div>
                          <div className='text-white/60 text-xs'>Level</div>
                          <div className='text-2xl font-bold'>{level}</div>
                        </div>
                        <div>
                          <div className='text-white/60 text-xs'>High Score</div>
                          <div className='text-xl font-bold text-yellow-400'>{highScore}</div>
                        </div>
                        <div>
                          <div className='text-white/60 text-xs'>XP Earned</div>
                          <div className='text-xl font-bold text-cyan-400'>+{xpEarned}</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Save Status - Compact */}
                    {account && progressSaved && (
                      <div className='bg-green-500/20 rounded-lg p-2 mb-4 border border-green-400/30'>
                        <div className='flex items-center justify-center gap-2 text-green-400 text-sm'>
                          <span>✅</span>
                          <span className='font-semibold'>Progress saved!</span>
                        </div>
                      </div>
                    )}

                    {/* Play Again Cost - More Compact */}
                    <div className='bg-gradient-to-r from-green-600/30 to-cyan-600/30 rounded-xl p-3 mb-4 border-2 border-green-400/50'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='text-white/80 text-xs'>Play Again</div>
                          <div className='text-green-300 text-xs'>⚡ 80% cheaper!</div>
                        </div>
                        <div className='text-green-400 font-bold text-2xl'>💰 100</div>
                      </div>
                      {account &&
                        (() => {
                          const currentPoints =
                            account.totalPoints || account.profile?.totalPoints || 0;
                          return (
                            <div className='flex items-center justify-between mt-2 pt-2 border-t border-white/20'>
                              <div className='text-white/80 text-xs'>Balance:</div>
                              <div
                                className={`font-bold text-lg ${currentPoints >= GAME_COSTS.REPLAY ? 'text-green-400' : 'text-red-400'}`}
                              >
                                {currentPoints} pts
                              </div>
                            </div>
                          );
                        })()}
                    </div>

                    {/* Buttons - Compact */}
                    <div className='space-y-2'>
                      <button
                        onClick={() => {
                          if (
                            !account ||
                            (account.totalPoints || account.profile?.totalPoints || 0) <
                              GAME_COSTS.REPLAY
                          ) {
                            return;
                          }
                          setShowReplayConfirmation(true);
                        }}
                        disabled={
                          !account ||
                          (account &&
                            (account.totalPoints || account.profile?.totalPoints || 0) <
                              GAME_COSTS.REPLAY)
                        }
                        className={`w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all duration-200 transform hover:scale-105 ${
                          !account ||
                          (account &&
                            (account.totalPoints || account.profile?.totalPoints || 0) <
                              GAME_COSTS.REPLAY)
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        🔄 Play Again
                      </button>
                      {!account && (
                        <p className='text-yellow-300 text-xs text-center'>🔒 Connect wallet</p>
                      )}
                      {account &&
                        (account.totalPoints || account.profile?.totalPoints || 0) <
                          GAME_COSTS.REPLAY && (
                          <p className='text-red-300 text-xs text-center'>
                            💰 Need{' '}
                            {GAME_COSTS.REPLAY -
                              (account.totalPoints || account.profile?.totalPoints || 0)}{' '}
                            more pts
                          </p>
                        )}
                      <button
                        onClick={() => {
                          if (embedded) {
                            // If embedded, scroll to top and reset game
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            setTimeout(() => {
                              setGameState('ready');
                              setScore(0);
                              setLevel(1);
                              setObstacles([]);
                              setCoins([]);
                            }, 300);
                          } else {
                            // If standalone, navigate back
                            router.push(`/mini-games/${gameId}`);
                          }
                        }}
                        className='w-full px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-lg border border-white/20 transition-all duration-200'
                      >
                        🏠 {embedded ? 'Back to Start' : 'Exit to Menu'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Arcade Machine Details */}

          {/* Ventilation slots at bottom */}
          <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='w-1 h-3 bg-gray-900 rounded-sm' />
            ))}
          </div>
        </div>
      </div>

      {/* Start Game Confirmation Modal */}
      {showStartConfirmation && (
        <div className='absolute inset-0 flex items-center justify-center z-50'>
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
                  {GAME_COSTS.INITIAL} Points
                </div>
                <div className='text-white/70 text-xs'>
                  Your current balance: {account?.totalPoints || account?.profile?.totalPoints || 0}{' '}
                  points
                </div>
              </div>

              {/* Description */}
              <p className='text-white/80 text-sm mb-4 leading-relaxed'>
                Starting this game will deduct {GAME_COSTS.INITIAL} points from your account. You'll
                earn XP and rewards based on your performance!
              </p>

              {/* Speed Mode Selector */}
              <div className='bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-3 mb-6 border border-cyan-400/30'>
                <div className='text-cyan-300 text-xs mb-2 font-semibold text-center'>
                  ⚡ Game Speed
                </div>
                <div className='flex justify-center gap-2 mb-2'>
                  {(Object.keys(SPEED_CONFIGS) as SpeedMode[]).map(mode => {
                    const icon = SPEED_CONFIGS[mode].label.split(' ')[0]; // Extract emoji
                    return (
                      <button
                        key={mode}
                        onClick={() => setSpeedMode(mode)}
                        title={`${SPEED_CONFIGS[mode].label}\n${SPEED_CONFIGS[mode].description}`}
                        className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-200 ${
                          speedMode === mode
                            ? 'bg-gradient-to-r from-cyan-500/30 to-purple-600/30 border-cyan-400 shadow-lg scale-110'
                            : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 hover:scale-105'
                        }`}
                      >
                        <div className='text-2xl'>{icon}</div>
                        {speedMode === mode && (
                          <div className='absolute -top-1 -right-1 bg-cyan-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className='text-white/50 text-[10px] text-center'>
                  Hover to see speed names • Frame-rate normalized!
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
                    startGame(false);
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

      {/* Replay Game Confirmation Modal */}
      {showReplayConfirmation && (
        <div className='absolute inset-0 flex items-center justify-center z-50'>
          <div className='bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 rounded-3xl border-2 border-cyan-400/50 p-8 max-w-md w-full mx-4 shadow-2xl'>
            <div className='text-center'>
              {/* Icon */}
              <div className='text-6xl mb-4'>🔄</div>

              {/* Title */}
              <h2 className='text-3xl font-bold text-white mb-4'>Play Again?</h2>

              {/* Points Cost Info */}
              <div className='bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 mb-6 border border-green-400/30'>
                <div className='text-green-300 text-sm mb-2'>💰 Replay Cost</div>
                <div className='text-white text-3xl font-bold mb-1'>{GAME_COSTS.REPLAY} Points</div>
                <div className='text-white/70 text-xs'>
                  Your current balance: {account?.totalPoints || account?.profile?.totalPoints || 0}{' '}
                  points
                </div>
              </div>

              {/* Description */}
              <p className='text-white/80 text-sm mb-4 leading-relaxed'>
                Playing again will deduct {GAME_COSTS.REPLAY} points from your account. Try to beat
                your high score of {highScore} points!
              </p>

              {/* Speed Mode Selector */}
              <div className='bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-3 mb-6 border border-cyan-400/30'>
                <div className='text-cyan-300 text-xs mb-2 font-semibold text-center'>
                  ⚡ Game Speed
                </div>
                <div className='flex justify-center gap-2 mb-2'>
                  {(Object.keys(SPEED_CONFIGS) as SpeedMode[]).map(mode => {
                    const icon = SPEED_CONFIGS[mode].label.split(' ')[0]; // Extract emoji
                    return (
                      <button
                        key={mode}
                        onClick={() => setSpeedMode(mode)}
                        title={`${SPEED_CONFIGS[mode].label}\n${SPEED_CONFIGS[mode].description}`}
                        className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-200 ${
                          speedMode === mode
                            ? 'bg-gradient-to-r from-cyan-500/30 to-purple-600/30 border-cyan-400 shadow-lg scale-110'
                            : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 hover:scale-105'
                        }`}
                      >
                        <div className='text-2xl'>{icon}</div>
                        {speedMode === mode && (
                          <div className='absolute -top-1 -right-1 bg-cyan-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className='text-white/50 text-[10px] text-center'>
                  Hover to see speed names • Frame-rate normalized!
                </div>
              </div>

              {/* Buttons */}
              <div className='grid grid-cols-2 gap-3'>
                <button
                  onClick={() => setShowReplayConfirmation(false)}
                  className='px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowReplayConfirmation(false);
                    startGame(true);
                  }}
                  className='px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105'
                >
                  ✅ Confirm & Replay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Sidebar */}
      {isMounted && (
        <GameSidebar
          gameId={gameId}
          gameTitle={gameTitle}
          currentScore={score}
          currentLevel={level}
        />
      )}
    </div>
  );
};

export default InfiniteRunner;
