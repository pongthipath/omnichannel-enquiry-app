import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { ChatPane } from '../../../components/inbox/chat-pane';
import { ContextPanel } from '../../../components/inbox/context-panel';
import { EnquiryList } from '../../../components/inbox/enquiry-list';
import { CreateEnquiryModal } from '../../../components/inbox/modals/create-enquiry-modal';

/**
 * Inbox (design Main.dc.html). Wide: list | chat | context panel. Medium: list | chat, panel toggles
 * over the chat. Narrow (phone): one column at a time. The open enquiry is in the URL (?id=…) so it
 * survives reloads and can be linked from the dashboard / customers pages.
 */
export default function InboxScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const narrow = width < 760;
  const wide = width >= 1280;
  // wide: panel is a column (open by default); medium: it overlays the chat, so it starts closed
  const [panelPref, setPanelPref] = useState<boolean | null>(null);
  const panelOpen = panelPref ?? wide;
  const setPanelOpen = (update: (open: boolean) => boolean) => setPanelPref(update(panelOpen));
  const [creating, setCreating] = useState(false);
  const select = (next?: string) => router.setParams({ id: next ?? '' });
  const selected = id || undefined;

  if (narrow) {
    return (
      <View className="flex-1">
        {selected ? (
          <ChatPane enquiryId={selected} onBack={() => select(undefined)} />
        ) : (
          <EnquiryList selectedId={selected} onSelect={select} onCreate={() => setCreating(true)} />
        )}
        <CreateEnquiryModal visible={creating} onClose={() => setCreating(false)} asStaff onCreated={(e) => select(e.id)} />
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row">
      <View className="w-[356px] border-r border-stroke dark:border-stroke-dark">
        <EnquiryList selectedId={selected} onSelect={select} onCreate={() => setCreating(true)} />
      </View>
      <View className="flex-1">
        <ChatPane enquiryId={selected} onTogglePanel={selected ? () => setPanelOpen((o) => !o) : undefined} />
      </View>
      {selected && panelOpen && (
        <View
          className={
            wide
              ? 'w-[312px] border-l border-stroke dark:border-stroke-dark'
              : 'absolute bottom-0 right-0 top-0 w-[312px] max-w-[90%] border-l border-stroke shadow-card dark:border-stroke-dark'
          }
        >
          <ContextPanel enquiryId={selected} onOpenEnquiry={select} />
        </View>
      )}
      <CreateEnquiryModal visible={creating} onClose={() => setCreating(false)} asStaff onCreated={(e) => select(e.id)} />
    </View>
  );
}
