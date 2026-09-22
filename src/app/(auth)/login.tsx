import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Button, Card, Checkbox, Icon, SegmentedTabs, TextField } from '../../components/common';
import { DEMO_PASSWORD, demoAccounts } from '../../constants/demo-accounts';
import { errorMessage } from '../../helpers/error.helper';
import { useLogin } from '../../hooks/queries/use-session';
import { UserType } from '../../services/auth.service';
import { ApiError } from '../../services/http-client';

/** L1/L2 in docs/ux-ui.md — one screen, tabs switch between customer and staff sign-in. */
export default function LoginScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [userType, setUserType] = useState<UserType>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const login = useLogin();

  const canSubmit = email.trim().length > 0 && password.length > 0 && !login.isPending;
  const submit = () => {
    if (canSubmit) login.mutate({ email: email.trim(), password, userType, remember });
  };
  const switchType = (type: UserType) => {
    setUserType(type);
    login.reset();
  };
  // Same message for wrong email and wrong password by design — remind which tab is selected, the usual cause
  const wrongTabHint =
    login.error instanceof ApiError && login.error.code === 'auth.invalidCredentials'
      ? t(userType === 'staff' ? 'auth.login.hintStaffTab' : 'auth.login.hintCustomerTab')
      : undefined;

  return (
    <SafeAreaView className="flex-1 flex-row bg-gray-1 dark:bg-dark">
      {width >= 1000 && (
        <View className="w-[42%] max-w-[620px] justify-between bg-dark p-14">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Text className="font-bold text-2xl text-white">F</Text>
            </View>
            <Text className="font-bold text-xl text-white">{t('appName')}</Text>
          </View>
          <View className="gap-6">
            <Text className="font-bold text-[34px] leading-[48px] text-white">{t('auth.login.brandTitle')}</Text>
            {(['inbox', 'clock', 'shield'] as const).map((icon, i) => (
              <View key={icon} className="flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-dark-2">
                  <Icon name={icon} color="#6B83FA" />
                </View>
                <Text className="flex-1 font-sans text-[15px] text-gray-3">{t(`auth.login.brandPoint${i + 1}`)}</Text>
              </View>
            ))}
          </View>
          <Text className="font-sans text-[13px] text-dark-6">{t('auth.login.brandFooter')}</Text>
        </View>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="grow justify-center px-4 py-10" keyboardShouldPersistTaps="handled">
          <View className="w-full max-w-[440px] gap-6 self-center">
            <View className="items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Text className="font-bold text-xl text-white">F</Text>
              </View>
              <Text className="font-semibold text-sm text-body dark:text-body-dark">{t('appName')}</Text>
            </View>

            <Card className="gap-5 p-6 sm:p-10">
              <View className="gap-1">
                <Text accessibilityRole="header" className="font-bold text-2xl text-dark dark:text-white">
                  {t('auth.login.title')}
                </Text>
                <Text className="font-sans text-sm text-body dark:text-body-dark">
                  {t(userType === 'staff' ? 'auth.login.staffSubtitle' : 'auth.login.customerSubtitle')}
                </Text>
              </View>

              <SegmentedTabs
                value={userType}
                onChange={switchType}
                options={[
                  { value: 'customer', label: t('auth.login.customerTab') },
                  { value: 'staff', label: t('auth.login.staffTab') },
                ]}
              />

              <TextField
                label={t('auth.login.email')}
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="username"
                keyboardType="email-address"
              />
              <TextField
                label={t('auth.login.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                onSubmitEditing={submit}
                right={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12} accessibilityRole="button">
                    <Text className="font-semibold text-sm text-primary">
                      {showPassword ? t('auth.login.hide') : t('auth.login.show')}
                    </Text>
                  </Pressable>
                }
              />

              <View className="flex-row flex-wrap items-center justify-between gap-2">
                <Checkbox checked={remember} onChange={setRemember} label={t('auth.login.remember')} />
                <Text className="font-semibold text-sm text-primary">{t('auth.login.forgot')}</Text>
              </View>

              {login.isError && (
                <Alert tone="error" title={errorMessage(login.error, t)} message={wrongTabHint ?? ''} />
              )}

              <Button
                title={login.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
                size="lg"
                loading={login.isPending}
                disabled={!canSubmit}
                onPress={submit}
              />
            </Card>

            {__DEV__ && (
              <Card className="gap-3 p-5">
                <Text className="font-semibold text-sm text-dark dark:text-white">
                  {t('auth.login.demoTitle', { password: DEMO_PASSWORD })}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {demoAccounts[userType].map((a) => (
                    <Button
                      key={a.email}
                      title={a.label}
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        setEmail(a.email);
                        setPassword(DEMO_PASSWORD);
                        login.reset();
                      }}
                    />
                  ))}
                </View>
              </Card>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
