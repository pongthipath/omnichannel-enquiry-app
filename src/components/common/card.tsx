import { View, ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

/** Tailgrids "Card" — white surface, stroke border, soft shadow. */
export function Card({ className, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        'rounded-lg border border-stroke bg-white shadow-card dark:border-stroke-dark dark:bg-dark-2',
        className,
      )}
      {...rest}
    />
  );
}
