# Trampolin Tricks PWA

Minimaler Prototyp eines Physik-Arcade-Spiels im Hochformat. Vollständige Steuerung per Touch, offline spielbar als Progressive Web App.

## Entwicklung

1. Öffne `index.html` im mobilen Safari oder einem anderen modernen Browser.
2. Zum Installieren als PWA im Browser-Menü "Zum Home-Bildschirm" wählen.
3. Assets werden vom Service Worker gecacht; danach offline spielbar.

## Steuerung
- **Tippen/Halten:** Trampolin spannen und springen.
- **Wischen hoch/runter:** Extra-Impuls oder abbremsen.
- **Wischen links/rechts:** Rotation in der Luft.
- **Zweitfinger tippen:** Trick auslösen (Multiplikator).

## Physik-Parameter
Die wichtigsten Parameter befinden sich am Anfang von `main.js` und können angepasst werden:
- `k` – Federkonstante des Trampolins
- `c` – Dämpfung
- `airDrag` – Luftwiderstand
- `maxCompression` – maximaler Federweg
- `gravity` – Gravitation

## Assets
- `manifest.json` und `sw.js` für PWA-Funktionalität
- Optionale eigene App-Icons können in `icons/` abgelegt werden

## Lizenz
Dieser Prototyp ist frei nutzbar zu Demonstrationszwecken.
