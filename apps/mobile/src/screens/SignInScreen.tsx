import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { getAuthErrorMessage } from "@mobile/features/auth/authErrors";
import {
  loginSchema,
  type LoginFormValues,
} from "@mobile/features/auth/loginSchema";
import { useAuth } from "@mobile/providers/AuthContext";
import { useFirebaseEmulators } from "@mobile/services/firebase";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

const DEMO_CREDENTIALS = {
  email: "demo@bytebank.test",
  password: "ByteBank123!",
};

interface FormFieldProps {
  error?: string;
  label: string;
  children: ReactNode;
}

function FormField({ children, error, label }: FormFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text">
        {label}
      </Text>
      {children}
      {error ? (
        <Text
          accessibilityRole="alert"
          className="text-sm text-bytebank-danger dark:text-bytebank-dark-danger"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function SignInScreen() {
  const { login } = useAuth();
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const [authError, setAuthError] = useState<string | null>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(loginSchema),
  });

  const submit = handleSubmit(async (values) => {
    setAuthError(null);

    try {
      await login(values);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    }
  });

  return (
    <SafeAreaView
      className={`${isDark ? "dark bg-bytebank-dark-background" : "bg-bytebank-background"} flex-1`}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mx-auto w-full max-w-md">
            <View
              accessible
              accessibilityLabel="ByteBank"
              className="mb-10 self-start rounded-full bg-bytebank-primary px-4 py-2 dark:bg-bytebank-dark-primary"
            >
              <Text className="text-sm font-black tracking-[2px] text-white dark:text-bytebank-dark-background">
                BYTEBANK
              </Text>
            </View>

            <Text
              accessibilityRole="header"
              className="text-3xl font-black tracking-tight text-bytebank-text dark:text-bytebank-dark-text"
            >
              Acesse sua conta
            </Text>
            <Text className="mt-3 text-base leading-6 text-bytebank-muted dark:text-bytebank-dark-muted">
              Entre com seu e-mail e senha para continuar com segurança.
            </Text>

            {useFirebaseEmulators ? (
              <View className="mt-6 rounded-card border border-bytebank-border bg-bytebank-surface p-4 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface">
                <Text className="text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text">
                  Conta de demonstração local
                </Text>
                <Text className="mt-1 text-xs leading-5 text-bytebank-muted dark:text-bytebank-dark-muted">
                  E-mail: {DEMO_CREDENTIALS.email}{"\n"}Senha: {DEMO_CREDENTIALS.password}
                </Text>
                <Pressable
                  accessibilityLabel="Preencher acesso de demonstração"
                  accessibilityRole="button"
                  className="mt-2 min-h-11 self-start justify-center pr-4"
                  onPress={() => {
                    setAuthError(null);
                    setValue("email", DEMO_CREDENTIALS.email, {
                      shouldDirty: true,
                    });
                    setValue("password", DEMO_CREDENTIALS.password, {
                      shouldDirty: true,
                    });
                  }}
                >
                  <Text className="text-sm font-bold text-bytebank-primary dark:text-bytebank-dark-primary">
                    Usar conta de demonstração
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View className="mt-8 gap-5">
              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <FormField error={errors.email?.message} label="E-mail">
                    <TextInput
                      accessibilityHint="Digite o e-mail da sua conta"
                      accessibilityLabel="E-mail"
                      aria-invalid={Boolean(errors.email)}
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      className="min-h-14 rounded-card border border-bytebank-border bg-bytebank-elevated px-4 text-base text-bytebank-text dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated dark:text-bytebank-dark-text"
                      editable={!isSubmitting}
                      inputMode="email"
                      keyboardType="email-address"
                      onBlur={onBlur}
                      onChangeText={(text) => {
                        setAuthError(null);
                        onChange(text);
                      }}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      placeholder="voce@exemplo.com"
                      placeholderTextColor={palette.muted}
                      returnKeyType="next"
                      textContentType="username"
                      value={value}
                    />
                  </FormField>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onBlur, onChange, value } }) => (
                  <FormField error={errors.password?.message} label="Senha">
                    <TextInput
                      ref={passwordInputRef}
                      accessibilityHint="Digite a senha da sua conta"
                      accessibilityLabel="Senha"
                      aria-invalid={Boolean(errors.password)}
                      autoCapitalize="none"
                      autoComplete="current-password"
                      autoCorrect={false}
                      className="min-h-14 rounded-card border border-bytebank-border bg-bytebank-elevated px-4 text-base text-bytebank-text dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated dark:text-bytebank-dark-text"
                      editable={!isSubmitting}
                      onBlur={onBlur}
                      onChangeText={(text) => {
                        setAuthError(null);
                        onChange(text);
                      }}
                      onSubmitEditing={submit}
                      placeholder="Digite sua senha"
                      placeholderTextColor={palette.muted}
                      returnKeyType="done"
                      secureTextEntry
                      textContentType="password"
                      value={value}
                    />
                  </FormField>
                )}
              />

              {authError ? (
                <View
                  accessibilityLiveRegion="polite"
                  accessibilityRole="alert"
                  className="rounded-card border border-bytebank-danger/30 bg-red-50 px-4 py-3 dark:border-bytebank-dark-danger/40 dark:bg-red-950/30"
                >
                  <Text className="text-sm leading-5 text-bytebank-danger dark:text-bytebank-dark-danger">
                    {authError}
                  </Text>
                </View>
              ) : null}

              <Pressable
                accessibilityLabel={isSubmitting ? "Entrando" : "Entrar"}
                accessibilityRole="button"
                accessibilityState={{
                  busy: isSubmitting,
                  disabled: isSubmitting,
                }}
                className={`min-h-14 flex-row items-center justify-center gap-3 rounded-card bg-bytebank-primary px-5 active:opacity-80 dark:bg-bytebank-dark-primary ${
                  isSubmitting ? "opacity-70" : ""
                }`}
                disabled={isSubmitting}
                onPress={submit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : null}
                <Text className="text-base font-black text-white dark:text-bytebank-dark-background">
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Text>
              </Pressable>
            </View>

            <Text className="mt-8 text-center text-xs leading-5 text-bytebank-muted dark:text-bytebank-dark-muted">
              Seus dados de acesso são protegidos pelo Firebase Authentication.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
