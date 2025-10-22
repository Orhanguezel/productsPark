// src/integrations/metahub/rtk/slices/auth/slice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Session } from "@/integrations/metahub/core/types";

type AuthState = {
  session: Session | null;
  tenant?: string | null;
  locale?: string | null;
};

const initial: AuthState = { session: null, tenant: null, locale: null };

const slice = createSlice({
  name: "auth",
  initialState: initial,
  reducers: {
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
    },
    setTenant(state, action: PayloadAction<string | null>) {
      state.tenant = action.payload;
    },
    reset() {
      return initial;
    },
  },
});

export const { setSession, setTenant, reset } = slice.actions;
export default slice.reducer;
