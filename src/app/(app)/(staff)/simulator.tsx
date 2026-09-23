import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Alert, Button, Card, EmptyState, Select, TextField } from '../../../components/common';
import { PageHeader } from '../../../components/layout/page-header';
import { Permission } from '../../../constants/permissions';
import { errorMessage } from '../../../helpers/error.helper';
import { useSimulate } from '../../../hooks/queries/use-sla';
import { usePermissions } from '../../../hooks/use-permissions';
import { Channel } from '../../../services/enquiry.service';
import { useTheme } from '../../../theme/use-theme';

const CHANNELS: Channel[] = ['LINE', 'FACEBOOK', 'WEB_CHAT'];

interface Preset {
  labelKey: string;
  channel: Channel;
  externalUserId: string;
  displayName: string;
  text: string;
}

/** Ready-made senders, so a demo needs no typing. */
const PRESETS: Preset[] = [
  { labelKey: 'simulator.presets.newLine', channel: 'LINE', externalUserId: 'U-demo-new', displayName: 'ลูกค้าใหม่ (LINE)', text: 'สวัสดีค่ะ สนใจสั่งชีสมอสซาเรลล่า 20 กิโล ราคาเท่าไหร่คะ' },
  { labelKey: 'simulator.presets.late', channel: 'FACEBOOK', externalUserId: 'PSID-demo-late', displayName: 'ร้านพิซซ่านานา', text: 'ของที่สั่งเมื่อวานยังไม่ถึงเลยครับ ตอนนี้ถึงไหนแล้ว' },
  { labelKey: 'simulator.presets.web', channel: 'WEB_CHAT', externalUserId: 'web-demo-1', displayName: 'ผู้เยี่ยมชมเว็บ', text: 'ขอใบเสนอราคาสำหรับร้านอาหาร 3 สาขาค่ะ' },
];

/**
 * Channel simulator (design A5). Sends a message through the same path a real LINE / Facebook /
 * web-chat webhook takes, so the whole flow can be shown without connecting a real channel.
 */
export default function SimulatorScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const router = useRouter();
  const { can } = usePermissions();
  const simulate = useSimulate();
  const [channel, setChannel] = useState<Channel>('LINE');
  const [externalUserId, setExternalUserId] = useState('U-demo-new');
  const [displayName, setDisplayName] = useState('ลูกค้าใหม่ (LINE)');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!can(Permission.SIMULATOR_PAGE_USE)) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const applyPreset = (p: Preset) => {
    setChannel(p.channel);
    setExternalUserId(p.externalUserId);
    setDisplayName(p.displayName);
    setText(p.text);
    setImageUrl('');
    simulate.reset();
  };

  const send = () => {
    if (!externalUserId.trim() || (!text.trim() && !imageUrl.trim())) return;
    simulate.mutate({
      channel,
      externalUserId: externalUserId.trim(),
      displayName: displayName.trim() || undefined,
      text: text.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    });
    setText('');
  };

  const result = simulate.data;

  return (
    <ScrollView contentContainerClassName="gap-3 p-4">
      <PageHeader title={t('simulator.title')} subtitle={t('simulator.subtitle')} />
      <Alert tone="info" message={t('simulator.notice')} />

      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button key={p.externalUserId} title={t(p.labelKey)} variant="outline" size="sm" onPress={() => applyPreset(p)} />
        ))}
      </View>

      <Card className="max-w-[560px] gap-3 p-4">
        <Select
          label={t('simulator.channel')}
          value={channel}
          onChange={setChannel}
          options={CHANNELS.map((v) => ({ value: v, label: t(`enquiry.channel.${v}`) }))}
        />
        <TextField
          label={t('simulator.externalUserId')}
          hint={t('simulator.externalUserIdHint')}
          value={externalUserId}
          onChangeText={setExternalUserId}
          autoCapitalize="none"
        />
        <TextField label={t('simulator.displayName')} value={displayName} onChangeText={setDisplayName} />

        <View className="gap-1.5">
          <Text className="font-semibold text-sm text-dark dark:text-white">{t('simulator.message')}</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder={t('simulator.messagePlaceholder')}
            placeholderTextColor={c.placeholder}
            accessibilityLabel={t('simulator.message')}
            className="min-h-20 rounded-md border border-stroke bg-white px-3 py-2 font-sans text-base text-dark outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
          />
        </View>

        <TextField
          label={t('simulator.imageUrl')}
          hint={t('simulator.imageUrlHint')}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          placeholder="https://…"
        />

        {simulate.isError && <Alert tone="error" message={errorMessage(simulate.error, t)} />}
        <Button
          title={t('simulator.send')}
          onPress={send}
          loading={simulate.isPending}
          disabled={!externalUserId.trim() || (!text.trim() && !imageUrl.trim())}
        />
      </Card>

      {result && (
        <Card className="max-w-[560px] gap-2 p-4">
          <Text className="font-semibold text-sm text-dark dark:text-white">{t('simulator.result')}</Text>
          <Text className="font-sans text-sm text-body dark:text-body-dark">
            {t('simulator.resultCounts', { accepted: result.accepted, duplicates: result.duplicates })}
          </Text>
          {result.chatIds.map((id) => (
            <Button
              key={id}
              title={t('simulator.openEnquiry')}
              variant="outline"
              size="sm"
              onPress={() => router.push({ pathname: '/inbox', params: { id } })}
            />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
