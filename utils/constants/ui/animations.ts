/**
 * Animation constants for UI components
 */

// Particle count for various effects
export const PARTICLE_COUNTS = {
  startScreen: 30,
  videoOverlay: 20,
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  preloaderStep: 1000, // ms
  preloaderTimeout: 15000, // ms
  clapAnimation: 1500, // ms
  fadeIn: 1000, // ms
} as const;

// Loading steps configuration
export const LOADING_STEPS = [
  { progress: 10, message: 'Initializing STELLAR NEXUS...' },
  { progress: 25, message: 'Connecting to Stellar Network...' },
  { progress: 40, message: 'Loading Demo Suite...' },
  { progress: 60, message: 'Fetching Demo Statistics...' },
  { progress: 80, message: 'Preparing Smart Contracts...' },
  { progress: 95, message: 'Finalizing Experience...' },
  { progress: 100, message: 'Ready to Launch!' },
] as const;

// Audio volume settings
export const AUDIO_VOLUMES = {
  clap: 0.6,
  intro: 0.6,
  nexusVoice: 0.6,
} as const;
