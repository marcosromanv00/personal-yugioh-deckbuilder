# ADR 0001: Persistencia de Estado de Navegación en URL Search Params & Shimmer Skeletons

## Estado
**Aceptado** (Implementado en PR #1)

## Contexto
En las primeras versiones del módulo de colección, al recargar la página o compartir un enlace, el usuario perdía completamente el contexto visual:
- La pestaña activa (`colección completa`, `contenedores`, `mazos`, `fundas`, `valoración`) se reseteaba al valor por defecto.
- Los contenedores o mazos abiertos se cerraban, forzando al usuario a volver a navegar y filtrar manualmente.
- Además, durante los tiempos de carga inicial de las colecciones físicas, la interfaz presentaba parpadeos bruscos (layout shifts) al cambiar entre estados vacíos y datos renderizados.

## Decisión
1. **Sincronización Bidireccional con URL Search Params**:
   - Se implementó un hook de navegación que sincroniza el estado activo (`tab`, `containerId`, `deckId`) con los parámetros de búsqueda de la URL (`?tab=containers&id=...`) utilizando `useSearchParams` y `useRouter.replace` de Next.js sin recargar la página.
   - Permite deep-linking directo para inspeccionar contenedores y mazos específicos desde enlaces compartidos o marcadores.
2. **Shimmer Skeletons de Alta Fidelidad**:
   - Se reemplazaron los spinners genéricos por esqueletos animados con efecto Shimmer adaptados a la cuadrícula de contenedores y cartas físicas, eliminando saltos de diseño acumulados (CLS = 0).

## Consecuencias
- **Positivas**:
  - Experiencia de usuario consistente al pulsar "Atrás" o recargar el navegador.
  - Cero layout shift durante transiciones de red.
  - Capacidad de enviar enlaces directos a cajas o binders específicos.
- **Trade-offs**:
  - Requiere envolver componentes consumidores en `<Suspense>` según las reglas de Next.js App Router para evitar deshidratación en cliente de `useSearchParams`.

## Referencias
- PR #1: `feat/sleeve-and-collection-enhancements`
- Commits: `a6af203`, `87f18f7`
