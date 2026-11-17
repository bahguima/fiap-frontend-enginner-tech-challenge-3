import { http, HttpResponse } from "msw";
import type {
  ApiErrorResponse,
  UserProfileResponse,
} from "@banking/shared/types";
import { mockApiEndpoints } from "@banking/shared/api-client/endpoints";
import { guardProtectedRequest } from "./security";
import { mockUserProfile } from "../fixtures/profile";
import { applyMockBehavior } from "./behavior";

export const profileHandlers = [
  http.get<never, never, UserProfileResponse | ApiErrorResponse>(
    mockApiEndpoints.profile,
    async ({ request }) => {
      const forcedError = await applyMockBehavior(request, { status: 503 });
      if (forcedError) return forcedError;
      const denied = guardProtectedRequest(request);
      if (denied) return denied;

      return HttpResponse.json<UserProfileResponse>(mockUserProfile);
    },
  ),
];
