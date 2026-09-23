import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, useWindowDimensions, View } from 'react-native';
import { ChatPane } from '../../../components/inbox/chat-pane';
import { ContextPanel } from '../../../components/inbox/context-panel';
import { EnquiryList } from '../../../components/inbox/enquiry-list';
import { CreateEnquiryModal } from '../../../components/inbox/modals/create-enquiry-modal';
import { NATIVE } from '../../../utils/platform';

/**
 * Inbox (design Main.dc.html). Wide: list | chat | context panel. Medium: list | chat, the panel
 * slides over the chat. Narrow browser: one column at a time, and the panel is a full screen.
 * The open enquiry is in the URL (?id=…) so it survives reloads and can be linked to.
 *
 * On iOS / Android this is just the list: opening an enquiry pushes its own page, so back is the
 * usual gesture and the bottom tabs stay put.
 */
export default function InboxScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const narrow = width < 760;
  const wide = width >= 1280;
  // wide: panel is a column (open by default); otherwise it is an overlay that starts closed
  const [panelPref, setPanelPref] = useState<boolean | null>(null);
  const panelOpen = panelPref ?? wide;
  const [creating, setCreating] = useState(false);
  const select = (next?: string) => router.setParams({ id: next ?? '' });
  const selected = id || undefined;
  const togglePanel = () => setPanelPref(!panelOpen);

  if (NATIVE) {
    return (
      <View className="flex-1">
        <EnquiryList onSelect={(id) => router.push({ pathname: '/enquiry/[id]', params: { id } })} onCreate={() => router.push('/enquiry/new')} />
      </View>
    );
  }

  if (narrow) {
    return (
      <View className="flex-1">
        {selected ? (
          <ChatPane enquiryId={selected} compact onBack={() => select(undefined)} onTogglePanel={togglePanel} />
        ) : (
          <EnquiryList selectedId={selected} onSelect={select} onCreate={() => setCreating(true)} />
        )}
        <Modal visible={Boolean(selected) && panelOpen} animationType="slide" onRequestClose={togglePanel}>
          <ContextPanel enquiryId={selected} onOpenEnquiry={select} onClose={togglePanel} />
        </Modal>
        <CreateEnquiryModal visible={creating} onClose={() => setCreating(false)} asStaff onCreated={(e) => select(e.id)} />
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row">
      <View className="w-[320px] border-r border-stroke dark:border-stroke-dark">
        <EnquiryList selectedId={selected} onSelect={select} onCreate={() => setCreating(true)} />
      </View>
      <View className="flex-1">
        <ChatPane enquiryId={selected} onTogglePanel={selected ? togglePanel : undefined} />
      </View>
      {selected && panelOpen && (
        <View
          className={
            wide
              ? 'w-[300px] border-l border-stroke shadow-none dark:border-stroke-dark'
              : 'absolute bottom-0 right-0 top-0 w-[300px] max-w-[90%] border-l border-stroke bg-white shadow-card dark:border-stroke-dark dark:bg-dark-2'
          }
        >
          <ContextPanel enquiryId={selected} onOpenEnquiry={select} onClose={wide ? undefined : togglePanel} />
        </View>
      )}
      <CreateEnquiryModal visible={creating} onClose={() => setCreating(false)} asStaff onCreated={(e) => select(e.id)} />
    </View>
  );
}
