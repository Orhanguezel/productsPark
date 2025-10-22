import { baseApi } from "../baseApi";

export const functionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    invokeFunction: b.mutation<{ result: unknown }, { name: string; body?: unknown }>({
      query: ({ name, body }) => ({
        url: `/functions/${encodeURIComponent(name)}`,
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: ["Functions"],
    }),
  }),
});

export const { useInvokeFunctionMutation } = functionsApi;
