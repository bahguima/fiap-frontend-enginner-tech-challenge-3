import NetInfo from "@react-native-community/netinfo";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { TransactionsRepositoryError } from "@mobile/features/transactions/data/transactionErrors";
import { useAuth } from "@mobile/providers/AuthContext";
import { mobileUserQueryKeys } from "./queryKeys";

let nativeListenersInstalled = false;

const NON_RETRYABLE_FIREBASE_CODES = new Set([
  "already-exists",
  "failed-precondition",
  "invalid-argument",
  "not-found",
  "permission-denied",
  "unauthenticated",
]);

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  if (typeof code !== "string") return undefined;
  return code.includes("/") ? code.slice(code.lastIndexOf("/") + 1) : code;
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;

  if (error instanceof TransactionsRepositoryError) {
    return error.code === "unavailable" || error.code === "unknown";
  }

  const code = errorCode(error);
  return !code || !NON_RETRYABLE_FIREBASE_CODES.has(code);
}

export function createMobileQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryQuery,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function isActive(state: AppStateStatus): boolean {
  return state === "active";
}

export function installReactNativeQueryListeners(): void {
  if (nativeListenersInstalled) return;
  nativeListenersInstalled = true;

  focusManager.setEventListener((setFocused) => {
    setFocused(isActive(AppState.currentState));
    const subscription = AppState.addEventListener("change", (state) => {
      setFocused(isActive(state));
    });

    return () => subscription.remove();
  });

  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(
        state.isConnected !== false && state.isInternetReachable !== false,
      );
    }),
  );
}

export function MobileQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(createMobileQueryClient);

  useEffect(() => {
    installReactNativeQueryListeners();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function AuthenticatedQueryCacheBoundary({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const previousUid = useRef<string | undefined>(undefined);
  const currentUid = session?.uid;

  useEffect(() => {
    const staleUid = previousUid.current;
    previousUid.current = currentUid;

    if (staleUid && staleUid !== currentUid) {
      queryClient.removeQueries({ queryKey: mobileUserQueryKeys.all(staleUid) });
    }
  }, [currentUid, queryClient]);

  return children;
}
