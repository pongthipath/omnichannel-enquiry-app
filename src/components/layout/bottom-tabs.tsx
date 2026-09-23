import { Href, usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { cn } from '../../utils/cn';
import { Icon, IconName } from '../common/icon';

export interface TabItem {
  href: Href;
  /** path prefix that keeps this tab lit, e.g. `/inbox` also covers `/inbox/filters` */
  match: string;
  icon: IconName;
  label: string;
  badge?: number;
}

/** Longest matching prefix wins, so `/my/new` lights the "new" tab and not the `/my` one. */
function activeIndex(items: TabItem[], pathname: string) {
  let best = -1;
  items.forEach((item, i) => {
    const hit = pathname === item.match || pathname.startsWith(`${item.match}/`);
    if (hit && (best < 0 || item.match.length > items[best].match.length)) best = i;
  });
  return best;
}

/**
 * Phone navigation: the top-level sections live down here where the thumb is, and every screen
 * below a section is pushed on top with a back button. Only rendered on iOS / Android — the
 * browser keeps the sidebar console.
 */
export function BottomTabs({ items }: { items: TabItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const active = activeIndex(items, pathname);

  return (
    <View
      role="navigation"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      className="flex-row border-t border-stroke bg-white pt-1.5 dark:border-stroke-dark dark:bg-dark-2"
    >
      {items.map((item, i) => {
        const on = i === active;
        return (
          <Pressable
            key={item.match}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: on }}
            // navigate (not push) so tapping a tab returns to a section already in the stack
            onPress={() => router.navigate(item.href)}
            className="min-h-11 flex-1 items-center justify-center gap-0.5 px-1 py-1"
          >
            <View>
              <Icon name={item.icon} size={20} color={on ? colors.primary.DEFAULT : colors.dark[5]} strokeWidth={on ? 2.2 : 1.8} />
              {item.badge ? (
                <View className="-right-2.5 -top-1 absolute min-w-[17px] items-center rounded-full bg-red px-1">
                  <Text className="font-semibold text-[11px] text-white">{item.badge > 99 ? '99+' : item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text numberOfLines={1} className={cn('text-xs leading-4', on ? 'font-semibold text-primary' : 'font-sans text-body')}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
