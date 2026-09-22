import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal as RNModal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import colors from '../../theme/colors';
import { cn } from '../../utils/cn';
import { Alert } from './alert';
import { Button } from './button';
import { Icon } from './icon';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** footer buttons; defaults to none */
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'max-w-[420px]', md: 'max-w-[520px]', lg: 'max-w-[720px]' };

/** Tailgrids "Dialog": dimmed backdrop, card with header, scrollable body and footer. Esc / backdrop closes. */
export function Modal({ visible, onClose, title, description, children, footer, width = 'md' }: ModalProps) {
  const { t } = useTranslation();
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <Pressable
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          className="flex-1 items-center justify-center bg-black/50 px-4"
        >
          {/* inner Pressable stops the backdrop press from closing when tapping inside */}
          <Pressable
            onPress={() => undefined}
            accessibilityRole="none"
            className={cn('max-h-[90%] w-full rounded-xl bg-white shadow-card dark:bg-dark-2', widths[width])}
          >
            <View className="flex-row items-start gap-3 border-b border-stroke px-6 py-4 dark:border-stroke-dark">
              <View className="flex-1 gap-1">
                <Text accessibilityRole="header" className="font-bold text-lg text-dark dark:text-white">
                  {title}
                </Text>
                {description ? (
                  <Text className="font-sans text-sm text-body dark:text-body-dark">{description}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-md active:bg-gray-2 dark:active:bg-dark-3"
              >
                <Icon name="x" color={colors.body.DEFAULT} />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="gap-4 px-6 py-5" keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? (
              <View className="flex-row flex-wrap justify-end gap-2 border-t border-stroke px-6 py-4 dark:border-stroke-dark">
                {footer}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

/** The confirm step for irreversible or important actions (close enquiry, delete tag…). */
export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger,
  loading,
  error,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      width="sm"
      footer={
        <>
          <Button title={t('common.cancel')} variant="outline" onPress={onClose} />
          <Button title={confirmLabel} variant={danger ? 'danger' : 'primary'} loading={loading} onPress={onConfirm} />
        </>
      }
    >
      <Text className="font-sans text-base text-dark dark:text-white">{message}</Text>
      {error ? <Alert tone="error" message={error} /> : null}
    </Modal>
  );
}
