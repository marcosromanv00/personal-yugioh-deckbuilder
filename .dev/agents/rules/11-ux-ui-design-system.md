# Estándar de Diseño de Clase Mundial & UX Heurístico - personal-yugioh-deckbuilder

Este proyecto implementa el arquetipo **Gaming / Interactive HUD** complementado con **Dark Tech Craft**, inspirado en interfaces de referencia como **Master Duel, Spotify y Linear**.

---

## 1. Arquetipo Asignado: Gaming / Interactive HUD
- **Superficies**: Sólidas y profundas (`#09090b` / `zinc-950`), sin abusar de transparencias difuminadas.
- **Acentos Focales**: Rojo combate (`red-600` / `red-500`) para acciones primarias, vida y alertas.
- **Tipografía**:
  - Titulares con carácter: `Outfit` o `Geist` (`tracking-tight`).
  - Datos numéricos (ATK, DEF, niveles, ratios): `font-mono` (`JetBrains Mono` / `Geist Mono`).

---

## 2. Cumplimiento de Heurísticas de Nielsen
1. **Visibilidad**: Skeletons que imitan cartas de Yu-Gi-Oh! mientras carga el catálogo (prohibidos spinners circulares genéricos).
2. **Control**: Modales de confirmación antes de eliminar o vaciar una baraja; soporte para tecla `Esc` en modales y drawers.
3. **Consistencia**: Mismo botón `PremiumDropdown` en todos los selectores de filtros; layout de 3 columnas protegido en desktop.
4. **Prevención de Errores**: Deshabilitar guardado si la baraja excede los límites legales (40-60 Main Deck, máx 15 Extra Deck).
5. **Reconocimiento**: Contador flotante persistente de cartas en la cabecera del constructor.

---

## 3. Reglas de Animación (Framer Motion)
- **Spring Physics**: Física de resorte (`stiffness: 120, damping: 20`) en cartas y modales; cero transiciones lineales aburridas.
- **Feedback Táctil**: `whileTap={{ scale: 0.96 }}` en cartas al añadirlas a la baraja.
