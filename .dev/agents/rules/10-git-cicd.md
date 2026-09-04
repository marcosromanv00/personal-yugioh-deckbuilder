# Git, Commits Atómicos & CI/CD - personal-yugioh-deckbuilder

---

## 1. Taxonomía de Repositorio
Este repositorio sigue la convención canónica:
`personal-yugioh-deckbuilder` (Categoría: `personal-[tipo]-[nombre]`).

---

## 2. Convención de Ramas
- `feat/deck-...`: Nuevas funciones del constructor o visor.
- `fix/deck-...`: Corrección de bugs o visualización.
- `refactor/clean-...`: Refactorización de código limpio.

---

## 3. Conventional Commits Atómicos
Cada commit individual debe ser bisectable (`git bisect` clean) y compilar limpiamente:
```bash
git commit -m "feat(deckbuilder): add archetype ratio breakdown card"
git commit -m "fix(linter): eradicate useEffect derived state in CardSlot"
```
