import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Stroke icons (lucide shapes, same as the design canvas). Color follows the `color` prop. */
const shapes = {
  inbox: [
    <Path key="a" d="M22 12h-6l-2 3h-4l-2-3H2" />,
    <Path key="b" d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />,
  ],
  users: [
    <Path key="a" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />,
    <Circle key="b" cx="9" cy="7" r="4" />,
    <Path key="c" d="M22 21v-2a4 4 0 0 0-3-3.87" />,
    <Path key="d" d="M16 3.13a4 4 0 0 1 0 7.75" />,
  ],
  package: [
    <Path key="a" d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />,
    <Path key="b" d="m3.3 7 8.7 5 8.7-5" />,
    <Path key="c" d="M12 22V12" />,
  ],
  chart: [<Path key="a" d="M3 3v18h18" />, <Path key="b" d="M18 17V9" />, <Path key="c" d="M13 17V5" />, <Path key="d" d="M8 17v-3" />],
  tag: [
    <Path key="a" d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />,
    <Circle key="b" cx="7.5" cy="7.5" r="1" />,
  ],
  building: [
    <Rect key="a" x="4" y="2" width="16" height="20" rx="2" />,
    <Path key="b" d="M9 22v-4h6v4" />,
    <Path key="c" d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />,
  ],
  shield: [
    <Path key="a" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  ],
  userPlus: [<Circle key="a" cx="12" cy="8" r="4" />, <Path key="b" d="M4 21v-1a6 6 0 0 1 12 0v1" />, <Path key="c" d="M19 8v6M16 11h6" />],
  user: [<Circle key="a" cx="12" cy="8" r="4" />, <Path key="b" d="M4 21v-1a6 6 0 0 1 12 0v1" />],
  logout: [<Path key="a" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />, <Path key="b" d="m16 17 5-5-5-5" />, <Path key="c" d="M21 12H9" />],
  chevronLeft: [<Path key="a" d="m15 18-6-6 6-6" />],
  chevronRight: [<Path key="a" d="m9 18 6-6-6-6" />],
  chevronDown: [<Path key="a" d="m6 9 6 6 6-6" />],
  search: [<Circle key="a" cx="11" cy="11" r="8" />, <Path key="b" d="m21 21-4.3-4.3" />],
  send: [<Path key="a" d="m22 2-7 20-4-9-9-4Z" />, <Path key="b" d="M22 2 11 13" />],
  paperclip: [
    <Path key="a" d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  ],
  plus: [<Path key="a" d="M5 12h14M12 5v14" />],
  x: [<Path key="a" d="M18 6 6 18M6 6l12 12" />],
  check: [<Path key="a" d="M20 6 9 17l-5-5" />],
  clock: [<Circle key="a" cx="12" cy="12" r="10" />, <Path key="b" d="M12 6v6l4 2" />],
  camera: [
    <Path key="a" d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />,
    <Circle key="b" cx="12" cy="13" r="3" />,
  ],
  bell: [<Path key="a" d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />, <Path key="b" d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />],
  edit: [<Path key="a" d="M12 20h9" />, <Path key="b" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />],
  trash: [<Path key="a" d="M3 6h18" />, <Path key="b" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />, <Path key="c" d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />],
  panelRight: [<Rect key="a" x="3" y="3" width="18" height="18" rx="2" />, <Path key="b" d="M15 3v18" />],
  arrowRight: [<Path key="a" d="M5 12h14" />, <Path key="b" d="m12 5 7 7-7 7" />],
  lock: [<Rect key="a" x="3" y="11" width="18" height="11" rx="2" />, <Path key="b" d="M7 11V7a5 5 0 0 1 10 0v4" />],
  wifiOff: [<Path key="a" d="M2 2l20 20" />, <Path key="b" d="M8.5 16.5a5 5 0 0 1 7 0" />, <Path key="c" d="M12 20h.01" />],
} as const;

export type IconName = keyof typeof shapes;

export function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 2 }: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name]}
    </Svg>
  );
}
