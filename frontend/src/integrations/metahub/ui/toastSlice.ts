
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/slices/ui/toastSlice.ts
// -------------------------------------------------------------
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Toast } from "@/integrations/metahub/ui/toast/types";

export type ToastState = { list: Toast[] };
const initialState: ToastState = { list: [] };

const slice = createSlice({
  name: "ui/toasts",
  initialState,
  reducers: {
    push(state, action: PayloadAction<Toast>) { state.list.push(action.payload); },
    remove(state, action: PayloadAction<string>) { state.list = state.list.filter(t => t.id !== action.payload); },
    clear(state) { state.list = []; },
  },
});

export const toastReducer = slice.reducer;
export const toastActions = slice.actions;
