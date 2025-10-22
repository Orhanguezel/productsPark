// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/integrations/metahub/rtk/baseApi";
import authReducer from "@/integrations/metahub/rtk/slices/auth/slice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (gDM) => gDM().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
