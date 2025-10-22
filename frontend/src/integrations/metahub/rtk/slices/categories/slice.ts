// src/integrations/metahub/rtk/slices/categories/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type CategoriesState = {
  selectedId: string | null;
};

const initial: CategoriesState = { selectedId: null };

const slice = createSlice({
  name: "categories",
  initialState: initial,
  reducers: {
    setSelectedId(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    reset() {
      return initial;
    },
  },
});

export const { setSelectedId, reset } = slice.actions;
export default slice.reducer;
