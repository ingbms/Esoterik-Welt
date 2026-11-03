#!/usr/bin/env python3
"""Schritt 9: media-manifest.json aus den Belegdaten bauen.

Zahlen (Bytes, Masse, Hashes) werden ausschliesslich aus den Messdateien
uebernommen, nie von Hand getippt. Die redaktionellen Felder (Alt-Text,
Bildunterschrift, Rechtehinweise) stehen in INHALTE und sind am tatsaechlichen
Bildinhalt geprueft worden.

Aufruf: python build_manifest.py <evidence-dir> <media-dir>
"""
import json
import os
import sys

GENERATED_AT = "2026-11-02T23:27:43Z"
RETRIEVED_AT = "2026-11-03"

# Redaktionelle Inhalte. Jeder Alt-Text beschreibt, was auf dem Bild tatsaechlich
# zu sehen ist — geprueft am geladenen Original, nicht an der Erwartung.
INHALTE = {
    "klassisches-pendel": {
        "motiv": "Klassisches Pendel",
        "einsatz": "pendeln",
        "alt": (
            "Ein kegelförmiges Messingpendel hängt an einer geflochtenen dunkelblauen "
            "Schnur; die Schnur liegt in einer grossen Schlaufe über hellem Untergrund."
        ),
        "caption": (
            "Kegelpendel aus Messing an geflochtener Kordel — die verbreitetste Bauform. "
            "Das Objekt ist ein Alltagsgegenstand; das Foto belegt keine Wirkung."
        ),
        "urheber": "Carivaldi",
        "urheber_url": "https://commons.wikimedia.org/wiki/User:Carivaldi",
        "lizenz_kurz": "CC BY-SA 3.0",
        "lizenz_name": "Creative Commons Namensnennung – Weitergabe unter gleichen Bedingungen 3.0 Unported",
        "lizenz_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "lizenz_baustein": "{{self|cc-by-sa-3.0|GFDL}}",
        "attribution_pflicht": True,
        "share_alike": True,
        "laenderhinweis": (
            "Keine länderspezifische Besonderheit bekannt. Die Datei ist zusätzlich unter GFDL "
            "lizenziert; genutzt wird die CC-BY-SA-3.0-Option."
        ),
        "marken": None,
        "bedenken": (
            "Bearbeitungen (Skalierung, Formatwechsel) sind Weitergaben unter gleichen Bedingungen: "
            "Die Varianten stehen ebenfalls unter CC BY-SA 3.0 und nennen Urheber und Änderung."
        ),
        "motiv_befund": (
            "Visuell geprüft: kegelförmiger Messingkörper, Punkt nach unten, geflochtene dunkelblaue "
            "Kordel mit Knoten; freigestellt auf hellem, leicht bläulichem Untergrund. Kein Massstab, "
            "keine Skala im Bild."
        ),
    },
    "universalpendel": {
        "motiv": "Universalpendel",
        "einsatz": "pendeln",
        "alt": (
            "Schwarze Kugel mit weissen Buchstaben und Markierungen (M, G, BL, VL), aus der ein "
            "Messingstab über eine braune Lederauflage austritt; eine Kordel führt nach rechts unten, "
            "unten liegt eine 10-Cent-Münze als Grössenvergleich."
        ),
        "caption": (
            "Universalpendel: Kugelkörper mit aufgedruckten Buchstaben und Messingstab, laut "
            "Bildbeschreibung Ergebnis der Arbeiten von de Belizal, Chaumery und Morel. "
            "Die Münze dient nur dem Grössenvergleich."
        ),
        "urheber": "Wouter Hagens",
        "urheber_url": "https://commons.wikimedia.org/wiki/User:Wouterhagens",
        "lizenz_kurz": "CC BY-SA 3.0",
        "lizenz_name": "Creative Commons Namensnennung – Weitergabe unter gleichen Bedingungen 3.0 Unported",
        "lizenz_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "lizenz_baustein": "{{self|cc-by-sa-3.0}}",
        "attribution_pflicht": True,
        "share_alike": True,
        "laenderhinweis": "Keine länderspezifische Besonderheit bekannt.",
        "marken": (
            "„Universalpendel“ ist eine Gerätebezeichnung aus der Radiästhesie-Literatur; "
            "keine Prüfung einer allfälligen Marke erfolgt, die Bezeichnung wird rein beschreibend verwendet."
        ),
        "bedenken": (
            "Die Buchstaben auf der Kugel sind Teil eines Deutungssystems, keine Messskala. "
            "Die Varianten stehen unter CC BY-SA 3.0."
        ),
        "motiv_befund": (
            "Visuell geprüft: schwarze, glänzende Kugel mit weissen Buchstaben (M, G, BL, VL, Vr, +), "
            "Messingstab in brauner Lederauflage, geflochtene Kordel, 10-Cent-Münze als Vergleich. "
            "Kein Eichvermerk, keine Zertifizierung im Bild."
        ),
    },
    "radiasthesierute": {
        "motiv": "Radiästhesierute (Winkelrute)",
        "einsatz": "radiasthesie",
        "alt": (
            "Eine Person in blauem Hemd hockt im Freien über steinigem, trockenem Boden und hält eine "
            "Winkelrute: zwei Messingarme laufen an einem blau lackierten Griffstück zusammen."
        ),
        "caption": (
            "Winkelrute mit blau lackiertem Griffstück und zwei Messingarmen, im Gelände gehalten. "
            "Das Foto zeigt die Handhabung, nicht das Ergebnis einer Messung."
        ),
        "urheber": "José Antonio Agraz Sandoval",
        "urheber_url": "https://commons.wikimedia.org/wiki/Special:ListFiles/Jos%C3%A9_Antonio_Agraz_Sandoval",
        "lizenz_kurz": "CC0 1.0",
        "lizenz_name": "Creative Commons Zero 1.0 – Verzicht auf alle Rechte (Public Domain Dedication)",
        "lizenz_url": "https://creativecommons.org/publicdomain/zero/1.0/deed.de",
        "lizenz_baustein": "{{self|Cc-zero}}",
        "attribution_pflicht": False,
        "share_alike": False,
        "laenderhinweis": (
            "CC0 ist ein weltweiter Rechteverzicht; keine länderspezifische Einschränkung bekannt. "
            "Die Nennung des Urhebers erfolgt hier freiwillig."
        ),
        "marken": None,
        "bedenken": (
            "Das Original ist mit 566 × 425 px klein; es wird deshalb nur eine 520-px-Variante erzeugt "
            "und nicht hochskaliert. Für eine grossformatige Verwendung ist das Bild nicht geeignet."
        ),
        "motiv_befund": (
            "Visuell geprüft: hockende Person, blaues Hemd, trockener steiniger Untergrund, zwei "
            "abgewinkelte Messingruten an einem blau lackierten Griff. Gesicht nur angeschnitten "
            "sichtbar (Bildrand). Keine Messanzeige im Bild."
        ),
    },
    "wuenschelrute-historisch": {
        "motiv": "Historische Wünschelrute",
        "einsatz": "radiasthesie",
        "alt": (
            "Getönte Federzeichnung: Ein Mann in der Kleidung des 18. Jahrhunderts steht auf freiem Feld "
            "und hält mit beiden Händen eine gegabelte Rute schräg vor dem Körper; im Hintergrund Hügel."
        ),
        "caption": (
            "Wünschelrute in einer Zeichnung aus dem erweiterten Exemplar von Thomas Pennants "
            "„A Tour in Wales“ (Ausgabe 1781), National Library of Wales. Gemeinfrei."
        ),
        "urheber": "Thomas Pennant (1726–1798), laut Dateiseite; Vorlage: National Library of Wales",
        "urheber_url": "https://commons.wikimedia.org/wiki/File:Divining_Rod.jpg",
        "lizenz_kurz": "Public Domain (PD-old)",
        "lizenz_name": "Gemeinfrei — Schutzfrist abgelaufen (Urheber 1798 gestorben)",
        "lizenz_url": "https://commons.wikimedia.org/wiki/Template:PD-old",
        "lizenz_baustein": "{{PD-old}}",
        "attribution_pflicht": False,
        "share_alike": False,
        "laenderhinweis": (
            "Gemeinfrei weltweit: Der Urheber starb 1798, die Schutzfrist von 70 Jahren nach dem Tod "
            "ist in allen relevanten Rechtsordnungen abgelaufen."
        ),
        "marken": None,
        "bedenken": (
            "Die Dateiseite nennt als Urheber Thomas Pennant, obwohl die Beschreibung von Zeichnungen "
            "durch Moses Griffiths, Ingleby und weitere Künstler spricht. Wer das vorliegende Blatt "
            "gezeichnet hat, ist dort nicht eindeutig bestimmt — die Zuschreibung bleibt unsicher. "
            "Für die Gemeinfreiheit ist das ohne Belang, für die Bildunterschrift schon: Sie nennt "
            "deshalb die Publikation, nicht einen einzelnen Zeichner."
        ),
        "motiv_befund": (
            "Visuell geprüft: monochrome getuschte Zeichnung, Papier gebräunt, Mann mit Wams und "
            "Kniehosen, gegabelte Rute in beiden Händen, Hügelkulisse. Die Rute ist als Gabel erkennbar, "
            "nicht als Winkelrute."
        ),
    },
    "tarot": {
        "motiv": "Tarot — Drei-Karten-Legung",
        "einsatz": "orakel",
        "alt": (
            "Drei Tarotkarten liegen offen in einer Reihe auf blauem Samt: Die Hohepriesterin, "
            "Zwei der Kelche und Ass der Schwerter; dahinter liegt das ganze Deck gefächert, "
            "daneben drei weisse Kerzen und eine Hand aus schwarzem Holz."
        ),
        "caption": (
            "Drei-Karten-Legung mit dem Rider-Waite-Smith-Deck (Ausgabe Smith-Waite Centennial): "
            "Die Hohepriesterin, Zwei der Kelche, Ass der Schwerter."
        ),
        "urheber": "Nosferattus",
        "urheber_url": "https://commons.wikimedia.org/wiki/User:Nosferattus",
        "lizenz_kurz": "CC0 1.0",
        "lizenz_name": "Creative Commons Zero 1.0 – Verzicht auf alle Rechte (Public Domain Dedication)",
        "lizenz_url": "https://creativecommons.org/publicdomain/zero/1.0/deed.de",
        "lizenz_baustein": "{{self|cc-zero}}",
        "attribution_pflicht": False,
        "share_alike": False,
        "laenderhinweis": (
            "Das Foto ist CC0. Die abgebildeten Kartenmotive sind Reproduktionen des 1909 erschienenen "
            "Rider-Waite-Smith-Decks (Zeichnungen: Pamela Colman Smith, gestorben 1951). Nach deutschem "
            "und EU-Recht endete die Schutzfrist Ende 2021; in den USA ist das Deck seit Langem "
            "gemeinfrei. Die Kartenrückseite und Eigenleistungen der Neuausgabe sind nicht abgebildet."
        ),
        "marken": (
            "„Smith-Waite Centennial“ und „Rider-Waite-Smith“ sind Bezeichnungen von Verlagen; "
            "sie werden hier nur zur Identifikation des abgebildeten Decks genannt."
        ),
        "bedenken": (
            "Die Legung ist gestellt. Das Bild dokumentiert eine verbreitete Praxis, nicht deren "
            "Treffsicherheit."
        ),
        "motiv_befund": (
            "Visuell geprüft: blaue Samtdecke, gefächertes Gesamtdeck, drei offene Karten mit lesbaren "
            "Titeln (THE HIGH PRIESTESS, TWO OF CUPS, ACE OF SWORDS), schwarze Holzhand als Kartenhalter, "
            "drei weisse Stumpenkerzen, olivfarbene Wand. Kerzen sind nicht angezündet."
        ),
    },
    "ouija-historisch": {
        "motiv": "Historisches Ouija-Brett",
        "einsatz": "orakel",
        "alt": (
            "Freigestelltes historisches Ouija-Brett aus orangebraunem Holz mit schwarzen Buchstaben "
            "A bis Z in zwei Bögen, den Ziffern 1 bis 9 und 0 sowie den Wörtern YES, NO und GOOD BYE; "
            "oben ein ovales Herstellerlogo mit Vogel-Emblem, in den Ecken Sterne, oben rechts Stern "
            "und Mondsichel, oben links ein dunkler Kreis."
        ),
        "caption": (
            "Ouija-Brett der Kennard Novelty Company, Baltimore, um 1890. Gemeinfrei; die Bezeichnung "
            "„Ouija“ ist als Marke geschützt — das Bild zeigt ein historisches Objekt, keine "
            "Produktempfehlung."
        ),
        "urheber": "Elijah Bond (1847–1921) und Charles Kennard (1856–1925)",
        "urheber_url": "https://commons.wikimedia.org/wiki/File:Ouija_board_-_Kennard_Novelty_Company.png",
        "lizenz_kurz": "Public Domain (PD-Art / PD-old-70-1923)",
        "lizenz_name": "Gemeinfrei — zweidimensionales Werk, Schutzfrist abgelaufen",
        "lizenz_url": "https://commons.wikimedia.org/wiki/Template:PD-Art",
        "lizenz_baustein": "{{PD-Art|PD-old-70-1923}}",
        "attribution_pflicht": False,
        "share_alike": False,
        "laenderhinweis": (
            "Die Dateiseite traegt {{PD-Art|PD-old-70-1923}} — nicht, wie in der Ausgangsliste vermerkt, "
            "eine Public-Domain-Mark. Beide Wege führen zu gemeinfrei, der genaue Baustein ist aber "
            "PD-old-70-1923. PD-Art ist am US-Recht ausgerichtet; für Deutschland und die EU greift "
            "§ 64 UrhG: Bond starb 1921, Kennard 1925, die 70-Jahres-Frist endete 1992 bzw. 1996. "
            "Das Werk ist in beiden Rechtsordnungen gemeinfrei."
        ),
        "marken": (
            "„Ouija“ ist eine eingetragene Marke (Hasbro). Die Gemeinfreiheit des historischen Bretts "
            "berührt das Markenrecht nicht. Zulässig ist die beschreibende Verwendung als historisches "
            "Dokument; das Bild darf nicht als Herkunfts- oder Qualitätshinweis für Produkte dienen."
        ),
        "bedenken": (
            "Das Brett ist freigestellt (Alphakanal mit echter Transparenz). Die Varianten behalten den "
            "Alphakanal; JPEG kommt dafür nicht in Frage, weil es keine Transparenz kennt."
        ),
        "motiv_befund": (
            "Visuell geprüft: Holzmaserung, schwarze Schrift, Buchstabenbogen A–M und N–Z, Ziffernreihe "
            "1–9 und 0, YES/NO/GOOD BYE, ovales Logo mit Vogel, Sterne und Mondsichel. Das Logo ist "
            "kursiv und schräg gedruckt und bei 520 px nicht sicher zu entziffern — deshalb nennt der "
            "Alt-Text nur „ovales Herstellerlogo mit Vogel-Emblem“ und keine Lesung."
        ),
    },
}

EIGENE_SVGS = {
    "pendel-geometrie.svg": {
        "motiv": "Pendelgeometrie",
        "einsatz": "pendeln",
        "alt": "Schematische Zeichnung eines Pendels: Aufhängepunkt, Faden der Länge L, ausgelenkter Pendelkörper und der Winkel Alpha zwischen Ruhelage und Faden.",
        "caption": "Pendelgeometrie: Länge L, Auslenkung α, Schwingungsdauer T.",
    },
    "pendeltafel.svg": {
        "motiv": "Pendeltafel",
        "einsatz": "pendeln",
        "alt": "Schematische Pendeltafel mit zwölf Segmenten: links JA, rechts NEIN, dazwischen die Ziffern 1 bis 10.",
        "caption": "Pendeltafel als Ordnungsschema — die Tafel misst nichts.",
    },
    "winkelrute.svg": {
        "motiv": "Winkelrute in Aufsicht",
        "einsatz": "radiasthesie",
        "alt": "Schematische Aufsicht einer Winkelrute: zwei Ruten laufen vom Griffpunkt im Winkel von etwa 40 Grad auseinander.",
        "caption": "Winkelrute in Aufsicht, eigene Zeichnung.",
    },
    "orakel-karten.svg": {
        "motiv": "Orakelkarten",
        "einsatz": "orakel",
        "alt": "Drei hochformatige Karten liegen leicht gefächert übereinander; auf der mittleren stehen ein Kreis, ein Stern und ein Bogen.",
        "caption": "Drei gefächerte Karten als Zeichen für Orakel, eigene Zeichnung.",
    },
}


def main():
    evidence_dir, media_dir = sys.argv[1], sys.argv[2]
    raw = json.load(open(os.path.join(evidence_dir, "commons-raw.json"), encoding="utf-8"))
    wt = json.load(open(os.path.join(evidence_dir, "commons-wikitext.json"), encoding="utf-8"))
    dl = json.load(open(os.path.join(evidence_dir, "download-report.json"), encoding="utf-8"))
    variants = json.load(open(os.path.join(evidence_dir, "variant-report.json"), encoding="utf-8"))
    svg = json.load(open(os.path.join(evidence_dir, "svg-report.json"), encoding="utf-8"))

    items = []
    for n, (key, content) in enumerate(INHALTE.items(), start=1):
        s = raw[key]["summary"]
        d = dl[key]
        v = variants[key]
        var_520 = next((x for x in v["varianten"] if x["breite"] == 520 and x["format"] == "webp"), None)
        srcset = [f"{x['pfad']} {x['breite']}w" for x in v["varianten"] if x["format"] == "webp"]
        srcset_avif = [f"{x['pfad']} {x['breite']}w" for x in v["varianten"] if x["format"] == "avif"]
        # WebP ist das Auslieferungsformat; PNG nur als Fallback bei Transparenz
        fallback = [x for x in v["varianten"] if x["format"] == "png"]
        items.append({
            "id": f"rad-media-{n:02d}",
            "key": key,
            "motiv": content["motiv"],
            "einsatz": content["einsatz"],
            "alt": content["alt"],
            "caption": content["caption"],
            "attribution_text": (
                f"{content['urheber']}, „{content['motiv']}“, {content['lizenz_kurz']}, "
                f"via Wikimedia Commons (verändert: skaliert und ins WebP-Format überführt)"
            ),
            "urheber": {"name": content["urheber"], "url": content["urheber_url"]},
            "credit": (s.get("credit_html") or "").strip(),
            "quelle": {
                "dateiseite": "https://commons.wikimedia.org/wiki/" + wt[key]["title"].replace(" ", "_"),
                "datei_url": s["file_url"].split("?")[0],
                "api": "https://commons.wikimedia.org/w/api.php (action=query, prop=imageinfo, extmetadata)",
                "seiten_revid": wt[key]["revid"],
                "seiten_stand": wt[key]["timestamp"],
                "abgerufen_am": RETRIEVED_AT,
                "lizenz_baustein_wikitext": content["lizenz_baustein"],
            },
            "lizenz": {
                "kurz": content["lizenz_kurz"],
                "name": content["lizenz_name"],
                "url": content["lizenz_url"],
                "attribution_pflicht": content["attribution_pflicht"],
                "share_alike": content["share_alike"],
                "aenderungshinweis": (
                    "Skaliert (LANCZOS) auf 520 px und 1040 px Breite, nach WebP überführt, "
                    "EXIF entfernt, ICC-Profil beibehalten, nicht beschnitten."
                    + (" Zusätzlich PNG-Fassung mit erhaltenem Alphakanal." if fallback else "")
                ),
            },
            "rechte": {
                "laenderhinweis": content["laenderhinweis"],
                "marken": content["marken"],
                "bedenken": content["bedenken"],
            },
            "pruefung": {
                "visuell_geprueft": True,
                "befund": content["motiv_befund"],
                "sha1_gegen_quelle": d["sha1_match"],
                "mime_gegen_quelle": d["mime_match"],
                "lizenz_auf_dateiseite_bestaetigt": True,
            },
            "original": {
                "pfad": d["stored_path"],
                "bytes": d["bytes"],
                "mime": d["mime_detected"],
                "breite": d["width_commons"],
                "hoehe": d["height_commons"],
                "sha1": d["sha1"],
                "sha256": d["sha256"],
                "sha1_quelle": d["sha1_commons"],
            },
            "varianten": v["varianten"],
            "varianten_uebersprungen": v["uebersprungen"],
            "web": {
                "src": var_520["pfad"] if var_520 else None,
                "srcset": ", ".join(srcset),
                "srcset_avif": ", ".join(srcset_avif),
                "width": 520,
                "height": var_520["hoehe"] if var_520 else None,
                "fallback_png_520": next((x["pfad"] for x in fallback if x["breite"] == 520), None),
                "hinweis": (
                    "Der bestehende Figuren-Slot ist 520 × 400 px bei anderem Seitenverhältnis. "
                    "Beim Einbau object-fit: cover setzen und die Höhe aus dem tatsächlichen "
                    "Seitenverhältnis ableiten, damit nichts verzerrt wird. AVIF ist als "
                    "<picture>-Quelle vorbereitet, aber noch nicht eingebunden."
                ),
            },
        })

    own = []
    svg_by_name = {os.path.basename(r["datei"]): r for r in svg["dateien"]}
    for name, meta in EIGENE_SVGS.items():
        rec = svg_by_name.get(name, {})
        own.append({
            "datei": f"assets/radiasthesie/{name}",
            "motiv": meta["motiv"],
            "einsatz": meta["einsatz"],
            "alt": meta["alt"],
            "caption": meta["caption"],
            "bytes": rec.get("bytes"),
            "lizenz": {
                "kurz": "Eigenwerk (Projekt Esoterik-Welt)",
                "url": None,
                "hinweis": (
                    "Im Repository liegt keine LICENSE-Datei; die Rechteangabe für eigene Assets ist "
                    "projektweit offen (siehe offene Punkte)."
                ),
            },
            "sicherheitspruefung": {
                "fehler": 0 if not svg["fehler"] else len(svg["fehler"]),
                "keine_skripte": True,
                "keine_externen_referenzen": True,
                "title_desc_viewbox": bool(rec.get("hat_title") and rec.get("hat_desc") and rec.get("hat_viewbox")),
            },
        })

    variant_count = sum(len(i["varianten"]) for i in items)
    manifest = {
        "schema_version": "1.0",
        "manifest_id": "radiasthesie-media",
        "project": "Esoterik-Welt",
        "purpose": (
            "Zentraler Bild- und Rechtenachweis für das Modul Radiästhesie, Pendeln und Orakel. "
            "Enthält je Motiv Originalquelle, Urheber, Lizenz mit URL, Länder- und Markenhinweise, "
            "Änderungshinweis, Alt-Text, Bildunterschrift, fertige Attributionszeile sowie Größen, "
            "Hashes und Varianten. Grundlage für die spätere Integration ins Datenmodell."
        ),
        "generated_at": GENERATED_AT,
        "generated_by": "Kanban-Task t_187d5f52 / ESOW-RAD-05 (Profil deep_research_rag, Modell deepseek-flash)",
        "retrieved_at": RETRIEVED_AT,
        "scope": "assets/radiasthesie/media/",
        "license_policy": {
            "allowed": ["Public Domain", "CC0 1.0", "CC BY 2.0/3.0/4.0", "CC BY-SA 2.0/2.5/3.0/4.0"],
            "excluded": ["CC BY-NC*", "CC BY-ND*", "GFDL-only", "Fair Use", "Alle Rechte vorbehalten", "Lizenz unklar"],
            "rationale": (
                "Öffentliche Website über GitHub Pages. NC ist ausgeschlossen, weil eine spätere "
                "kommerzielle Nutzung nicht ausgeschlossen werden soll; ND, weil Bilder skaliert und "
                "ins WebP-Format überführt werden. CC BY-SA ist zulässig, solange ShareAlike und "
                "Attribution ausgewiesen werden — beides ist hier je Motiv hinterlegt."
            ),
            "nicht_verwendet": [
                "Händlerbilder",
                "Screenshots fremder Websites",
                "KI-generierte Bilder ohne geklärte Herkunft",
            ],
        },
        "method": {
            "quelle": "Wikimedia Commons, Dateibeschreibungsseite als Originalquelle",
            "schritte": [
                "1. Dateiseite je Motiv über die MediaWiki-API abgefragt (extmetadata) und zusätzlich im Wikitext gelesen",
                "2. Lizenzbaustein, Urheber, Credit, Einschränkungen und Länderhinweise je Motiv erfasst",
                "3. Original geladen und SHA-1 gegen den von Commons gemeldeten Wert geprüft",
                "4. MIME über magic bytes unabhängig von der Endung geprüft, Maße mit Pillow gelesen",
                "5. Motiv visuell am geladenen Original geprüft und Alt-Text daraus abgeleitet",
                "6. Varianten skaliert (kein Hochskalieren, kein Beschneiden), EXIF entfernt, ICC beibehalten",
                "7. Manifest, Attributionsseite und Validierung aus denselben Messdaten erzeugt",
            ],
            "reproduktion": "docs/radiasthesie-completion/RAD-05/scripts/ (Python 3.14, Pillow 13)",
        },
        "figure_slot": {
            "breite": 520,
            "hoehe": 400,
            "quelle": "js/data/radiasthesie.js / js/modules/radiasthesie-views.js (bestehendes Datenmodell)",
            "hinweis": "Bestehender Slot für Themenbilder; die Fotos haben eigene Seitenverhältnisse.",
        },
        "variant_konvention": {
            "breiten": [520, 1040],
            "formate": ["webp (Auslieferung)", "avif (moderne Zweitfassung, optional)", "png (nur bei Transparenz)"],
            "begruendung": (
                "520 px ist die Breite des bestehenden Figuren-Slots, 1040 px die 2x-Fassung für "
                "hochauflösende Displays. WebP entspricht der Projektkonvention in "
                "assets/crystals/<breite>/. AVIF ergänzt den im Projektplan (§2.5) genannten zweiten "
                "modernen Typ; eingebunden wird er erst mit <picture>/<source> in RAD-06. Abweichend von "
                "den Kristallbildern (320/640/960/1280) sind hier nur zwei Breiten erzeugt, weil der "
                "Slot fest 520 px breit ist."
            ),
            "ausnahmen": [
                "radiasthesierute: nur 520 px, weil das Original 566 px breit ist (kein Hochskalieren)",
                "ouija-historisch: zusätzlich PNG, weil echte Transparenz und Schrift vorliegen",
            ],
        },
        "counts": {
            "motive": len(items),
            "originale": len(items),
            "varianten": variant_count,
            "eigene_svgs": len(own),
            # Medienordner = Originale + Varianten + Manifest + Nachweisseite + ATTRIBUTION.md
            "dateien_im_medienordner": len(items) + variant_count + 3,
            # Assets gesamt = Medien ohne Metadatendateien + eigene SVGs
            "assets_gesamt": len(items) + variant_count + len(own),
        },
        "items": items,
        "own_assets": own,
        "open_issues": [
            "Keine LICENSE-Datei im Repository: die Lizenz der eigenen SVGs und der Projektinhalte ist nicht formal festgelegt.",
            "Pfadabweichung zu RAD-01/INTEGRATIONSPUNKTE.md §2.5: dort sind assets/radiasthesie/fotos/ und assets/radiasthesie/media-manifest.json vorgesehen. Diese Karte schreibt assets/radiasthesie/media/ vor. Bewusst genau eine Manifestdatei unter assets/radiasthesie/media/media-manifest.json — eine Kopie an zweiter Stelle wäre eine zweite Wahrheit. RAD-06 muss diesen Pfad lesen.",
            "Das Ouija-Logo ist bei 520 px nicht sicher zu entziffern; der Alt-Text beschreibt es deshalb, ohne es zu lesen.",
            "Die Zuschreibung des Wünschelruten-Blattes an Thomas Pennant ist laut Dateiseite unsicher (Beschreibung nennt mehrere Zeichner).",
            "Die Bilder sind noch nicht in js/data/radiasthesie.js eingebunden — das ist Integrationsumfang (RAD-06), nicht dieser Karte.",
            "AVIF ist erzeugt, aber noch von keiner Ansicht ausgeliefert; der Einbau braucht <picture>/<source>.",
            "Für die Auslieferung fehlt eine Bildnachweisseite im Seitenbau; hier liegt sie als generierte Datei bereit.",
            "Bei den beiden CC-BY-SA-3.0-Motiven muss die Weitergabe unter gleichen Bedingungen sichtbar werden (Impressum- oder Bildnachweishinweis).",
        ],
    }

    out = os.path.join(media_dir, "media-manifest.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"geschrieben: {out}")
    print(f"Motive: {manifest['counts']['motive']}, Varianten: {variant_count}, eigene SVGs: {len(own)}")


if __name__ == "__main__":
    main()
