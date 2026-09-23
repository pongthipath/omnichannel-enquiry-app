import { Platform } from 'react-native';

/**
 * The phone app and the web console are the same codebase but not the same product: phones get
 * bottom tabs and pushed pages, the browser keeps the sidebar console. Gate on the platform rather
 * than on the window width so resizing a browser window never turns it into the phone shell.
 */
export const NATIVE = Platform.OS !== 'web';
