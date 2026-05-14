# Design System — Lavaderola55

## Identidad y contexto de uso

**Nombre del producto**: LavoPanel *(interno, puede cambiar)*
**Tipo**: App de gestión operativa para lavadero + parqueadero
**Usuarios**: Operarios (trabajadores), dueño y admin. Personal, no clientes.
**Entorno real de uso**:
- Parqueadero/lavadero a la intemperie o zona húmeda
- Manos posiblemente mojadas o con guantes
- Luz solar directa (→ alto contraste sobre fondos claros, más legible que dark mode en exteriores)
- Consultas rápidas entre tareas físicas (→ velocidad, no complejidad)

**Prioridad de dispositivos**: Mobile → Tablet → Desktop (en ese orden)

---

## Principios de diseño

1. **Velocidad sobre elegancia** — cada acción debe completarse en ≤3 toques desde cualquier pantalla.
2. **Legible a plena luz solar** — contraste WCAG AA mínimo, preferir AAA en textos críticos. Light mode es más legible en exteriores que dark mode.
3. **Touch-first** — targets mínimos de 48×48px, espaciado generoso entre elementos interactivos.
4. **Estado siempre visible** — el usuario sabe en todo momento qué slots están ocupados, qué turno está abierto y qué órdenes están pendientes.
5. **Personalidad sin decoración** — la distinción viene de la paleta cálida, el peso tipográfico y el uso intencional del naranja; no de gradientes ni ilustraciones.

---

## Paleta de colores

### Base — Light mode (principal)

| Token | Hex | Tailwind | Uso |
|---|---|---|---|
| `bg-base` | `#F5F0EB` | — | Fondo global (warm off-white, no pure white) |
| `bg-surface` | `#FFFFFF` | `white` | Cards, paneles, sidebar |
| `bg-elevated` | `#F0EBE4` | — | Inputs, chips desactivados, fondos de sección |
| `border` | `#E2D9D0` | — | Bordes sutiles |
| `text-primary` | `#1A1208` | — | Texto principal (marrón casi negro, más cálido que #000) |
| `text-secondary` | `#7A6A58` | — | Labels, placeholders, timestamps |
| `text-muted` | `#B5A898` | — | Metadatos, texto deshabilitado |

> **Por qué warm off-white**: El blanco puro `#FFFFFF` como fondo hace que la UI se vea clínica y genérica. El tono cálido `#F5F0EB` da personalidad, reduce la fatiga visual y contrasta mejor con las sombras suaves de las cards.

### Acento principal — Naranja

| Token | Hex | Uso |
|---|---|---|
| `brand-400` | `#FB923C` | Estados hover, iconos secundarios |
| `brand-500` | `#F97316` | Botón primario, FAB, tab activo, CTA |
| `brand-600` | `#EA6C0A` | Pressed/active state |
| `brand-50` | `#FFF7ED` | Fondo de badge de marca, chips activos |
| `brand-100` | `#FFEDD5` | Fondo de secciones con énfasis suave |

> **Por qué naranja**: Energía, movimiento, calor — lee perfectamente para un lavadero. Es el acento que usa la referencia visual del usuario. Sobre `#F5F0EB` el naranja pop sin ser agresivo. No se confunde con ningún color de estado.

### Estados de slot / orden

Los estados usan colores saturados sobre fondo blanco de card, con un chip de color + texto para no depender solo del color.

| Estado | Color | Hex fondo chip | Hex texto | Uso |
|---|---|---|---|---|
| Libre | Verde | `#DCFCE7` | `#15803D` | Slot disponible |
| Ocupado (parqueo) | Ámbar | `#FEF9C3` | `#A16207` | Vehículo parqueado sin lavado activo |
| En proceso | Azul | `#DBEAFE` | `#1D4ED8` | Lavado/servicio en curso |
| Listo | Teal | `#CCFBF1` | `#0F766E` | Orden completada, esperando retiro |
| Entregado | Gris | `#F3F4F6` | `#6B7280` | Cerrado/archivado |

### Semántica de acciones

| Token | Hex | Uso |
|---|---|---|
| `success` | `#16A34A` | Confirmaciones, completado |
| `warning` | `#D97706` | Alertas de vencimiento |
| `danger` | `#DC2626` | Eliminar, cancelar, error |
| `info` | `#2563EB` | Información contextual |

---

## Tipografía

**Fuente principal**: `Inter` (Google Fonts)
**Fuente monoespaciada** (placas): `JetBrains Mono`

| Escala | Size | Weight | Color | Uso |
|---|---|---|---|---|
| `xs` | 12px | 400 | muted | Timestamps, metadatos |
| `sm` | 14px | 400/500 | secondary | Labels, texto de soporte |
| `base` | 16px | 400 | primary | Párrafos, valores |
| `lg` | 18px | 600 | primary | Subtítulos, items de lista |
| `xl` | 20px | 700 | primary | Títulos de sección |
| `2xl` | 24px | 700 | primary | Títulos de página |
| `3xl` | 30px | 800 | primary | KPIs, números grandes del dashboard |
| `4xl` | 36px | 800 | primary | Número de slot (visible de lejos) |

**Placa del vehículo**: `font-mono font-bold tracking-widest text-xl text-primary`.
**Precios**: `font-bold text-brand-500` — el naranja en precios hace que el total sea lo primero que lee el ojo.

---

## Elevación y sombras

Sin fondos oscuros, la jerarquía se construye con sombras suaves, no con colores de fondo.

```
shadow-none   → elementos planos (chips, badges)
shadow-xs     → inputs, selects  (0 1px 2px rgba(0,0,0,0.06))
shadow-sm     → cards normales   (0 1px 3px rgba(0,0,0,0.1))
shadow-md     → cards activas, modales, bottom sheet (0 4px 12px rgba(0,0,0,0.12))
```

Nunca `shadow-lg` o `shadow-xl` — se ven pesadas en light mode.

---

## Iconografía

**Librería**: Lucide Icons (integrada en shadcn/ui)

| Concepto | Icono Lucide |
|---|---|
| Carro | `Car` |
| Moto | `Bike` |
| Slot libre | `ParkingCircle` |
| Slot ocupado | `ParkingCircleOff` |
| Lavado | `Droplets` |
| Motor | `Wrench` |
| Cojinería | `Sofa` |
| Empleado | `UserCheck` |
| Turno abierto | `Clock` |
| Abrir turno | `PlayCircle` |
| Cerrar turno | `StopCircle` |
| Reporte | `BarChart3` |
| Mensualidad | `CalendarRange` |
| Entrega | `CheckCircle2` |
| Alerta | `AlertTriangle` |
| Configuración | `Settings2` |

Tamaño mínimo: **24px** standalone, **20px** dentro de botones con texto.
Color de ícono por defecto: `text-secondary`. Activo/accionable: `text-brand-500`.

---

## Espaciado y grid

**Sistema base**: 4px (múltiplos: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

**Breakpoints**:
- `sm`: 640px — teléfono landscape
- `md`: 768px — tablet
- `lg`: 1024px — tablet grande / desktop

**Layout mobile** (< 768px):
- Bottom navigation bar de 5 items (tabs principales)
- Tab activo: ícono sobre pill redondeada en `brand-500`, texto `brand-500 font-semibold`
- Contenido en scroll vertical, sin sidebar
- FAB naranja (56px) para acción principal: **"+ Ingreso"**
- Padding horizontal: 16px en móvil, 24px en tablet

**Layout tablet/desktop** (≥ 768px):
- Sidebar izquierdo (240px expandido / 72px colapsado con solo iconos)
- Bottom nav reemplazada por sidebar
- Grid de slots: 2 col tablet, 3–4 col desktop

---

## Componentes clave

### SlotCard (el más importante del sistema)

Card blanca con `shadow-sm`, borde izquierdo de 4px en color de estado, `rounded-2xl`.

```
┌─────────────────────────┐
│ P-01    ● EN PROCESO    │  ← label mono bold + badge de estado
│                         │
│ 🚗  ABC-123             │  ← ícono tipo + placa mono
│ Lavado completo         │  ← servicio
│ Juan · 14 min  $25.000  │  ← empleado · tiempo · precio en naranja
└─────────────────────────┘
```

**Variante libre**:
```
┌─────────────────────────┐
│ P-02    ○ LIBRE         │
│                         │
│      + Asignar          │  ← botón centrado, texto brand-500
└─────────────────────────┘
```

- Alto mínimo mobile: **120px**
- Borde izquierdo: 4px sólido en color del estado (verde/ámbar/azul/teal)
- Toque en cualquier parte → abre detalle de la orden

### Bottom Navigation (mobile)

5 tabs: `Dashboard | Ingreso | Órdenes | Turno | Más`

Estilo inspirado en la referencia: el tab activo tiene un **pill redondeado** detrás del ícono (fondo `brand-500`, ícono y texto blancos). Los inactivos son ícono `text-muted` + label `text-muted`.

```
bg blanco, shadow-md arriba, border-t border/30
[  🏠  ] [  ➕  ] [  📋  ] [  ⏱  ] [  ···  ]
[  Inicio ] [Ingreso] [Órdenes] [Turno] [ Más ]
     ↑
  pill naranja detrás del ícono activo
```

### KPI Cards

3 cards blancas `shadow-sm rounded-2xl` en fila:

```
┌──────────┐ ┌──────────┐ ┌──────────┐
│   12     │ │    3     │ │ $285k    │
│ Autos    │ │ Listos   │ │ Ingresos │
│ hoy      │ │          │ │ hoy      │
└──────────┘ └──────────┘ └──────────┘
```

Número en `font-bold text-3xl text-primary`, label en `text-sm text-secondary`.
La card de "Listos" tiene el número en `text-teal-600` si hay órdenes esperando.
La card de "Ingresos" tiene el número en `text-brand-500`.

### Botón primario

- Mobile: ancho completo `w-full`, alto `56px`, `rounded-2xl`
- Color: `bg-brand-500 text-white font-semibold text-lg`
- Hover/pressed: `bg-brand-600`
- Sin outline, sin sombra — el color solo es suficiente

### Input de placa

```
┌─────────────────────────────┐
│  ABC  123              🚗   │
└─────────────────────────────┘
```

- `bg-bg-elevated border border-border rounded-xl h-14`
- `font-mono font-bold text-xl tracking-widest text-primary`
- Auto-uppercase al escribir
- Ícono del tipo de vehículo aparece a la derecha cuando se selecciona

### Badge de estado

Pills con fondo de color suave y texto oscuro del mismo tono:

```
● Recibido   → bg-gray-100   text-gray-600
● En lavado  → bg-blue-100   text-blue-700   (con dot animated pulse)
● Listo      → bg-teal-100   text-teal-700
● Entregado  → bg-gray-100   text-gray-400
```

---

## Flujos de pantalla (mobile-first, light mode)

### 1. Dashboard

```
[bg #F5F0EB — fondo cálido]
─────────────────────────────
[Header blanco, shadow-sm]
  LavoPanel logo    Juan P. ● Turno
─────────────────────────────
[KPI row: 3 cards blancas, shadow-sm]
  Autos hoy /  Listos / Ingresos
─────────────────────────────
[Filtro pills: Todos | Parqueo | Lavado]
  Activo: pill bg-brand-50 text-brand-500 border-brand-500
─────────────────────────────
[Grid de SlotCards, 1 col mobile, gap-3]
  SlotCard (verde — libre)
  SlotCard (azul — en proceso) ← borde izq azul
  SlotCard (teal — listo) ← borde izq teal + sutil shadow-md
  SlotCard (ámbar — ocupado)
─────────────────────────────
[FAB naranja, ícono +, esquina inferior derecha, shadow-md]
[Bottom Nav blanca, shadow-md top]
```

### 2. Nuevo ingreso

```
[bg #F5F0EB]
[Header blanco: ← Nuevo Ingreso]
─────────────────────────────
[Card blanca, shadow-sm, rounded-2xl, padding 20px]
  Label: PLACA
  Input mono bold grande: [ ABC-123 ]

  Label: TIPO DE VEHÍCULO
  [  🚗 CARRO  ] [  🛵 MOTO  ]
  Seleccionado: bg-brand-50 border-2 border-brand-500

  Label: MODALIDAD
  [ ○ Diario ] [ ○ Mensual ]

[Card blanca — Servicios]
  Lavado sencillo ——————— $15.000  □
  Lavado completo ——————— $25.000  ☑ ← bg-brand-50
  Lavado de motor ——————— $35.000  □
  Cojinería ———————————— $40.000  □

[Card blanca — Asignación]
  Slot disponible  [ L-01 ▾ ]
  Empleado         [ Juan P. ▾ ]

[Card blanca — Cliente (opcional)]
  [ Nombre del cliente... ]
─────────────────────────────
[Sticky bottom, bg blanco, border-t]
  Total: $25.000 (brand-500 bold)
  [    REGISTRAR INGRESO    ] ← btn naranja full-width 56px
```

### 3. Turno — apertura

```
[bg #F5F0EB]
[Header: Gestión de Turno]
─────────────────────────────
[Card blanca centrada, shadow-sm]
  Ícono PlayCircle naranja (48px)
  "Aún no has abierto tu turno"
  "Ingresá la caja inicial para empezar"

  Label: CAJA INICIAL
  [ $  0  ] ← input grande, mono

  [   ABRIR TURNO   ] ← btn naranja

─── cuando hay turno abierto ───
[Banner naranja suave: bg-brand-50]
  ● Turno activo  08:23am  →  4h 12m

[3 KPI cards blancas]
  Órdenes: 8 / Ingresos: $285k / Diferencia: +$235k

[Lista compacta: últimas órdenes del turno]

[Label: CAJA FINAL]
[ $  335.000 ] ← input mono

[  CERRAR TURNO  ] ← btn rojo outline (danger)
```

---

## Animaciones

- Cambio de estado de slot: `transition-all duration-300 ease-out`
- FAB: `scale-in` 150ms al aparecer
- Pill del bottom nav: `transition-all duration-200` al cambiar de tab
- Badge "En lavado": `animate-pulse` en el dot de estado
- Bottom sheet: `slide-up` 250ms ease-out (para selects largos)
- Sin animaciones decorativas — solo las que comunican estado

---

## Consideraciones de accesibilidad

- Contraste mínimo 4.5:1 en toda combinación texto/fondo (WCAG AA)
- Focus visible: `outline-2 outline-brand-500 outline-offset-2`
- Targets de toque mínimos 48×48px
- No depender solo del color para el estado (usar badge con texto + color)
- `aria-label` en iconos sin texto visible

---

## Lo que NO hacer

- No dark mode como primario (se ve genérico y es menos legible en exteriores)
- No fondo blanco puro `#FFFFFF` como bg global — solo para cards
- No gradientes complejos ni glassmorphism
- No más de 2 colores de acento por pantalla (el naranja es el único acento)
- No borders pesados — preferir shadow-sm en cards
- No fuentes menores a 12px
- No más de 2 niveles de jerarquía visual por pantalla
- No texto placeholder como único label

---

---

# Prompts para Stitch (Google AI Design)

> Usar uno por pantalla. Pegar siempre el prompt global primero.

---

## Prompt global de contexto

```
App name: LavoPanel — Internal management system for a car wash and parking lot in Colombia.
Target users: Employees, owner, admin. Internal staff only (not customer-facing).
Primary device: Mobile phones (375px). Outdoor use, bright sunlight.

Design style: Clean, warm light mode. NOT generic dashboard style. Inspired by modern consumer apps
(warm backgrounds, generous whitespace, one bold accent color, heavy typography on important data).
DO NOT use dark backgrounds. DO NOT use blue as the primary brand color.

Color palette:
- Background: warm off-white #F5F0EB (NOT pure white)
- Cards/surfaces: #FFFFFF with soft shadow (shadow-sm)
- Primary accent: Orange #F97316 — buttons, active tabs, prices, FAB
- Text primary: #1A1208 (warm near-black)
- Text secondary: #7A6A58
- Borders: #E2D9D0

Status colors (chip style — light bg + dark text same hue):
- Available: green chip bg #DCFCE7 text #15803D
- Parked: amber chip bg #FEF9C3 text #A16207
- In progress: blue chip bg #DBEAFE text #1D4ED8 (with animated pulse dot)
- Ready: teal chip bg #CCFBF1 text #0F766E

Typography: Inter (UI), JetBrains Mono (license plates and codes only).
Important numbers (KPIs, prices, slot labels) must be bold and large.
License plates: monospace, bold, tracking-widest.

Border radius: 16px cards, 12px buttons, 10px inputs.
Touch targets: 48px minimum height.
Language: Spanish (Colombia). Currency: Colombian pesos (e.g. $25.000).

Bottom navigation: white bar with soft top shadow. Active tab has a rounded orange pill behind icon.
FAB: 56px circle, orange #F97316, white + icon, bottom-right corner.
```

---

## Prompt 1 — Dashboard principal

```
Screen: Main dashboard for LavoPanel car wash management app. Mobile (375px wide).

Background: warm off-white #F5F0EB throughout.

Top header (white card, shadow-sm):
Left: "LavoPanel" in bold. Right: employee name + green dot + "Turno activo" badge (orange pill bg-orange-50 text-orange-600).

KPI row below header (3 white cards, rounded-2xl, shadow-sm, equal width, 8px gap):
- Card 1: large bold "12" (text-primary), small label "Autos hoy"
- Card 2: large bold "3" in teal-600, label "Listos"
- Card 3: large bold "$285k" in orange-500, label "Ingresos"

Filter chips row (horizontal scroll, pill-shaped):
"Todos" active (bg-orange-50 border border-orange-400 text-orange-600), "Parqueo", "Lavado" (bg-white border-border text-secondary).

Slot grid (2 columns, gap-3):
Each slot card: white, rounded-2xl, shadow-sm, LEFT border 4px in status color, padding 12px.
Inside each card: top-left label "P-01" in JetBrains Mono bold text-lg, top-right status chip (colored).
Below: vehicle type icon + plate in mono bold "ABC-123".
Below: service name "Lavado completo".
Bottom row: employee name left, elapsed "14 min" + price "$25.000" in orange right.

Show 4 slots: P-01 blue border (in progress), P-02 green border (libre — shows "+ Asignar" centered), L-01 teal border (listo), L-02 amber border (parqueado).

FAB: orange circle 56px, white + icon, bottom-right, shadow-md.
Bottom nav: white, top shadow. 5 tabs. Active "Dashboard" tab has orange rounded pill behind icon.
```

---

## Prompt 2 — Nuevo ingreso de vehículo

```
Screen: New vehicle entry form for LavoPanel. Mobile (375px). Background: warm off-white #F5F0EB.

Header: white bar with back arrow left, "Nuevo Ingreso" bold center.

Content: scrollable, all sections are white rounded-2xl cards shadow-sm with 16px internal padding, 12px gap between cards.

Card 1 — Vehículo:
  Label "PLACA" in xs caps text-secondary.
  Large input (h-14, rounded-xl, border-border bg-elevated): monospace bold text-xl tracking-widest placeholder "ABC 123".
  Below: "TIPO DE VEHÍCULO" label.
  Two large toggle buttons side by side (h-14, rounded-xl): "🚗 Carro" selected (bg-orange-50 border-2 border-orange-400 text-orange-600 font-semibold), "🛵 Moto" (bg-white border-border text-secondary).
  Below: "MODALIDAD" label.
  Two radio buttons: "Diario" selected (orange radio), "Mensual".

Card 2 — Servicios:
  Title "Servicios" font-semibold.
  4 rows (h-14 each, border-b border-border last:border-0):
    Checkbox left (orange when checked), service name + description text-secondary text-sm, price right in orange-500 font-semibold "$25.000".
    "Lavado completo" row is checked (bg-orange-50/30 highlight).

Card 3 — Asignación:
  Two dropdown rows (h-14): "Slot disponible" → "L-01 ▾" and "Empleado" → "Juan P. ▾". Chevron right, text-secondary for value.

Card 4 — Cliente (optional):
  Text input h-12 "Nombre del cliente (opcional)".

Sticky bottom bar (white, border-t, 16px padding):
  Left: "Total estimado" text-secondary text-sm, below "$25.000" text-primary font-bold text-2xl.
  Right: Full-width orange button "REGISTRAR INGRESO" h-14 rounded-2xl white text font-semibold.
```

---

## Prompt 3 — Detalle de orden

```
Screen: Service order detail for LavoPanel. Mobile (375px). Background: #F5F0EB.

Header: white bar, back arrow, "Orden #42" bold, status chip right "● En lavado" (blue chip, animated pulse dot).

Content cards (white, rounded-2xl, shadow-sm, 12px gap):

Card 1 — Vehículo:
  "ABC-123" in JetBrains Mono font-bold text-3xl.
  Below: 🚗 icon + "Carro · Juan Pérez" in text-secondary.

Card 2 — Estado (stepper):
  Horizontal 4-step stepper: "Recibido ✓" (green), "En lavado ●" (blue, active, bold), "Listo" (muted), "Entregado" (muted).
  Steps connected by line, active step has orange dot below label.

Card 3 — Servicios:
  Title "Servicios" + "$125.000 Total" right in orange.
  Rows: checkmark icon left, service name, price right.
  3 services listed.

Card 4 — Info:
  Two pills side by side: "📍 Slot: L-01" (bg-elevated rounded-lg) and "⏱ 14 min" (amber tint).

Sticky bottom:
  Full-width button "MARCAR COMO LISTO" h-14, teal-600 background, white text, rounded-2xl.
  Below: text link "Agregar servicio" text-brand-500 centered.
```

---

## Prompt 4 — Gestión de turno

```
Screen: Shift management for LavoPanel. Mobile (375px). Background: #F5F0EB.

Header: white bar, "Mi Turno" bold.

Show STATE B (shift open) — the active/data-rich state:

Orange banner at top (bg-orange-50, border-b border-orange-100, padding 16px):
  Left: green dot + "Turno activo" font-semibold. Right: "08:23am · 4h 12m" text-secondary.

3 KPI cards (white, shadow-sm, rounded-2xl, row of 3):
  "8 Órdenes", "$285k Ingresos" (orange text), "+$235k Diferencia" (green text).

Section "Últimas órdenes" (list of 3 compact rows, white card):
  Each row: plate mono left, service name, price right orange, time muted.

Section "Cerrar turno" (white card, shadow-sm):
  Label "CAJA FINAL" caps text-secondary.
  Large input h-14 monospace "$335.000".
  Below: red-tinted button (bg-red-50 text-red-600 border border-red-200) "CERRAR TURNO" h-14 rounded-2xl full-width with warning icon left.
  Small muted note below: "Verificá el efectivo antes de cerrar".
```

---

## Prompt 5 — Lista de órdenes

```
Screen: Orders list for LavoPanel. Mobile (375px). Background: #F5F0EB.

Header: white bar, "Órdenes" bold, filter icon right (text-secondary).

Filter chips (horizontal scroll, pill-shaped, 8px gap):
"Todas" active (orange), "Recibidas", "En lavado", "Listas", "Entregadas" (all white with border-border).

Orders list (gap-3):
Each order card: white, rounded-2xl, shadow-sm, LEFT border 4px in status color, padding 16px.
  Top row: plate "ABC-123" mono font-bold left, status chip right.
  Mid row: service name text-primary, price "$25.000" text-orange-500 font-semibold right.
  Bottom row: employee name text-secondary, elapsed time right text-muted.

Show 5 cards:
1. Blue left-border (En lavado) — animated pulse on chip dot
2. Teal left-border (Listo) — slightly elevated shadow-md
3. Gray left-border (Recibido)
4. Gray left-border (Recibido)
5. Light gray left-border, opacity-60 (Entregado)

Bottom: "12 órdenes hoy" centered text-muted text-sm.
```

---

## Prompt 6 — Panel de configuración

```
Screen: Settings panel for LavoPanel. Mobile (375px). Background: #F5F0EB. Admin/owner only.

Header: white bar, back arrow, "Configuración" bold center.

Tab bar (horizontal scroll, below header, white bg, border-b):
6 tabs with icon + label: "Plazas 🅿️" active (border-b-2 border-orange-500 text-orange-500 font-semibold), "Tarifas", "Servicios", "Vehículos", "Empleados", "Negocio" (text-secondary).

Active tab content — Plazas:

Summary chips row (gap-2): "8 activas" (bg-green-50 text-green-700 rounded-full px-3 py-1), "2 inactivas" (bg-gray-100 text-gray-500).

Slot list (white card, rounded-2xl, shadow-sm, divide-y divide-border):
Each row (h-16, flex, items-center, px-16):
  Left: kind badge pill "Parqueo" (blue chip) or "Lavado" (teal chip).
  Center: slot label "P-01" mono font-bold.
  Right: toggle switch (orange when active, gray when inactive).
Show 4 rows: P-01 Parqueo active, P-02 Parqueo active, L-01 Lavado active, L-02 Lavado inactive.

Below list: "Tarifas (vista rápida)" section title text-secondary text-sm caps.
Two cards side by side (white, shadow-sm, rounded-xl):
  Card "🚗 Carro": "Hora: $3.000" and "Día: $15.000" with pencil edit icon top-right.
  Card "🛵 Moto": "Hora: $2.000" and "Día: $10.000" with pencil edit icon.

FAB: orange 56px, white + icon, bottom-right (to add new slot).
```

---

## Tips para trabajar con Stitch

1. **Copiá el prompt global primero** antes de cualquier pantalla — establece el estilo base.
2. **Un prompt = una pantalla**. No mezcles vistas en un solo prompt.
3. Si el resultado se ve genérico, agregá: *"make it distinctive and warm, not a standard dashboard"*.
4. Si los colores no son exactos, describí el contraste: *"warm orange on off-white, not blue"*.
5. Generá siempre **mobile 375px** primero; tablet/desktop son adaptaciones.
6. Si querés más "personalidad": pedile *"bold typography for the most important numbers, generous whitespace"*.
