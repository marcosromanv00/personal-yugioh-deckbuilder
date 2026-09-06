# /audit-clean-code: Senior Clean Code Audit & Surgical Refactor

Protocolo de auditoría y refactorización quirúrgica de clase mundial (Amazon Technical Director standard). Su objetivo es identificar componentes o archivos que superen **200 líneas de código (LOC)** o violen los principios de Clean Code, descomponiéndolos en módulos altamente cohesivos, desacoplados y con tipado estricto.

---

## 1. Principios Inviolables de Ejecución

1. **Límite Estricto de 200 LOC**: Ningún archivo resultante (ni hooks, ni utils, ni componentes) debe superar las **200 líneas de código**.
2. **Zero-Any en TypeScript**: Prohibido el uso de `any` o `as any`. Todo contrato debe usar interfaces explícitas o `unknown` con guardas de tipo.
3. **Zero-Effect en React 19**: Prohibido sincronizar o derivar estado con `useEffect`. El estado se deriva al vuelo en render o se gestiona en event handlers/acciones.
4. **Tailwind CSS v4 Canónico**: Prohibidos valores arbitrarios con corchetes (`w-[250px]`). Usar escala estándar de Tailwind y directivas canónicas.
5. **Transparencia de Terminal**: Cada validación (`tsc`, `lint`, `build`) debe parsearse y presentarse en una tabla de resumen con métricas antes/después.

---

## 2. Flujo de Trabajo en 4 Fases

### Fase 1: Descubrimiento y Mapeo de Hotspots
1. Localizar los archivos más densos del workspace (>200 LOC) usando comandos de búsqueda o scripts de análisis.
2. Identificar los 4 antipatrones críticos de acoplamiento:
   - **State Bloat**: Múltiples `useState` que gestionan subdominios independientes en un solo componente.
   - **Duplicación de JSX**: Mismo árbol de componentes repetido para móvil, tablet y escritorio con ligeras variaciones de layout.
   - **Lógica de Negocio en la Vista**: Algoritmos de ordenamiento, filtrado, cálculos o llamadas a APIs mezclados con el renderizado.
   - **Prop Drilling & God Components**: Componentes contenedores que manejan modales, toasts, atajos de teclado y eventos globales a la vez.

### Fase 2: Plan de Descomposición Arquitectónica (SDD)
Antes de editar, documentar el esquema de partición respetando la estructura modular:
```text
features/[dominio]/
├── utils/                 # Funciones puras (cálculos, ordenamiento, formateo) (<200 LOC)
├── services/              # Integraciones externas y llamadas API (<200 LOC)
├── hooks/                 # Sub-hooks con estado específico de subdominio (<200 LOC)
├── components/            # Subcomponentes atómicos y vistas de layout (<200 LOC)
└── [Feature].tsx          # Orquestador maestro limpio (<200 LOC)
```

### Fase 3: Refactorización Quirúrgica Bottom-Up
1. **Extraer Funciones Puras**: Mover algoritmos a `[feature].utils.ts` o servicios independientes.
2. **Extraer Sub-Hooks**: Agrupar estados afines en hooks con nombres semánticos (`use[Feature]Shortcuts`, `use[Feature]DragAndDrop`, `use[Feature]ModalsState`).
3. **Consolidar Vistas Duplicadas (DRY)**: Si una sección de interfaz se repite en múltiples breakpoints, unificarla en un componente unificado (ej. `DeckBoard.tsx`).
4. **Desacoplar Modales y Diálogos**: Agrupar los modales en contenedores facade (`[Feature]Modals.tsx`) para no ensuciar el JSX principal.
5. **Reducir el Orquestador**: El componente principal debe quedar únicamente como un ensamblador de alto nivel de menos de 200 LOC.

### Fase 4: Verificación Estricta de 3 Capas
Ejecutar secuencialmente (comando por comando en Windows PowerShell, sin `&&`):
1. `npx tsc --noEmit` -> Verificar 0 errores de tipado.
2. `npm run lint` -> Validar reglas de linter sin regresiones.
3. `npm run build` -> Confirmar compilación completa y empaquetado de producción exitoso.

---

## 3. Tabla de Salida Obligatoria

Al finalizar, generar siempre un reporte de métricas:

| Archivo Original | LOC Antes | Módulos Resultantes | LOC Máx. Resultante | Reducción (%) | Estado TypeScript |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NombreComponente.tsx` | 2,109 | 19 archivos modulares | 193 LOC | -90.8% | ✅ 0 errores |
