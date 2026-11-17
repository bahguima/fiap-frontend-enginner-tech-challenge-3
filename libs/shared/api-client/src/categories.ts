import type { CategoryListResponse } from "@banking/shared/types";
import { restClient } from "./client";
import { apiEndpoints } from "./endpoints";

export interface CategoriesApi {
  list: () => Promise<CategoryListResponse>;
}

export const categoriesApi: CategoriesApi = {
  list: () =>
    restClient.request<CategoryListResponse>(apiEndpoints.categories.list, {
      conditional: true,
    }),
};
