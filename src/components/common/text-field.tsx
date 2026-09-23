import { forwardRef, ReactNode, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme/use-theme';
import { cn } from '../../utils/cn';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** e.g. a show/hide button inside the field */
  right?: ReactNode;
}

/** Tailgrids "Text Field" — label, bordered input with a primary focus border, hint or error below. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, right, className, onFocus, onBlur, ...rest },
  ref,
) {
  const c = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="font-semibold text-sm text-dark dark:text-white">{label}</Text>
      <View
        className={cn(
          'min-h-10 flex-row items-center rounded-md border bg-white px-3 dark:bg-dark-2',
          error ? 'border-red' : focused ? 'border-primary' : 'border-stroke dark:border-stroke-dark',
        )}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={c.placeholder}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          // 16px: iOS zooms into smaller inputs · outline-none: the border shows focus on web
          className={cn('flex-1 py-2 font-sans text-base text-dark outline-none dark:text-white', className)}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text className="font-sans text-sm text-red dark:text-red-dark" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text className="font-sans text-sm text-body dark:text-body-dark">{hint}</Text>
      ) : null}
    </View>
  );
});
