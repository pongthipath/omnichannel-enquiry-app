import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';
import colors from '../../theme/colors';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const container: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  outline:
    'border border-stroke bg-white active:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:active:bg-dark-3',
  ghost: 'bg-transparent active:bg-gray-2 dark:active:bg-dark-3',
  danger: 'bg-red active:opacity-90',
};
const label: Record<Variant, string> = {
  primary: 'text-white',
  outline: 'text-dark dark:text-white',
  ghost: 'text-primary',
  danger: 'text-white',
};
const sizes: Record<Size, string> = { sm: 'min-h-9 px-4', md: 'min-h-11 px-6', lg: 'min-h-12 px-7' };

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
}

/** Tailgrids "Button" — primary / outline / ghost / danger, sm·md·lg. */
export function Button({ title, variant = 'primary', size = 'md', loading, disabled, className, ...rest }: ButtonProps) {
  const isDisabled = !!(disabled || loading);
  const spinner = variant === 'outline' || variant === 'ghost' ? colors.primary.DEFAULT : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-md',
        container[variant],
        sizes[size],
        isDisabled && 'opacity-50',
        className,
      )}
      {...rest}
    >
      {loading && <ActivityIndicator size="small" color={spinner} />}
      <Text className={cn('font-semibold text-base', label[variant])}>{title}</Text>
    </Pressable>
  );
}
