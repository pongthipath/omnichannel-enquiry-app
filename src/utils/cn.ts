/** Joins class names, skipping falsy values: cn('px-4', isActive && 'bg-primary'). */
export const cn = (...classes: (string | false | null | undefined)[]): string => classes.filter(Boolean).join(' ');
