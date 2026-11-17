import { http, HttpResponse } from "msw";
import type { ApiErrorResponse, CategoryListResponse } from "@banking/shared/types";
import { mockApiEndpoints } from "@banking/shared/api-client/endpoints";
import { guardProtectedRequest } from "./security";
import { mockCategories, mockCategoriesRevision } from "../fixtures/categories";
import { applyMockBehavior } from "./behavior";

/** ETag forte derivado da revisão do catálogo (muda quando o catálogo muda). */
export const categoriesEtag = `"categories-${mockCategoriesRevision}"`;

const cacheHeaders = {
  ETag: categoriesEtag,
  "Cache-Control": "private, no-cache",
  "Access-Control-Expose-Headers": "ETag",
};

function matchesEtag(ifNoneMatch: string | null) {
  if (!ifNoneMatch) return false;
  return ifNoneMatch
    .split(",")
    .map((tag) => tag.trim().replace(/^W\//, ""))
    .some((tag) => tag === "*" || tag === categoriesEtag);
}

export const categoriesHandlers = [
  http.get<never, never, CategoryListResponse | ApiErrorResponse | null>(
    mockApiEndpoints.categories.list,
    async ({ request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;
      const denied = guardProtectedRequest(request);
      if (denied) return denied;

      // Revalidação condicional: catálogo inalterado responde 304 sem corpo.
      if (matchesEtag(request.headers.get("If-None-Match"))) {
        return new HttpResponse(null, { status: 304, headers: cacheHeaders });
      }

      return HttpResponse.json<CategoryListResponse>(
        { items: mockCategories },
        { headers: cacheHeaders },
      );
    },
  ),
];
