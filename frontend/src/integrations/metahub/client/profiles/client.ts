import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  profilesApi,
  type Profile,
  type ProfileUpsertInput,
} from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";

export type { Profile, ProfileUpsertInput };

export const profilesClient = {
  async me() {
    try {
      const data = await store.dispatch(
        profilesApi.endpoints.getMyProfile.initiate()
      ).unwrap();
      return { data, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Profile | null, error: { message } };
    }
  },

  async upsert(input: ProfileUpsertInput) {
    try {
      const data = await store.dispatch(
        profilesApi.endpoints.upsertMyProfile.initiate({ profile: input })
      ).unwrap();
      return { data, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Profile | null, error: { message } };
    }
  },
};
