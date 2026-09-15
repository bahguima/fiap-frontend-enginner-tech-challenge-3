import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarDays } from "lucide-react-native";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  BackHandler,
  findNodeHandle,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Controller,
  useForm,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { fromAmountInCents, getCalendarDateValue } from "@banking/shared/domain";
import type { TransactionCategory } from "@banking/shared/types";
import {
  createTransactionFormSchema,
  TRANSACTION_OBSERVATION_MAX_LENGTH,
  type ParsedTransactionFormValues,
  type TransactionFormValues,
} from "@banking/shared/validation";
import { colors, darkColors } from "@banking/shared/design-tokens";
import { ScreenContainer } from "@mobile/components/layout/ScreenContainer";
import { QueryState } from "@mobile/components/states/QueryState";
import {
  MobileAttachmentInput,
  type MobileAttachmentInputHandle,
} from "@mobile/features/transactions/components/MobileAttachmentInput";
import {
  useCreateTransactionMutation,
  useTransactionCategoriesQuery,
  useTransactionQuery,
  useUpdateTransactionMutation,
} from "@mobile/features/transactions/hooks";
import type { TransactionInput } from "@mobile/features/transactions/types/transactions";
import { useMobileTheme } from "@mobile/theme/MobileThemeProvider";

type TransactionFormMode = "create" | "edit";
type NativeFieldTarget = { focus?: () => void };

export interface TransactionAttachmentsExtensionContext {
  disabled: boolean;
  transactionId?: string;
}

interface TransactionFormScreenProps {
  mode?: TransactionFormMode;
  transactionId?: string;
  maximumDate?: string;
  onBack?: () => void;
  onSaved?: () => void;
  renderAttachmentsExtension?: (
    context: TransactionAttachmentsExtensionContext,
  ) => ReactNode;
}

const FIELD_ORDER: Array<keyof TransactionFormValues> = [
  "description",
  "amount",
  "type",
  "categoryId",
  "date",
  "status",
  "observation",
];

const TYPE_OPTIONS = [
  { label: "Entrada", value: "income" as const },
  { label: "Saída", value: "expense" as const },
];

const STATUS_OPTIONS = [
  { label: "Concluída", value: "completed" as const },
  { label: "Pendente", value: "pending" as const },
  { label: "Falhou", value: "failed" as const },
];

function defaultValues(maximumDate: string): TransactionFormValues {
  return {
    description: "",
    amount: "",
    type: "expense",
    categoryId: "",
    date: maximumDate,
    status: "completed",
    observation: "",
  };
}

function amountInputValue(amountInCents: number): string {
  return fromAmountInCents(amountInCents).toFixed(2).replace(".", ",");
}

function FormLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-2 text-sm font-semibold text-bytebank-text dark:text-bytebank-dark-text">
      {children}
    </Text>
  );
}

function FieldErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" className="mt-1 text-sm text-bytebank-danger dark:text-bytebank-dark-danger">
      {message}
    </Text>
  );
}

function persistenceErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível salvar a transação. Tente novamente.";
}

export function TransactionFormScreen({
  mode = "create",
  transactionId,
  maximumDate = getCalendarDateValue(new Date()),
  onBack = () => undefined,
  onSaved = onBack,
  renderAttachmentsExtension,
}: TransactionFormScreenProps) {
  const { isDark } = useMobileTheme();
  const palette = isDark ? darkColors : colors;
  const isEditing = mode === "edit";
  const schema = useMemo(() => createTransactionFormSchema(maximumDate), [maximumDate]);
  const transactionQuery = useTransactionQuery(transactionId, { enabled: isEditing });
  const categoriesQuery = useTransactionCategoriesQuery();
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const initializedTransactionRef = useRef<string | undefined>(undefined);
  const submissionInFlightRef = useRef(false);
  const attachmentInputRef = useRef<MobileAttachmentInputHandle>(null);
  const [attachmentsDirty, setAttachmentsDirty] = useState(false);
  const [createdTransactionId, setCreatedTransactionId] = useState<string>();
  const inputRefs = useRef<
    Partial<Record<keyof TransactionFormValues, NativeFieldTarget>>
  >({});
  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<TransactionFormValues, unknown, ParsedTransactionFormValues>({
    defaultValues: defaultValues(maximumDate),
    resolver: zodResolver(schema) as Resolver<
      TransactionFormValues,
      unknown,
      ParsedTransactionFormValues
    >,
  });
  const selectedType = watch("type");
  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const visibleCategories = categories.filter(
    (category) => category.type === "both" || category.type === selectedType,
  );
  const activeMutation = isEditing || createdTransactionId
    ? updateMutation
    : createMutation;
  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const attachmentTransactionId = transactionId ?? createdTransactionId;

  useEffect(() => {
    const transaction = transactionQuery.data;
    if (!isEditing || !transaction || initializedTransactionRef.current === transaction.id) return;

    initializedTransactionRef.current = transaction.id;
    reset({
      description: transaction.description,
      amount: amountInputValue(transaction.amountInCents),
      type: transaction.type,
      categoryId: transaction.categoryId,
      date: transaction.date,
      status: transaction.status,
      observation: transaction.observation,
    });
  }, [isEditing, reset, transactionQuery.data]);

  const requestBack = useCallback(() => {
    if (!isDirty && !attachmentsDirty) {
      onBack();
      return;
    }

    if (Platform.OS === "web") {
      if (globalThis.confirm("Descartar alterações? As informações preenchidas não serão salvas.")) {
        onBack();
      }
      return;
    }

    Alert.alert("Descartar alterações?", "As informações preenchidas não serão salvas.", [
      { text: "Continuar editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: onBack },
    ]);
  }, [attachmentsDirty, isDirty, onBack]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      requestBack();
      return true;
    });
    return () => subscription.remove();
  }, [requestBack]);

  const focusFirstError = useCallback((fieldErrors: FieldErrors<TransactionFormValues>) => {
    const firstInvalidField = FIELD_ORDER.find((fieldName) => fieldErrors[fieldName]);
    if (!firstInvalidField) return;

    const target = inputRefs.current[firstInvalidField];
    if (target?.focus) {
      target.focus();
      return;
    }
    const nativeHandle = target ? findNodeHandle(target as never) : null;
    if (nativeHandle) AccessibilityInfo.setAccessibilityFocus(nativeHandle);
  }, []);

  const save = useCallback(async (values: ParsedTransactionFormValues) => {
    const category = categories.find((candidate) => candidate.id === values.categoryId);
    if (!category) {
      setError("categoryId", {
        message: "A categoria selecionada não está mais disponível.",
        type: "validate",
      });
      focusFirstError({
        categoryId: {
          message: "A categoria selecionada não está mais disponível.",
          type: "validate",
        },
      });
      return;
    }

    const input: TransactionInput = { ...values, category: category.name };
    try {
      createMutation.reset();
      updateMutation.reset();
      let savedTransactionId = attachmentTransactionId;
      if (isEditing || savedTransactionId) {
        if (!savedTransactionId) throw new Error("Transação não encontrada.");
        await updateMutation.mutateAsync({ id: savedTransactionId, input });
      } else {
        const transaction = await createMutation.mutateAsync(input);
        savedTransactionId = transaction.id;
        setCreatedTransactionId(transaction.id);
      }

      if (!savedTransactionId) throw new Error("Transação não encontrada.");
      const uploadSummary = await attachmentInputRef.current?.uploadPending(
        savedTransactionId,
      );
      if (uploadSummary && uploadSummary.failed.length > 0) {
        Alert.alert(
          "Transação salva parcialmente",
          `${uploadSummary.uploaded.length} comprovante(s) enviado(s) e ${uploadSummary.failed.length} com falha. Tente novamente apenas nos arquivos com falha.`,
        );
        return;
      }

      reset({ ...values, amount: amountInputValue(values.amountInCents) });
      Alert.alert(
        isEditing ? "Transação atualizada" : "Transação criada",
        "Os dados foram salvos com sucesso.",
      );
      onSaved();
    } catch {
      // Mutation state provides the user-facing error below.
    }
  }, [
    categories,
    attachmentTransactionId,
    createMutation,
    focusFirstError,
    isEditing,
    onSaved,
    reset,
    setError,
    updateMutation,
  ]);

  const submit = useCallback(() => {
    if (submissionInFlightRef.current) return;
    submissionInFlightRef.current = true;
    void handleSubmit(
      async (values) => {
        try {
          await save(values);
        } finally {
          submissionInFlightRef.current = false;
        }
      },
      (fieldErrors) => {
        submissionInFlightRef.current = false;
        focusFirstError(fieldErrors);
      },
    )();
  }, [focusFirstError, handleSubmit, save]);

  if (isEditing && transactionQuery.isPending) {
    return <ScreenContainer includeBottomInset><QueryState kind="loading" message="Carregando transação..." /></ScreenContainer>;
  }
  if (isEditing && (transactionQuery.isError || !transactionQuery.data || !transactionId)) {
    return (
      <ScreenContainer includeBottomInset>
        <QueryState kind="error" message="Não foi possível carregar a transação para edição." onRetry={() => void transactionQuery.refetch()} />
      </ScreenContainer>
    );
  }
  if (categoriesQuery.isPending) {
    return <ScreenContainer includeBottomInset><QueryState kind="loading" message="Carregando formulário..." /></ScreenContainer>;
  }
  if (categoriesQuery.isError) {
    return (
      <ScreenContainer includeBottomInset>
        <QueryState kind="error" message="Não foi possível carregar as categorias." onRetry={() => void categoriesQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const inputClass = (hasError: boolean) =>
    `min-h-12 rounded-card border bg-white px-4 text-base text-bytebank-text dark:bg-bytebank-dark-elevated dark:text-bytebank-dark-text ${
      hasError ? "border-bytebank-danger dark:border-bytebank-dark-danger" : "border-bytebank-border dark:border-bytebank-dark-border"
    }`;

  return (
    <ScreenContainer includeBottomInset testID="transaction-form-screen">
      <View className="flex-row items-center gap-3 border-b border-bytebank-border py-3 dark:border-bytebank-dark-border">
        <Pressable accessibilityLabel="Voltar" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full bg-bytebank-surface active:opacity-70 dark:bg-bytebank-dark-surface" hitSlop={8} onPress={requestBack}>
          <ArrowLeft aria-hidden color={palette.text} size={21} />
        </Pressable>
        <Text accessibilityRole="header" className="text-xl font-bold text-bytebank-text dark:text-bytebank-dark-text">
          {isEditing ? "Editar transação" : "Nova transação"}
        </Text>
      </View>

      <View className="gap-5 pb-4 pt-6">
        <View>
          <FormLabel>Descrição</FormLabel>
          <Controller control={control} name="description" render={({ field: { onBlur, onChange, ref, value } }) => (
            <TextInput accessibilityLabel="Descrição da transação" className={inputClass(Boolean(errors.description))} editable={!isSaving} maxLength={120} onBlur={onBlur} onChangeText={onChange} placeholder="Ex.: supermercado" placeholderTextColor={palette.muted} ref={(instance) => { ref(instance); if (instance) inputRefs.current.description = instance; }} returnKeyType="next" value={value} />
          )} />
          <FieldErrorMessage message={errors.description?.message} />
        </View>

        <View>
          <FormLabel>Valor</FormLabel>
          <Controller control={control} name="amount" render={({ field: { onBlur, onChange, ref, value } }) => (
            <TextInput accessibilityLabel="Valor da transação em reais" className={inputClass(Boolean(errors.amount))} editable={!isSaving} keyboardType="decimal-pad" onBlur={onBlur} onChangeText={onChange} placeholder="R$ 0,00" placeholderTextColor={palette.muted} ref={(instance) => { ref(instance); if (instance) inputRefs.current.amount = instance; }} value={value} />
          )} />
          <FieldErrorMessage message={errors.amount?.message} />
        </View>

        <View>
          <FormLabel>Tipo</FormLabel>
          <Controller control={control} name="type" render={({ field: { onChange, value } }) => (
            <View
              className="flex-row gap-3"
              collapsable={false}
              ref={(instance) => {
                if (instance) inputRefs.current.type = instance;
              }}
            >
              {TYPE_OPTIONS.map((option) => (
                <Pressable accessibilityLabel={`Tipo: ${option.label}`} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} className={`min-h-12 flex-1 items-center justify-center rounded-card border ${value === option.value ? "border-bytebank-primary bg-bytebank-primary/10 dark:border-bytebank-dark-primary" : "border-bytebank-border bg-white dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated"}`} disabled={isSaving} key={option.value} onPress={() => {
                  onChange(option.value);
                  const selectedCategory = categories.find((category) => category.id === watch("categoryId"));
                  if (selectedCategory && selectedCategory.type !== "both" && selectedCategory.type !== option.value) {
                    setValue("categoryId", "", { shouldDirty: true, shouldValidate: true });
                  }
                }}>
                  <Text className="font-semibold text-bytebank-text dark:text-bytebank-dark-text">{option.label}</Text>
                </Pressable>
              ))}
            </View>
          )} />
          <FieldErrorMessage message={errors.type?.message} />
        </View>

        <View>
          <FormLabel>Categoria</FormLabel>
          <Controller control={control} name="categoryId" render={({ field: { onChange, value } }) => (
            <View
              className="flex-row flex-wrap gap-2"
              collapsable={false}
              ref={(instance) => {
                if (instance) inputRefs.current.categoryId = instance;
              }}
            >
              {visibleCategories.map((category: TransactionCategory) => (
                <Pressable accessibilityLabel={`Categoria: ${category.name}`} accessibilityRole="radio" accessibilityState={{ checked: value === category.id }} className={`min-h-11 justify-center rounded-full border px-4 ${value === category.id ? "border-bytebank-primary bg-bytebank-primary/10 dark:border-bytebank-dark-primary" : "border-bytebank-border bg-white dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated"}`} disabled={isSaving} key={category.id} onPress={() => onChange(category.id)}>
                  <Text className="font-semibold text-bytebank-text dark:text-bytebank-dark-text">{category.name}</Text>
                </Pressable>
              ))}
            </View>
          )} />
          {visibleCategories.length === 0 ? (
            <Text accessibilityRole="alert" className="text-sm text-bytebank-danger dark:text-bytebank-dark-danger">
              Nenhuma categoria cadastrada para este tipo. Carregue os dados iniciais e tente novamente.
            </Text>
          ) : null}
          <FieldErrorMessage message={errors.categoryId?.message} />
        </View>

        <View>
          <FormLabel>Data</FormLabel>
          <View className="relative">
            <Controller control={control} name="date" render={({ field: { onBlur, onChange, ref, value } }) => (
              <TextInput accessibilityHint="Use o formato ano, mês e dia" accessibilityLabel="Data da transação" className={`${inputClass(Boolean(errors.date))} pr-12`} editable={!isSaving} maxLength={10} onBlur={onBlur} onChangeText={onChange} placeholder="AAAA-MM-DD" placeholderTextColor={palette.muted} ref={(instance) => { ref(instance); if (instance) inputRefs.current.date = instance; }} value={value} />
            )} />
            <View className="pointer-events-none absolute right-4 top-3.5"><CalendarDays aria-hidden color={palette.muted} size={19} /></View>
          </View>
          <FieldErrorMessage message={errors.date?.message} />
        </View>

        <View>
          <FormLabel>Status</FormLabel>
          <Controller control={control} name="status" render={({ field: { onChange, value } }) => (
            <View
              className="flex-row flex-wrap gap-2"
              collapsable={false}
              ref={(instance) => {
                if (instance) inputRefs.current.status = instance;
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <Pressable accessibilityLabel={`Status: ${option.label}`} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} className={`min-h-11 justify-center rounded-full border px-4 ${value === option.value ? "border-bytebank-primary bg-bytebank-primary/10 dark:border-bytebank-dark-primary" : "border-bytebank-border bg-white dark:border-bytebank-dark-border dark:bg-bytebank-dark-elevated"}`} disabled={isSaving} key={option.value} onPress={() => onChange(option.value)}>
                  <Text className="font-semibold text-bytebank-text dark:text-bytebank-dark-text">{option.label}</Text>
                </Pressable>
              ))}
            </View>
          )} />
          <FieldErrorMessage message={errors.status?.message} />
        </View>

        <View>
          <FormLabel>Observação</FormLabel>
          <Controller control={control} name="observation" render={({ field: { onBlur, onChange, ref, value } }) => (
            <TextInput accessibilityLabel="Observação da transação" className={`${inputClass(Boolean(errors.observation))} min-h-28 py-3`} editable={!isSaving} maxLength={TRANSACTION_OBSERVATION_MAX_LENGTH} multiline onBlur={onBlur} onChangeText={onChange} placeholder="Informações adicionais (opcional)" placeholderTextColor={palette.muted} ref={(instance) => { ref(instance); if (instance) inputRefs.current.observation = instance; }} textAlignVertical="top" value={value} />
          )} />
          <Text className="mt-1 text-right text-xs text-bytebank-muted dark:text-bytebank-dark-muted">{watch("observation").length}/{TRANSACTION_OBSERVATION_MAX_LENGTH}</Text>
          <FieldErrorMessage message={errors.observation?.message} />
        </View>

        {renderAttachmentsExtension ? (
          renderAttachmentsExtension({
            disabled: isSaving,
            transactionId: attachmentTransactionId,
          })
        ) : (
          <MobileAttachmentInput
            disabled={isSaving}
            onDirtyChange={setAttachmentsDirty}
            ref={attachmentInputRef}
            transactionId={attachmentTransactionId}
          />
        )}

        {activeMutation.isError ? (
          <View accessibilityRole="alert" className="rounded-card bg-bytebank-danger/10 p-4 dark:bg-bytebank-dark-danger/10">
            <Text className="text-sm text-bytebank-danger dark:text-bytebank-dark-danger">{persistenceErrorMessage(activeMutation.error)}</Text>
          </View>
        ) : null}

        <Pressable accessibilityLabel={isEditing ? "Salvar alterações" : "Salvar transação"} accessibilityRole="button" accessibilityState={{ busy: isSaving, disabled: isSaving || visibleCategories.length === 0 }} className={`min-h-14 flex-row items-center justify-center gap-2 rounded-card bg-bytebank-primary dark:bg-bytebank-dark-primary ${isSaving || visibleCategories.length === 0 ? "opacity-60" : "active:bg-bytebank-primary-strong"}`} disabled={isSaving || visibleCategories.length === 0} onPress={submit}>
          {isSaving ? <ActivityIndicator color="#ffffff" /> : null}
          <Text className="text-base font-bold text-white dark:text-bytebank-dark-background">{isSaving ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar transação"}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

export function NewTransactionScreen(props: Omit<TransactionFormScreenProps, "mode" | "transactionId">) {
  return <TransactionFormScreen {...props} mode="create" />;
}
