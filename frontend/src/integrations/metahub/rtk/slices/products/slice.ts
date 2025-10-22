// src/integrations/metahub/rtk/slices/products/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ListProductsParams = {
  category_id?: string;
  is_active?: string | boolean;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "price" | "rating" | "created_at";
  order?: "asc" | "desc";
  slug?: string;
};

type ProductsState = {
  lastQuery: ListProductsParams | null;
  selectedId: string | null;
};

const initial: ProductsState = { lastQuery: null, selectedId: null };

const slice = createSlice({
  name: "products",
  initialState: initial,
  reducers: {
    setLastQuery(state, action: PayloadAction<ListProductsParams | null>) {
      state.lastQuery = action.payload;
    },
    setSelectedId(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    reset() {
      return initial;
    },
  },
});

export const { setLastQuery, setSelectedId, reset } = slice.actions;
export default slice.reducer;
