/** Tailgrids-style theme on NativeWind. Colors: src/theme/colors.js · Thai font must stay looped (min 12px). */
const colors = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class', // follows the device via colorScheme.set('system') in _layout.tsx
  theme: {
    colors,
    extend: {
      // React Native picks a face per weight, so each weight is its own family
      fontFamily: {
        sans: ['NotoSansThaiLooped_400Regular'],
        semibold: ['NotoSansThaiLooped_600SemiBold'],
        bold: ['NotoSansThaiLooped_700Bold'],
        latin: ['NotoSans_400Regular'],
      },
      fontSize: {
        // compact console scale (smallest text stays 12px for Thai readability)
        xs: ['12px', '18px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
        lg: ['16px', '24px'],
        xl: ['18px', '26px'],
        '2xl': ['22px', '30px'],
      },
      boxShadow: {
        card: '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
