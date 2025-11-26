// Common UI component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Button variants
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'brand'
  | 'accent';

// Button sizes
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

// Card variants
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

// Badge variants
export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'brand'
  | 'accent';

// Modal sizes
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Loading spinner variants
export type LoadingSpinnerVariant = 'default' | 'brand' | 'accent' | 'white';

// Progress bar variants
export type ProgressBarVariant = 'default' | 'brand' | 'accent' | 'success' | 'warning' | 'error';

// Gradient variants
export type GradientVariant =
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'cyan'
  | 'purple'
  | 'green'
  | 'blue';

// Animation types
export type AnimationType =
  | 'firePulse'
  | 'fireParticle'
  | 'plasmaGlow'
  | 'energyStream'
  | 'bouncingRocket'
  | 'pulsingLightning'
  | 'spinningStars'
  | 'rotatingNexus';

// Position types
export type Position = 'top' | 'bottom' | 'left' | 'right';

// Size types
export type Size = 'sm' | 'md' | 'lg' | 'xl';

// Rounded corner types
export type RoundedSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

// Padding types
export type PaddingSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// Blur types
export type BlurSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// Icon position
export type IconPosition = 'left' | 'right';

// Button types
export type ButtonType = 'button' | 'submit' | 'reset';

// Common component interfaces
export interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: ButtonType;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
}

export interface CardProps extends BaseComponentProps {
  variant?: CardVariant;
  padding?: PaddingSize;
  rounded?: RoundedSize;
  hover?: boolean;
  onClick?: () => void;
}

export interface BadgeProps extends BaseComponentProps {
  variant?: BadgeVariant;
  size?: Size;
  animated?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: Size;
  variant?: LoadingSpinnerVariant;
}

export interface ProgressBarProps extends BaseComponentProps {
  progress: number;
  variant?: ProgressBarVariant;
  size?: Size;
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
}

export interface GradientCardProps extends BaseComponentProps {
  variant?: CardVariant;
  blur?: BlurSize;
  border?: boolean;
  hover?: boolean;
  padding?: PaddingSize;
  rounded?: RoundedSize;
}

export interface GradientButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: GradientVariant;
}

// Event handlers
export interface EventHandlers {
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (event: React.ChangeEvent) => void;
  onSubmit?: (event: React.FormEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}
