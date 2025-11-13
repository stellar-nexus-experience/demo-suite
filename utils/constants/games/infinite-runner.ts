// Infinite Runner Game Constants and Configuration

// ============================================================================
// Game Physics Constants
// ============================================================================
export const GAME_PHYSICS = {
  GRAVITY: 0.6,
  JUMP_FORCE: -12,
  DOUBLE_JUMP_FORCE: -11, // Slightly less powerful second jump
  GROUND_Y: 300,
  PLAYER_X: 100,
  PLAYER_WIDTH: 50,
  PLAYER_HEIGHT: 50,
  DUCKING_HEIGHT: 20, // Make ducking more effective (lower to ground)
  MAX_JUMPS: 2, // Allow double jump
  TARGET_FPS: 60, // Target frame rate for consistent gameplay
} as const;

// ============================================================================
// Speed Mode Configuration
// ============================================================================
export type SpeedMode = 'snail' | 'casual' | 'coffee' | 'rocket' | 'lightspeed';

export interface SpeedConfig {
  baseSpeed: number;
  label: string;
  description: string;
}

export const SPEED_CONFIGS: Record<SpeedMode, SpeedConfig> = {
  snail: {
    baseSpeed: 3,
    label: '🐌 Snail Mail',
    description: 'Perfect for beginners or a chill vibe',
  },
  casual: {
    baseSpeed: 4.5,
    label: '🚶 Casual Stroll',
    description: 'Nice and easy, no rush',
  },
  coffee: {
    baseSpeed: 6,
    label: '☕ Coffee Break',
    description: 'Just right - recommended!',
  },
  rocket: {
    baseSpeed: 8,
    label: '🚀 Rocket Fuel',
    description: 'Fast-paced action for pros',
  },
  lightspeed: {
    baseSpeed: 10,
    label: '⚡ Lightspeed',
    description: 'Insane mode - are you ready?',
  },
} as const;

// ============================================================================
// Game Cost Configuration
// ============================================================================
export const GAME_COSTS = {
  INITIAL: 250,
  REPLAY: 100,
} as const;

// ============================================================================
// Theme Configuration
// ============================================================================
export type ThemeType = 'day' | 'sunset' | 'night' | 'cyber';

export interface Theme {
  bg: string;
  ground: string;
  accent: string;
}

export const THEMES: Record<ThemeType, Theme> = {
  day: {
    bg: 'from-slate-800 via-slate-700 to-slate-900',
    ground: 'fill-gray-700',
    accent: 'fill-gray-900',
  },
  sunset: {
    bg: 'from-blue-900 via-indigo-900 to-slate-900',
    ground: 'fill-blue-900',
    accent: 'fill-indigo-950',
  },
  night: {
    bg: 'from-black via-slate-950 to-black',
    ground: 'fill-gray-800',
    accent: 'fill-black',
  },
  cyber: {
    bg: 'from-purple-900 via-pink-900 to-slate-900',
    ground: 'fill-purple-900',
    accent: 'fill-pink-950',
  },
} as const;

// ============================================================================
// Animation Configuration
// ============================================================================
export const ANIMATION_CONFIG = {
  RUNNING_FRAME_SPEED: 100, // milliseconds per frame
  TOTAL_RUNNING_FRAMES: 7, // We have 7 frames: 1.png through 7.png
} as const;

// ============================================================================
// Audio Configuration
// ============================================================================
export const AUDIO_CONFIG = {
  MENU_MUSIC: {
    path: '/sounds/infiniteRunner/game.mp3',
    volume: 0.3,
    loop: true,
  },
  WIN_SOUND: {
    path: '/sounds/infiniteRunner/win.mp3',
    volume: 0.5,
  },
  JUMP_SOUND: {
    path: '/sounds/infiniteRunner/jump.mp3',
    volume: 0.4,
  },
  LEVEL_UP_SOUND: {
    path: '/sounds/infiniteRunner/levelup.mp3',
    volume: 0.6,
  },
  GAME_OVER_SOUND: {
    path: '/sounds/infiniteRunner/gameover.mp3',
    volume: 0.5,
  },
  HIT_SOUND: {
    path: '/sounds/infiniteRunner/hit.mp3',
    volume: 0.5,
  },
  GRAB_COIN_SOUND: {
    path: '/sounds/infiniteRunner/grabcoin.mp3',
    volume: 0.4,
  },
  EXTRA_LIFE_SOUND: {
    path: '/sounds/infiniteRunner/extralife.mp3',
    volume: 0.6,
  },
  GROUND_SLAM_SOUND: {
    path: '/sounds/infiniteRunner/groundslam.mp3',
    volume: 0.5,
  },
  PLASMA_BALL_SOUND: {
    path: '/sounds/infiniteRunner/plasmaball.mp3',
    volume: 0.4,
  },
  SAFE_ZONE_SOUND: {
    path: '/sounds/infiniteRunner/safezone.mp3',
    volume: 0.3,
    loop: true,
  },
} as const;

// ============================================================================
// Game Scoring Configuration
// ============================================================================
export const SCORING_CONFIG = {
  COIN_VALUE: 50,
  LEVEL_UP_THRESHOLD: 1000, // Points needed per level
  XP_PER_SCORE: 10, // 1 XP per 10 score
  POINTS_PER_SCORE: 10, // 1 point per 10 score
} as const;

// ============================================================================
// Game Timing Configuration
// ============================================================================
export const TIMING_CONFIG = {
  INITIAL_INVULNERABILITY_MS: 5000, // 5 seconds at game start
  LEVEL_UP_INVULNERABILITY_MS: 4000, // 4 seconds after level up
  POWER_UP_LOST_INVULNERABILITY_MS: 2000, // 2 seconds after losing power-up
  WRONG_ANSWER_INVULNERABILITY_MS: 2000, // 2 seconds after wrong quiz answer
  SAFE_ZONE_CHECK_INTERVAL_MS: 100, // Check every 100ms
} as const;

// ============================================================================
// Obstacle Spawning Configuration
// ============================================================================
export const OBSTACLE_CONFIG = {
  BASE_INTERVAL: 60,
  INTERVAL_DECREASE_PER_LEVEL: 5,
  MIN_INTERVAL: 30,
  RANDOM_VARIATION: 20, // ±10 frames variation
  SIZE_VARIATION_MIN: 0.8,
  SIZE_VARIATION_MAX: 1.2,
} as const;

// ============================================================================
// Coin Spawning Configuration
// ============================================================================
export const COIN_CONFIG = {
  BASE_INTERVAL: 80,
  RANDOM_VARIATION: 40, // 80-120 frames variation
  HEIGHT_VARIATION: 120, // Random height variation
  BASE_HEIGHT_OFFSET: 50,
} as const;

// ============================================================================
// Power-Up Spawning Configuration
// ============================================================================
export const POWER_UP_CONFIG = {
  SPAWN_DELAY_MIN: 150,
  SPAWN_DELAY_MAX: 250,
  HEIGHT_OFFSET: 60, // Just above ground
} as const;

// ============================================================================
// Quiz Question Interface
// ============================================================================
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// ============================================================================
// Web3 Quiz Questions
// ============================================================================
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'What is a blockchain?',
    options: [
      'A type of cryptocurrency',
      'A distributed ledger technology',
      'A cloud storage service',
      'A social media platform',
    ],
    correctAnswer: 1,
    explanation: 'A blockchain is a distributed ledger technology that records transactions across multiple computers.',
  },
  {
    question: "What does 'DeFi' stand for?",
    options: ['Digital Finance', 'Decentralized Finance', 'Defined Finance', 'Delegated Finance'],
    correctAnswer: 1,
    explanation: 'DeFi stands for Decentralized Finance, which refers to financial services built on blockchain.',
  },
  {
    question: 'What is a smart contract?',
    options: ['A legal document', 'Self-executing code on blockchain', 'A trading bot', 'A wallet app'],
    correctAnswer: 1,
    explanation: 'A smart contract is self-executing code that runs on a blockchain when conditions are met.',
  },
  {
    question: 'What is the purpose of a wallet in crypto?',
    options: [
      'To mine cryptocurrency',
      'To store and manage private keys',
      'To validate transactions',
      'To create new tokens',
    ],
    correctAnswer: 1,
    explanation: 'A crypto wallet stores and manages your private keys, allowing you to control your assets.',
  },
  {
    question: "What does 'gas fee' refer to?",
    options: ['Mining reward', 'Transaction cost on blockchain', 'Staking reward', 'Exchange fee'],
    correctAnswer: 1,
    explanation: 'Gas fees are the transaction costs paid to validators/miners for processing blockchain transactions.',
  },
  {
    question: 'What is an NFT?',
    options: ['Non-Fungible Token', 'New Finance Technology', 'Network File Transfer', 'Node Function Test'],
    correctAnswer: 0,
    explanation: 'NFT stands for Non-Fungible Token, a unique digital asset stored on a blockchain.',
  },
  {
    question: 'What consensus mechanism does Bitcoin use?',
    options: ['Proof of Stake', 'Delegated Proof of Stake', 'Proof of Work', 'Proof of Authority'],
    correctAnswer: 2,
    explanation: 'Bitcoin uses Proof of Work (PoW), where miners solve complex mathematical puzzles to validate transactions.',
  },
  {
    question: 'What is a DAO?',
    options: [
      'Digital Asset Operation',
      'Decentralized Autonomous Organization',
      'Data Access Object',
      'Distributed Application Order',
    ],
    correctAnswer: 1,
    explanation: 'A DAO is a Decentralized Autonomous Organization, governed by smart contracts and community voting.',
  },
  {
    question: "What does 'HODL' mean in crypto?",
    options: [
      'Hold On for Dear Life',
      'High Order Digital Ledger',
      'Heavily Optimized Data Link',
      'Hybrid Online Decentralized Loan',
    ],
    correctAnswer: 0,
    explanation: "HODL means 'Hold On for Dear Life', a term for holding crypto long-term despite volatility.",
  },
  {
    question: 'What is Layer 2 in blockchain?',
    options: [
      'Second generation blockchain',
      'Scaling solution built on top of Layer 1',
      'Mining difficulty level',
      'Security protocol',
    ],
    correctAnswer: 1,
    explanation: 'Layer 2 refers to scaling solutions built on top of the main blockchain (Layer 1) to increase speed and reduce costs.',
  },
  {
    question: 'What is staking in crypto?',
    options: [
      'Trading on margin',
      'Mining with special hardware',
      'Locking tokens to secure network and earn rewards',
      'Selling tokens at high prices',
    ],
    correctAnswer: 2,
    explanation: 'Staking involves locking up cryptocurrency to help secure a blockchain network and earn rewards in return.',
  },
  {
    question: 'What is a dApp?',
    options: ['Digital Application Protocol', 'Decentralized Application', 'Data Access Point', 'Distributed API'],
    correctAnswer: 1,
    explanation: 'A dApp is a Decentralized Application that runs on a blockchain network instead of centralized servers.',
  },
  {
    question: "What does 'Web3' refer to?",
    options: [
      'The third version of the internet',
      'Decentralized internet based on blockchain',
      'A web development framework',
      'World Wide Web version 3',
    ],
    correctAnswer: 1,
    explanation: 'Web3 refers to the vision of a decentralized internet built on blockchain technology with user ownership.',
  },
  {
    question: 'What is tokenomics?',
    options: [
      'Token creation process',
      'Economic model of a cryptocurrency',
      'Token exchange rates',
      'Mining economics',
    ],
    correctAnswer: 1,
    explanation: 'Tokenomics refers to the economic model and incentive structure of a cryptocurrency or token.',
  },
  {
    question: 'What is a liquidity pool?',
    options: ['A pool of miners', 'Collection of locked tokens for trading', 'Water supply for cooling', 'Investment fund'],
    correctAnswer: 1,
    explanation: 'A liquidity pool is a collection of tokens locked in a smart contract to facilitate decentralized trading.',
  },
  {
    question: "What does 'APY' stand for in DeFi?",
    options: [
      'Annual Percentage Yield',
      'Automated Payment Yield',
      'Average Price Year',
      'Asset Performance Yearly',
    ],
    correctAnswer: 0,
    explanation: 'APY stands for Annual Percentage Yield, showing the yearly return on staked or deposited crypto.',
  },
  {
    question: 'What is a private key?',
    options: [
      'Password for exchange accounts',
      'Secret code to access your crypto',
      'Mining difficulty setting',
      'Network encryption key',
    ],
    correctAnswer: 1,
    explanation: 'A private key is a secret cryptographic code that proves ownership and allows you to access your cryptocurrency.',
  },
  {
    question: 'What is an oracle in blockchain?',
    options: [
      'A prediction market',
      'A data feed connecting blockchain to real-world data',
      'A type of smart contract',
      'A consensus mechanism',
    ],
    correctAnswer: 1,
    explanation: 'An oracle is a service that provides external real-world data to smart contracts on the blockchain.',
  },
  {
    question: "What does 'burning' tokens mean?",
    options: [
      'Selling tokens quickly',
      'Permanently removing tokens from circulation',
      'Converting to another token',
      'Staking for long periods',
    ],
    correctAnswer: 1,
    explanation: 'Burning tokens means permanently removing them from circulation by sending them to an inaccessible address.',
  },
  {
    question: 'What is a flash loan?',
    options: [
      'Quick approval loan',
      'Uncollateralized loan that must be repaid in same transaction',
      'Instant crypto purchase',
      'Emergency funding mechanism',
    ],
    correctAnswer: 1,
    explanation: 'A flash loan is an uncollateralized DeFi loan that must be borrowed and repaid within a single transaction block.',
  },
  {
    question: 'What is the Stellar Consensus Protocol (SCP)?',
    options: [
      'Proof of Work system',
      'Federated Byzantine Agreement mechanism',
      'Proof of Stake variant',
      'Mining algorithm',
    ],
    correctAnswer: 1,
    explanation: 'SCP is a Federated Byzantine Agreement consensus mechanism that enables fast, secure transactions on Stellar.',
  },
  {
    question: 'What are lumens (XLM) on Stellar?',
    options: [
      'Smart contract language',
      'Native cryptocurrency of Stellar network',
      'Mining rewards',
      'Transaction validators',
    ],
    correctAnswer: 1,
    explanation: 'Lumens (XLM) are the native cryptocurrency of the Stellar network, used for transactions and anti-spam measures.',
  },
  {
    question: 'What is a seed phrase?',
    options: [
      'Password hint',
      '12-24 word backup for wallet recovery',
      'Transaction ID',
      'Smart contract code',
    ],
    correctAnswer: 1,
    explanation: 'A seed phrase is a sequence of 12-24 words that can restore your wallet and access to your crypto assets.',
  },
  {
    question: 'What is impermanent loss?',
    options: [
      'Temporary network downtime',
      'Loss from providing liquidity due to price changes',
      'Failed transaction fees',
      'Exchange rate fluctuation',
    ],
    correctAnswer: 1,
    explanation: 'Impermanent loss occurs when providing liquidity to a pool and the token prices change compared to holding them.',
  },
  {
    question: 'What is a testnet?',
    options: [
      'Security audit system',
      'Network for testing without real money',
      'Mining difficulty test',
      'Speed testing tool',
    ],
    correctAnswer: 1,
    explanation: 'A testnet is a separate blockchain network used for testing and development without using real cryptocurrency.',
  },
  {
    question: "What does 'DYOR' mean?",
    options: [
      'Distribute Your Own Rewards',
      'Do Your Own Research',
      'Deploy Your Own Resource',
      'Develop Your Own Rules',
    ],
    correctAnswer: 1,
    explanation: "DYOR means 'Do Your Own Research', reminding people to research before investing in crypto projects.",
  },
  {
    question: 'What is a whale in crypto?',
    options: [
      'Large mining operation',
      'Individual/entity holding large amounts of crypto',
      'Market manipulation bot',
      'Exchange platform',
    ],
    correctAnswer: 1,
    explanation: 'A whale is an individual or entity that holds a very large amount of cryptocurrency, able to influence market prices.',
  },
  {
    question: 'What is yield farming?',
    options: ['Mining cryptocurrency', 'Earning rewards by providing liquidity', 'Creating new tokens', 'Trading strategies'],
    correctAnswer: 1,
    explanation: 'Yield farming involves providing liquidity to DeFi protocols to earn interest, fees, or token rewards.',
  },
  {
    question: 'What is cross-chain?',
    options: [
      'Multiple wallets',
      'Interoperability between different blockchains',
      'Chain of transactions',
      'Mining pools',
    ],
    correctAnswer: 1,
    explanation: 'Cross-chain refers to the ability to transfer assets and data between different blockchain networks.',
  },
  {
    question: 'What is a validator?',
    options: [
      'Code auditor',
      'Node that validates transactions in PoS networks',
      'Wallet security check',
      'Smart contract tester',
    ],
    correctAnswer: 1,
    explanation: 'A validator is a node in a Proof of Stake network that validates transactions and creates new blocks.',
  },
];

