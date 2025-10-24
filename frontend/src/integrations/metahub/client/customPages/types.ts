/** Genel satır tipi */
export type UnknownRow = Record<string, unknown>;

export type CustomPageView = {
  id: string;
  title: string;
  slug: string;
  /** UI'nin beklediği düz HTML string */
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};