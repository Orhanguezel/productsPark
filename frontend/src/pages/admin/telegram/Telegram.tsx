// =============================================================
// FILE: src/pages/admin/telegram/Telegram.tsx
// FINAL — Admin Telegram Page (Settings + Inbound + AutoReply)
// - Settings: site_settings telegram keys only
// - Inbound: /admin/telegram/inbound
// - AutoReply: /admin/telegram/autoreply
// =============================================================

'use client';

import * as React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import TelegramSettingsPanel from './components/TelegramSettingsPanel';
import TelegramInboundPanel from './components/TelegramInboundPanel';
import TelegramAutoReplyPanel from './components/TelegramAutoReplyPanel';

export default function TelegramAdminPage() {
  return (
    <AdminLayout title="Telegram">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          <TabsTrigger value="autoreply">Otomatik Yanıt</TabsTrigger>
          <TabsTrigger value="inbound">Gelen Mesajlar</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <TelegramSettingsPanel />
        </TabsContent>

        <TabsContent value="autoreply" className="space-y-4">
          <TelegramAutoReplyPanel />
        </TabsContent>

        <TabsContent value="inbound" className="space-y-4">
          <TelegramInboundPanel />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
