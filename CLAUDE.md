# CLAUDE.md — Products Park

## Proje Ozeti

Products Park, katalog, siparis ve odeme akislarini yoneten bir commerce management workspace'idir. Mevcut checkout'ta frontend ve backend uygulamalari vardir.

## Workspace Haritasi

- `frontend/`: React + Vite arayuzu, katalog ve yonetim ekranlari
- `backend/`: Fastify API, veri, siparis ve odeme katmani

## Calisma Kurallari

- dnd-kit, Stripe ve medya yonetimi gibi ana entegrasyonlar metadata ile tutarli belgelenir.
- Script bilgileri sadece mevcut `package.json` dosyalarindan alinir.
- README ve CLAUDE proje amacini commerce management odaginda tutar.

## Portfolio Metadata Rule

- Proje kokunde `project.portfolio.json` dosyasi zorunludur.
- Stack, proje ozeti ve servisler degistiginde once bu metadata dosyasi guncellenir.
- Portfolio seedleri icin ana kaynak bu metadata dosyasidir.
