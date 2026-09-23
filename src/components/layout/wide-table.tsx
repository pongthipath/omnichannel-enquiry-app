import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { NATIVE } from '../../utils/platform';

/**
 * A table that needs more width than a phone has. Squeezing six columns into 390px turns every cell
 * into one clipped word, so on iOS / Android the table keeps its natural width and scrolls sideways
 * instead. In the browser it is the plain block it has always been.
 *
 * This is for the admin screens reached from the "me" tab. The screens people live in all day —
 * the inbox and the customers tab — drop the table on a phone and show cards instead.
 */
export function WideTable({ width = 720, children }: { width?: number; children: ReactNode }) {
  if (!NATIVE) return <>{children}</>;
  return (
    // the width goes on the child, not on `flex-1`: inside a horizontal ScrollView a flex child
    // measures against its own content, so it stays phone-wide and nothing ever scrolls
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={{ width }} className="flex-1">{children}</View>
    </ScrollView>
  );
}
