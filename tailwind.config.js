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
        xs: ['12px', '18px'],
        sm: ['14px', '22px'],
        base: ['16px', '26px'],
        lg: ['18px', '28px'],
        xl: ['22px', '30px'],
        '2xl': ['28px', '36px'],
      },
      boxShadow: {
        card: '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
