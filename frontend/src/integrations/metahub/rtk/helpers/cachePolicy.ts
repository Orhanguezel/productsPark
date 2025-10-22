
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/helpers/cachePolicy.ts
// -------------------------------------------------------------
export type CachePreset = {
  keepUnusedDataFor: number; // seconds
  refetchOnMountOrArgChange?: boolean | number; // true | false | seconds
  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;
};

export const cache = {
  short(): CachePreset { return { keepUnusedDataFor: 30, refetchOnMountOrArgChange: 30, refetchOnFocus: true, refetchOnReconnect: true }; },
  medium(): CachePreset { return { keepUnusedDataFor: 300, refetchOnMountOrArgChange: 60, refetchOnFocus: false, refetchOnReconnect: true }; },
  long(): CachePreset { return { keepUnusedDataFor: 3600, refetchOnMountOrArgChange: false, refetchOnFocus: false, refetchOnReconnect: true }; },
} as const;
