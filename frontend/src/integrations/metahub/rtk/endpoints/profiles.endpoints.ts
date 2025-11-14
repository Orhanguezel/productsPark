// src/integrations/metahub/rtk/endpoints/profiles.endpoints.ts

import { baseApi } from "../baseApi";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
};

export type ProfileUpsertInput = Partial<Pick<
  Profile,
  | "full_name"
  | "phone"
  | "avatar_url"
  | "address_line1"
  | "address_line2"
  | "city"
  | "country"
  | "postal_code"
>>;

type GetMyProfileResp = Profile | null;
type UpsertMyProfileReq = { profile: ProfileUpsertInput };
type UpsertMyProfileResp = Profile;

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMyProfile: b.query<GetMyProfileResp, void>({
      query: () => ({ url: "/profiles/v1/me", method: "GET" }),
      providesTags: ["Profile"],
    }),

    upsertMyProfile: b.mutation<UpsertMyProfileResp, UpsertMyProfileReq>({
      query: (body) => ({
        url: "/profiles/v1/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetMyProfileQuery,
  useUpsertMyProfileMutation,
} = profilesApi;
