# Abgeleitete Messwerte

Alle Werte mit `node evidence/t_4a8106de/probes/metrics.mjs` berechnet, nicht geschätzt.

## Pegel
- Deckel bei Regler-Endanschlag −6 dBFS: Spitzenamplitude 0.501187 → -6.000 dBFS (Sollwert 0,50119 / −6,000 dBFS; Abweichung 1.52e-6 dB)
- Startpegel −20 dBFS, ein Ton (440 Hz Sinus): RMS 0.070481 → -23.039 dBFS. Der Sollwert −20 dBFS gilt als Spitzenamplitude 0,1; für einen Sinus ist RMS = Amplitude/√2, also 0.070711 = -23.010 dBFS RMS. Gemessen und Soll stimmen überein.
- Startpegel −20 dBFS, zwei Stimmen binaural: je Stimme Pegel 1/n = 0,05 → RMS 0.035424 (-29.014 dBFS), konsistent mit 1/n-Regel und Gesamtspitze 0,1.

## Kanaltrennung binaural (200 Hz links / 300 Hz rechts, −20 dBFS)
- Links: 200 Hz 0.016727 vs. 300 Hz 0.001611 → Verhältnis 10.4
- Rechts: 300 Hz 0.023568 vs. 200 Hz 0.001017 → Verhältnis 23.2
- Übersprechen links→rechts: 4.32 %, rechts→links: 9.63 %

## Binaural 8 Hz (200/208 Hz), 1,28 s Fenster
- Auflösung der verketteten Analyse: 0.781 Hz bei 61440 Samples
- Ergebnis: Peaks nicht eindeutig trennbar (Fensterlücken beim Polling des Analysators), deshalb hier keine Frequenzaussage — die Kanaltrennung ist über den 100-Hz-Fall belegt.

## Zustand nach Stopp
- Engine-Status: idle, mixRms links 0, rechts 0

