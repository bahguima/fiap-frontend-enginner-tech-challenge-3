import {
  Calendar,
  CreditCard,
  Globe2,
  LogOut,
  Mail,
  UserRound,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useState } from "react";

import { colors, darkColors } from "@banking/shared/design-tokens";
import { MobileAppHeader } from "@mobile/components/layout/MobileAppHeader";
import { ScreenContainer } from "@mobile/components/layout/ScreenContainer";
import { useAuth } from "@mobile/providers/AuthContext";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

interface ProfileItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function ProfileItem({ icon: Icon, label, value }: ProfileItemProps) {
  const { isDark } = useMobileTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      className="min-h-[74px] flex-row items-center gap-4 border-b border-bytebank-border py-3 dark:border-bytebank-dark-border"
    >
      <View className="h-11 w-11 items-center justify-center rounded-card bg-bytebank-primary/10 dark:bg-bytebank-dark-primary/10">
        <Icon
          aria-hidden
          color={isDark ? darkColors.primary : colors.primary}
          size={20}
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
          {label}
        </Text>
        <Text className="mt-1 text-base font-bold text-bytebank-text dark:text-bytebank-dark-text">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const { logout, session } = useAuth();
  const { isDark } = useMobileTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const palette = isDark ? darkColors : colors;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
    } catch {
      setLogoutError(
        "Não foi possível sair da conta. Verifique sua conexão e tente novamente.",
      );
      setIsLoggingOut(false);
    }
  };

  return (
    <ScreenContainer>
      <MobileAppHeader greeting="Perfil" />
      <View className="pb-4 pt-6">
        <Text
          accessibilityRole="header"
          className="text-2xl font-bold text-bytebank-text dark:text-bytebank-dark-text"
        >
          Seus dados
        </Text>
        <Text className="mt-1 text-sm text-bytebank-muted dark:text-bytebank-dark-muted">
          Informações pessoais e preferências do aplicativo.
        </Text>
      </View>

      <View className="rounded-panel border border-bytebank-border bg-bytebank-surface px-4 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface">
        <ProfileItem
          icon={UserRound}
          label="Nome"
          value={session?.displayName ?? "Cliente ByteBank"}
        />
        <ProfileItem
          icon={Mail}
          label="E-mail"
          value={session?.email ?? "E-mail não informado"}
        />
        <ProfileItem icon={CreditCard} label="Plano" value="Conta Digital" />
        <ProfileItem icon={Calendar} label="Cliente desde" value="Janeiro de 2024" />
      </View>

      <Text
        accessibilityRole="header"
        className="mb-3 mt-6 text-base font-bold text-bytebank-text dark:text-bytebank-dark-text"
      >
        Preferências
      </Text>
      <View
        accessibilityLabel="Idioma: Português do Brasil"
        accessibilityRole="text"
        className="min-h-16 flex-row items-center gap-4 rounded-card border border-bytebank-border bg-bytebank-surface px-4 dark:border-bytebank-dark-border dark:bg-bytebank-dark-surface"
      >
        <Globe2 aria-hidden color={palette.primary} size={20} />
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-bold text-bytebank-text dark:text-bytebank-dark-text">
            Idioma
          </Text>
          <Text className="mt-0.5 text-xs text-bytebank-muted dark:text-bytebank-dark-muted">
            Português (Brasil)
          </Text>
        </View>
      </View>

      {logoutError ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          className="mt-5 text-sm leading-5 text-bytebank-danger dark:text-bytebank-dark-danger"
        >
          {logoutError}
        </Text>
      ) : null}

      <Pressable
        accessibilityLabel={isLoggingOut ? "Saindo da conta" : "Sair da conta"}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoggingOut, disabled: isLoggingOut }}
        className={`mb-6 mt-5 min-h-14 flex-row items-center justify-center gap-3 rounded-card border border-bytebank-danger px-4 active:opacity-70 dark:border-bytebank-dark-danger ${
          isLoggingOut ? "opacity-60" : ""
        }`}
        disabled={isLoggingOut}
        onPress={handleLogout}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={palette.danger} size="small" />
        ) : (
          <LogOut aria-hidden color={palette.danger} size={20} />
        )}
        <Text className="text-base font-bold text-bytebank-danger dark:text-bytebank-dark-danger">
          {isLoggingOut ? "Saindo..." : "Sair da conta"}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
