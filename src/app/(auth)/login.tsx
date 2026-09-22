import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../../helpers/error.helper';
import { authService, UserType } from '../../services/auth.service';
import { setAccessToken } from '../../services/http-client';
import { radius, spacing } from '../../theme/tokens';
import { fontFamily, typeScale } from '../../theme/typography';
import { useTheme } from '../../theme/use-theme';

/** L1/L2 in docs/ux-ui.md v10 — one screen, toggles between customer and staff sign-in. */
export default function LoginScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const [userType, setUserType] = useState<UserType>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const login = useMutation({
    mutationFn: () => authService.login({ email: email.trim(), password, userType, remember }),
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
      // TODO: store refresh token in SecureStore (native), load /auth/me, navigate by permissions
    },
  });

  const canSubmit = email.trim().length > 0 && password.length > 0 && !login.isPending;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.brand, { color: c.mutedForeground }]}>{t('appName')}</Text>
        <Text style={[styles.title, { color: c.primary }]} accessibilityRole="header">
          {userType === 'staff' ? t('auth.login.staffTitle') : t('auth.login.title')}
        </Text>

        <Text style={[styles.label, { color: c.mutedForeground }]}>{t('auth.login.email')}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          keyboardType="email-address"
          accessibilityLabel={t('auth.login.email')}
          style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: c.background }]}
        />

        <Text style={[styles.label, { color: c.mutedForeground }]}>{t('auth.login.password')}</Text>
        <View style={[styles.passwordRow, { borderColor: c.border, backgroundColor: c.background }]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            textContentType="password"
            accessibilityLabel={t('auth.login.password')}
            onSubmitEditing={() => canSubmit && login.mutate()}
            style={[styles.passwordInput, { color: c.foreground }]}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12} accessibilityRole="button">
            <Text style={[styles.link, { color: c.accent }]}>
              {showPassword ? t('auth.login.hide') : t('auth.login.show')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.rememberRow}>
          <Switch value={remember} onValueChange={setRemember} accessibilityLabel={t('auth.login.remember')} />
          <Text style={[styles.body, { color: c.foreground }]}>{t('auth.login.remember')}</Text>
        </View>

        {login.isError && (
          <Text style={[styles.error, { color: c.destructive }]} accessibilityLiveRegion="polite">
            {errorMessage(login.error, t)}
          </Text>
        )}

        <Pressable
          onPress={() => login.mutate()}
          disabled={!canSubmit}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: c.accent, opacity: canSubmit ? 1 : 0.5 }]}
        >
          <Text style={[styles.buttonText, { color: c.onAccent }]}>
            {login.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
          </Text>
        </Pressable>

        <Text style={[styles.link, { color: c.accent }]}>{t('auth.login.forgot')}</Text>

        <Pressable
          onPress={() => setUserType((u) => (u === 'staff' ? 'customer' : 'staff'))}
          accessibilityRole="button"
          style={[styles.switchUser, { borderTopColor: c.border }]}
        >
          <Text style={[styles.link, { color: c.accent }]}>
            {userType === 'staff' ? t('auth.login.customerLink') : t('auth.login.staffLink')} →
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: radius.sheet,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  brand: { fontFamily: fontFamily.semibold, ...typeScale.caption },
  title: { fontFamily: fontFamily.bold, ...typeScale.display, marginBottom: spacing.md },
  label: { fontFamily: fontFamily.regular, ...typeScale.bodySm, marginTop: spacing.sm },
  body: { fontFamily: fontFamily.regular, ...typeScale.bodySm },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: 16, // iOS zooms inputs smaller than 16
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  passwordInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  error: { fontFamily: fontFamily.regular, ...typeScale.bodySm },
  button: {
    minHeight: 48,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  buttonText: { fontFamily: fontFamily.semibold, ...typeScale.body },
  link: { fontFamily: fontFamily.semibold, ...typeScale.bodySm },
  switchUser: { borderTopWidth: 1, marginTop: spacing.md, paddingTop: spacing.md },
});
