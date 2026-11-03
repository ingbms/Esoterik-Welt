# Evidenz Ticket t_4a8106de (Restrisiken R-1 bis R-3)

Prüfstand: `71b895c`. Erhoben am 2026-11-03, 02:45–03:10 CET auf `Mini_IT12`, Windows 11.

## Was hier liegt

| Datei | Herkunft / Inhalt |
| --- | --- |
| `ax-probe.json` | `probes/ax-probe.mjs` — Accessibility-Baum, DOM-Zustände und Status-/Fehlertexte in Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2 und mobiler Chromium-Emulation |
| `probe2.json` | `probes/probe2.mjs` — WebKit ohne Web-Audio, Sweep-Status-Timeline, binaurale Kanaltrennung, Pegeldeckel |
| `probe3.json` | `probes/probe3.mjs` — Kanaltrennung 8 Hz und 100 Hz, Zustand nach Stopp, erster Tab-Wechsel-Versuch |
| `probe4.json` | `probes/probe4.mjs` — Tab-Wechsel über drei Strategien (echter Tabwechsel, Fenster minimieren, gestubbter `visibilitychange`) |
| `probe5.json` | `probes/probe5.mjs` — Sweep-Fortschritt im AX-Baum während und nach dem Sweep |
| `metrics.md` | `probes/metrics.mjs` — abgeleitete Pegel und Verhältnisse, ausschließlich berechnet |
| `bcd-audiocontext.json`, `bcd-stereopanner.json` | MDN Browser-Compat-Data, lokal gesichert (Safari-Support von `AudioContext` und `StereoPannerNode`) |
| `chromium-lab-1440.png`, `chromium-lab-390.png`, `chromium-lab-error.png`, `chromium-hub-1440.png` | Screenshots aus Chromium; **kein** Safari-Beleg |

## Was hier ausdrücklich fehlt

- keine Aufnahme oder Messung echter Audio-Hardware (kein Loopback-Gerät auf dem Host),
- keine Safari-/iOS-Messung (kein Apple-Gerät),
- keine NVDA-/VoiceOver-Aufzeichnung (NVDA nicht installiert, kein Apple-Gerät).

Die Protokollbögen für diese drei Blöcke stehen in `docs/qa-restrisiken-r1r3.md`, Abschnitte 4.3, 5.3 und 6.2.
