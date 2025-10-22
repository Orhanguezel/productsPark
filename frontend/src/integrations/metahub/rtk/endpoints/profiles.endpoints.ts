import { baseApi } from "../baseApi";

/** DB’den gelen JSON’da tarih alanlarını string kabul ediyoruz */
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
  created_at: string; // ISO
  updated_at: string; // ISO
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
});

export const {
  useGetMyProfileQuery,
  useUpsertMyProfileMutation,
} = profilesApi;




/*

FE
import { useStatusQuery } from "@/integrations/metahub/rtk";

const { data: st } = useStatusQuery();
const isAdmin = !!st?.authenticated && st.is_admin;

const { data: myProfile } = useGetMyProfileQuery();
const [upsertMyProfile] = useUpsertMyProfileMutation();

await upsertMyProfile({ profile: { full_name: "Yeni Ad", city: "İzmir" } });


*/
