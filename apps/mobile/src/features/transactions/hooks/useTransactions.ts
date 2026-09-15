import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@mobile/providers/AuthContext";
import {
  dashboardQueryKeys,
  transactionAttachmentQueryKeys,
  transactionCategoryQueryKeys,
  transactionQueryKeys,
} from "@mobile/services/query/queryKeys";
import {
  getFirebaseTransactionsRepository,
  requireAuthenticatedUid,
} from "../data";
import type {
  TransactionCursor,
  TransactionFilters,
  TransactionInput,
  TransactionsRepository,
  UpdateTransactionVariables,
} from "../types/transactions";
import type { Transaction } from "@banking/shared/types";

interface TransactionHookOptions {
  enabled?: boolean;
  repository?: TransactionsRepository;
}

function selectedRepository(
  repository: TransactionsRepository | undefined,
): TransactionsRepository {
  return repository ?? getFirebaseTransactionsRepository();
}

async function synchronizeTransactionMutation(
  queryClient: QueryClient,
  uid: string,
  transaction: Transaction,
) {
  queryClient.setQueryData(
    transactionQueryKeys.detail(uid, transaction.id),
    transaction,
  );

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists(uid) }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all(uid) }),
    queryClient.invalidateQueries({
      queryKey: transactionAttachmentQueryKeys.byTransaction(
        uid,
        transaction.id,
      ),
    }),
  ]);
}

export function useTransactionsInfiniteQuery(
  filters: TransactionFilters = {},
  options: TransactionHookOptions = {},
) {
  const { session } = useAuth();
  const uid = session?.uid ?? "";
  const repository = selectedRepository(options.repository);

  return useInfiniteQuery({
    queryKey: transactionQueryKeys.infinite(uid, filters),
    queryFn: ({ pageParam }) =>
      repository.list(
        requireAuthenticatedUid(uid, "list"),
        filters,
        pageParam,
      ),
    initialPageParam: undefined as TransactionCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(uid) && (options.enabled ?? true),
  });
}

export function useTransactionQuery(
  id: string | undefined,
  options: TransactionHookOptions = {},
) {
  const { session } = useAuth();
  const uid = session?.uid ?? "";
  const repository = selectedRepository(options.repository);

  return useQuery({
    queryKey: transactionQueryKeys.detail(uid, id ?? ""),
    queryFn: () =>
      repository.getById(
        requireAuthenticatedUid(uid, "read"),
        id ?? "",
      ),
    enabled: Boolean(uid && id) && (options.enabled ?? true),
  });
}

export function useCreateTransactionMutation(
  options: Pick<TransactionHookOptions, "repository"> = {},
) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const repository = selectedRepository(options.repository);

  return useMutation({
    mutationFn: (input: TransactionInput) =>
      repository.create(
        requireAuthenticatedUid(session?.uid, "create"),
        input,
      ),
    onSuccess: (transaction) =>
      synchronizeTransactionMutation(
        queryClient,
        requireAuthenticatedUid(session?.uid, "create"),
        transaction,
      ),
  });
}

export function useUpdateTransactionMutation(
  options: Pick<TransactionHookOptions, "repository"> = {},
) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const repository = selectedRepository(options.repository);

  return useMutation({
    mutationFn: ({ id, input }: UpdateTransactionVariables) =>
      repository.update(
        requireAuthenticatedUid(session?.uid, "update"),
        id,
        input,
      ),
    onSuccess: (transaction) =>
      synchronizeTransactionMutation(
        queryClient,
        requireAuthenticatedUid(session?.uid, "update"),
        transaction,
      ),
  });
}

export function useDeleteTransactionMutation(
  options: Pick<TransactionHookOptions, "repository"> = {},
) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const repository = selectedRepository(options.repository);

  return useMutation({
    mutationFn: (id: string) =>
      repository.delete(
        requireAuthenticatedUid(session?.uid, "delete"),
        id,
      ),
    onSuccess: async (_result, id) => {
      const uid = requireAuthenticatedUid(session?.uid, "delete");
      queryClient.removeQueries({
        queryKey: transactionQueryKeys.detail(uid, id),
        exact: true,
      });
      queryClient.removeQueries({
        queryKey: transactionAttachmentQueryKeys.byTransaction(uid, id),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: transactionQueryKeys.lists(uid),
        }),
        queryClient.invalidateQueries({
          queryKey: transactionQueryKeys.details(uid),
        }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all(uid) }),
      ]);
    },
  });
}

export function useTransactionCategoriesQuery(
  options: TransactionHookOptions = {},
) {
  const { session } = useAuth();
  const uid = session?.uid ?? "";
  const repository = selectedRepository(options.repository);

  return useQuery({
    queryKey: transactionCategoryQueryKeys.list(),
    queryFn: () =>
      repository.listCategories(
        requireAuthenticatedUid(uid, "list-categories"),
      ),
    staleTime: 60 * 60 * 1000,
    enabled: Boolean(uid) && (options.enabled ?? true),
  });
}
