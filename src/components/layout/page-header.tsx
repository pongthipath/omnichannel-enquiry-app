import { ReactNode } from 'react';
import { Text, View } from 'react-native';

/** Title + subtitle + actions row at the top of every staff page. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <View className="flex-row flex-wrap items-center gap-3">
      <View className="min-w-[200px] flex-1">
        <Text accessibilityRole="header" className="font-bold text-2xl text-dark dark:text-white">
          {title}
        </Text>
        {subtitle ? <Text className="font-sans text-sm text-body dark:text-body-dark">{subtitle}</Text> : null}
      </View>
      {actions ? <View className="flex-row flex-wrap items-center gap-2">{actions}</View> : null}
    </View>
  );
}

/** KPI tile (dashboard, customers). */
export function StatTile({ label, value, note, tone = 'default' }: {
  label: string;
  value: string | number;
  note?: string;
  tone?: 'default' | 'red' | 'yellow' | 'cyan';
}) {
  const box = { default: 'bg-white border border-stroke dark:bg-dark-2 dark:border-stroke-dark', red: 'bg-red-light', yellow: 'bg-yellow-light', cyan: 'bg-cyan-light' }[tone];
  const text = { default: 'text-dark dark:text-white', red: 'text-red', yellow: 'text-yellow', cyan: 'text-cyan' }[tone];
  const sub = { default: 'text-body dark:text-body-dark', red: 'text-red', yellow: 'text-yellow', cyan: 'text-cyan' }[tone];
  return (
    <View className={`min-w-[150px] flex-1 gap-1 rounded-xl px-4 py-3.5 ${box}`}>
      <Text className={`font-sans text-sm ${sub}`}>{label}</Text>
      <Text className={`font-bold text-2xl ${text}`}>{value}</Text>
      {note ? <Text className={`font-sans text-xs ${sub}`}>{note}</Text> : null}
    </View>
  );
}
