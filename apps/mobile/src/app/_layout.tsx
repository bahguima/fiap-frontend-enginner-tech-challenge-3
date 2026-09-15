import "../../global.css";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { MobileThemeProvider } from "@mobile/theme/MobileThemeProvider";
import { AuthenticatedNavigator } from "@mobile/components/navigation/AuthenticatedNavigator";
import { AuthProvider } from "@mobile/providers/AuthContext";
import {
  AuthenticatedQueryCacheBoundary,
  MobileQueryProvider,
} from "@mobile/services/query";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileThemeProvider>
        <MobileQueryProvider>
          <AuthProvider>
            <AuthenticatedQueryCacheBoundary>
              <AuthenticatedNavigator />
            </AuthenticatedQueryCacheBoundary>
          </AuthProvider>
        </MobileQueryProvider>
      </MobileThemeProvider>
    </SafeAreaProvider>
  );
}
