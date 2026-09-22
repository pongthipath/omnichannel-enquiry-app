/**
 * Tailgrids palette — the single source of colors. Read by tailwind.config.js (className="bg-primary")
 * and by tokens.ts for the few props that need a raw value (placeholderTextColor, icons, Switch).
 */
module.exports = {
  primary: { DEFAULT: '#3758F9', dark: '#1B44C8', light: '#EBEEFE' },
  dark: { DEFAULT: '#111928', 2: '#1F2A37', 3: '#374151', 4: '#4B5563', 5: '#6B7280', 6: '#9CA3AF' },
  body: { DEFAULT: '#637381', dark: '#8899A8' },
  stroke: { DEFAULT: '#DFE4EA', dark: '#374151' },
  gray: { 1: '#F9FAFB', 2: '#F3F4F6', 3: '#E5E7EB', 4: '#DEE2E6', 5: '#CED4DA' },
  red: { DEFAULT: '#E10E0E', light: '#FEEBEB', dark: '#F87171' },
  green: { DEFAULT: '#1A8245', light: '#DAF8E6', dark: '#4ADE80' },
  yellow: { DEFAULT: '#9D5425', light: '#FFFBEB', dark: '#FBBF24' },
  cyan: { DEFAULT: '#0B76B7', light: '#E1F4FC' },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};
