export interface ApiEndpoints {
  auth: {
    login: string;
    logout: string;
    session: string;
    refresh: string;
    csrf: string;
  };
  dashboard: {
    home: string;
    summary: string;
    monthly: string;
  };
  profile: string;
  transactions: {
    list: string;
    detail: (transactionId: string) => string;
    attachments: (transactionId: string) => string;
  };
  categories: {
    list: string;
  };
  attachments: {
    detail: (attachmentId: string) => string;
  };
}

export const apiEndpoints: ApiEndpoints = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    session: "/api/auth/session",
    refresh: "/api/auth/refresh",
    csrf: "/api/auth/csrf",
  },
  dashboard: {
    home: "/api/dashboard/home",
    summary: "/api/dashboard/summary",
    monthly: "/api/dashboard/monthly",
  },
  profile: "/api/profile",
  transactions: {
    list: "/api/transactions",
    detail: (transactionId) => `/api/transactions/${encodeURIComponent(transactionId)}`,
    attachments: (transactionId) =>
      `/api/transactions/${encodeURIComponent(transactionId)}/attachments`,
  },
  categories: {
    list: "/api/categories",
  },
  attachments: {
    detail: (attachmentId) => `/api/attachments/${encodeURIComponent(attachmentId)}`,
  },
};

export const mockApiEndpoints = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    session: "/api/auth/session",
    refresh: "/api/auth/refresh",
    csrf: "/api/auth/csrf",
  },
  dashboard: {
    home: "/api/dashboard/home",
    summary: "/api/dashboard/summary",
    monthly: "/api/dashboard/monthly",
  },
  profile: "/api/profile",
  transactions: {
    list: "/api/transactions",
    detail: "/api/transactions/:transactionId",
    attachments: "/api/transactions/:transactionId/attachments",
  },
  categories: {
    list: "/api/categories",
  },
  attachments: {
    detail: "/api/attachments/:attachmentId",
  },
};
