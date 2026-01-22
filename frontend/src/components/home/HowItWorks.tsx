// =============================================================
// FILE: src/components/home/HowItWorks.tsx
// FINAL — Home HowItWorks (RTK keys only, NO fallback)
// - pulls values from site_settings via listSiteSettings(keys=...)
// - no local state/useEffect
// - icons preserved
// =============================================================

import React, { useMemo } from 'react';
import { Search, CreditCard, Download, Shield } from 'lucide-react';

import { useListSiteSettingsQuery } from '@/integrations/hooks';
import type { JsonLike } from '@/integrations/types';
import { toStr } from '@/integrations/types';

const KEYS = [
  'home_how_it_works_title',
  'home_how_it_works_subtitle',
  'home_step_1_title',
  'home_step_1_desc',
  'home_step_2_title',
  'home_step_2_desc',
  'home_step_3_title',
  'home_step_3_desc',
  'home_step_4_title',
  'home_step_4_desc',
] as const;

type Key = (typeof KEYS)[number];

function getString(map: Map<string, JsonLike>, key: Key): string {
  return toStr(map.get(key)).trim();
}

const HowItWorks: React.FC = () => {
  const {
    data: settingsList,
    isLoading,
    isFetching,
  } = useListSiteSettingsQuery({
    keys: [...KEYS],
    order: 'key.asc',
    limit: 50,
    offset: 0,
  });

  const loading = isLoading || isFetching;

  const map = useMemo(() => {
    const m = new Map<string, JsonLike>();
    for (const row of settingsList ?? []) m.set(row.key, row.value);
    return m;
  }, [settingsList]);

  const title = getString(map, 'home_how_it_works_title');
  const subtitle = getString(map, 'home_how_it_works_subtitle');

  const steps = useMemo(
    () => [
      {
        icon: Search,
        title: getString(map, 'home_step_1_title'),
        description: getString(map, 'home_step_1_desc'),
      },
      {
        icon: CreditCard,
        title: getString(map, 'home_step_2_title'),
        description: getString(map, 'home_step_2_desc'),
      },
      {
        icon: Download,
        title: getString(map, 'home_step_3_title'),
        description: getString(map, 'home_step_3_desc'),
      },
      {
        icon: Shield,
        title: getString(map, 'home_step_4_title'),
        description: getString(map, 'home_step_4_desc'),
      },
    ],
    [map],
  );

  return (
    <section id="nasil-calisir" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{loading ? '' : title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{loading ? '' : subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={`${step.title}-${index}`} className="relative">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-6 relative">
                  <step.icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3">{loading ? '' : step.title}</h3>
                <p className="text-muted-foreground">{loading ? '' : step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
