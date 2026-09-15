const messagesByCode: Record<string, string> = {
  "auth/invalid-credential":
    "E-mail ou senha incorretos. Confira os dados e tente novamente.",
  "auth/invalid-email": "Digite um endereço de e-mail válido.",
  "auth/network-request-failed":
    "Não foi possível conectar. Verifique sua internet e tente novamente.",
  "auth/too-many-requests":
    "Muitas tentativas foram feitas. Aguarde alguns minutos e tente novamente.",
  "auth/user-disabled":
    "Esta conta está desativada. Entre em contato com o atendimento.",
  "auth/user-not-found":
    "E-mail ou senha incorretos. Confira os dados e tente novamente.",
  "auth/wrong-password":
    "E-mail ou senha incorretos. Confira os dados e tente novamente.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;

    if (typeof code === "string" && messagesByCode[code]) {
      return messagesByCode[code];
    }
  }

  return "Não foi possível entrar agora. Tente novamente em instantes.";
}
