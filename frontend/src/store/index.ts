// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/integrations/baseApi";


export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (gDM) => gDM().concat(baseApi.middleware),
  devTools: import.meta.env.DEV ?? false,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
