# Plan: Módulo de Mapas para Grimorio

## Decisiones validadas

| Aspecto | Decisión |
|---------|----------|
| **Apertura** | Pantalla completa separada (nuevo state view `maps` en `app.tsx`) |
| **Visibilidad** | Solo el máster crea/edita mapas (fase 1) |
| **Librería canvas** | React Konva (`react-konva`, `konva`, `use-image`) |
| **Tiles gráficos** | Kenney CC0 (dominio público) — Roguelike/RPG Pack (1700 tiles), Tiny Dungeon, Tiny Town, Tiny Farm |
| **Estilo visual** | Pixel art top-down 16×16, estilo D&D roguelike clásico |
| **Licencia assets** | CC0 — sin atribución, sin restricciones, uso comercial permitido |
| **Persistencia** | JSON serializado en Postgres (`data jsonb`) |
| **Funcionalidades extra** | Grid/Snap, Capas (suelo/objetos/techo), Exportar PNG |

---

## Modelo de datos

```typescript
interface MapData {
  id: string;
  campaignId: string;
  name: string;
  type: 'exterior' | 'interior';
  environment: 'bosque' | 'mina' | 'dungeon' | 'pantano' | 'montaña'
             | 'desierto' | 'pueblo' | 'castillo' | 'casa';
  width: number;        // en celdas
  height: number;       // en celdas
  gridSize: number;     // px por celda (default 32)
  layers: MapLayer[];
  createdAt: string;
  updatedAt: string;
}

interface MapLayer {
  id: string;
  name: string;         // "Suelo", "Objetos", "Techo"
  visible: boolean;
  elements: MapElement[];
}

interface MapElement {
  id: string;
  tileId: string;       // referencia al catálogo de tiles
  x: number;            // posición en px
  y: number;
  width: number;
  height: number;
  rotation: number;     // grados
  layerId: string;
}
```

---

## Catálogo de tiles (~80 seleccionados de Kenney CC0)

| Categoría | Tiles |
|-----------|-------|
| **Bosque** | Árbol, arbusto, tocón, roca, río, hierba alta, flores, claro |
| **Mina** | Raíl, vagoneta, pico, pilar, cristal |
| **Dungeon** | Muro H/V/esquina, puerta, trampilla, columna, antorcha, trampa, escalera, sarcófago, tumba |
| **Pantano** | Charco, loto, raíz, niebla |
| **Montaña** | Roca grande, barranco, cueva, nieve, sendero |
| **Desierto** | Cactus, dunas, oasis, esqueleto, arena |
| **Pueblo** | Casa (varias), pozo, mercado, camino, puente, vallas |
| **Castillo** | Muro fortificado, torre, muralla, almena, foso |
| **Casa (interior)** | Suelo madera, alfombra, cama, mesa, silla, chimenea, estantería, baúl |
| **Decoración** | Antorcha, estatua, barril, caja, cofre, cristal, lápida |

### Licencia

Todos los tiles provienen de [Kenney.nl](https://kenney.nl) bajo licencia **CC0 1.0 Universal**
(dominio público). Sin obligación de atribución, sin restricciones comerciales.

Attribución opcional recomendada: *"Tile assets by Kenney (kenney.nl), CC0"*.

---

## Arquitectura técnica

### Backend (hexagonal)

```
backend/src/
├── domain/
│   ├── maps/
│   │   ├── mapData.ts          # tipos: MapData, MapLayer, MapElement
│   │   └── index.ts
│   └── ids.ts                  # newMapId() branded type
├── application/
│   ├── maps/
│   │   ├── create.ts           # createMap(input) → MapData
│   │   ├── get.ts              # getMap(id) → MapData
│   │   ├── list.ts             # listMaps(campaignId) → MapData[]
│   │   ├── update.ts           # updateMap(id, patch) → MapData
│   │   ├── delete.ts           # deleteMap(id)
│   │   ├── errors.ts          # MapError codes
│   │   └── index.ts
│   └── ports.ts                # MapRepository port
├── infra/
│   ├── memory/
│   │   └── mapRepository.ts    # adaptador en memoria
│   └── postgres/
│       ├── mapRepository.ts    # adaptador Postgres (data jsonb)
│       └── migrations/
│           └── 004_maps.sql    # CREATE TABLE maps
└── transport/
    └── http/
        └── routes.ts           # rutas REST /campaigns/:id/maps
```

### Frontend

```
frontend/src/
├── screens/
│   └── Mapas/
│       ├── MapasScreen.tsx       # pantalla completa (biblioteca + editor)
│       ├── MapLibrary.tsx        # lista de mapas de la campaña
│       ├── MapEditor.tsx         # editor drag & drop
│       ├── MapCanvas.tsx         # <Stage> Konva con <Layer>[] y <DraggableTile>[]
│       ├── DraggableTile.tsx     # wrapper: <Group draggable rotation onDragEnd>
│       ├── MapToolbar.tsx        # sidebar: categorías colapsables + buscador
│       ├── MapLayersPanel.tsx    # panel de capas: toggle visible, seleccionar
│       ├── MapTopBar.tsx         # nombre, tipo, guardar, exportar, volver
│       ├── tiles.ts             # catálogo de tiles (imports de PNG)
│       ├── assets/
│       │   └── tiles/            # PNGs de Kenney CC0
│       └── mapa-editor.css       # estilos responsive
├── net/
│   └── http.ts                  # MapDTO + API client methods
└── app.tsx                      # nuevo state view { name: 'maps'; campaignId }
```

### Rutas HTTP REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/campaigns/:id/maps` | Lista de mapas de la campaña |
| `POST` | `/campaigns/:id/maps` | Crear mapa |
| `GET` | `/campaigns/:id/maps/:mapId` | Obtener un mapa |
| `PATCH` | `/campaigns/:id/maps/:mapId` | Actualizar mapa |
| `DELETE` | `/campaigns/:id/maps/:mapId` | Borrar mapa |

Todas requieren `preHandler: auth` + verificación de rol DM.

### Migración Postgres

```sql
CREATE TABLE IF NOT EXISTS maps (
  id          TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  data        JSONB NOT NULL,          -- MapData serializado
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maps_campaign ON maps(campaign_id);
```

---

## UX del editor

### Flujo de uso

1. El DM está en la vista del máster de una campaña
2. Click en botón "🗺️ Mapas" en la barra de sesión (SessionBar)
3. Se abre la pantalla de Biblioteca de Mapas
4. Click en "Crear nuevo mapa" → elige tipo (exterior/interior) y entorno
5. Se abre el editor a pantalla completa

### Editor

```
┌─────────────────────────────────────────────────────────┐
│  MapTopBar: nombre | tipo | entorno | Guardar | PNG | ← │
├──────────┬────────────────────────────────┬────────────┤
│ Toolbar  │                                │  Capas    │
│          │                                │           │
│ Buscador │         Canvas (Konva)         │  ☑ Suelo  │
│          │         con grid opcional       │  ☑ Objetos│
│ ▸ Bosque │         drag & drop             │  ☐ Techo  │
│  🌲 Árbol│         snap a grid             │           │
│  🌲 Arb. │         rotar (doble click)     │  Elemento │
│ ▸ Dungeon│         eliminar (Supr)         │  selec.:  │
│  🧱 Muro │         zoom (rueda)            │  x, y,    │
│  🚪 Puert│         pan (espacio+drag)     │  rotación │
│ ▸ Casa   │                                │           │
│  🛏 Cama │                                │           │
│ ...      │                                │           │
└──────────┴────────────────────────────────┴────────────┘
```

### Interacciones

| Acción | Cómo |
|--------|------|
| **Colocar tile** | Arrastrar del toolbar al canvas (HTML5 drag) |
| **Mover elemento** | Click + arrastrar dentro del canvas (Konva draggable) |
| **Rotar** | Doble click → rota 90°, o Transformer handles |
| **Eliminar** | Seleccionar + tecla Supr/Delete |
| **Snap a grid** | Automático al soltar (redondear a `gridSize`) |
| **Zoom** | Rueda del ratón (scale del Stage) |
| **Pan** | Espacio + arrastrar, o arrastrar fondo |
| **Capa activa** | Click en capa del panel derecho → nuevos elementos van ahí |
| **Toggle capa** | Checkbox en panel de capas |
| **Exportar PNG** | Botón → `stage.toDataURL({ pixelRatio: 2 })` → download |

### Móvil

- Toolbar colapsable (botón hamburguesa)
- Panel de capas colapsable
- Canvas scrollable con pellizco para zoom
- Tiles más grandes en el toolbar para tocar fácil

---

## Dependencias

```bash
pnpm --filter frontend add react-konva konva use-image
```

| Paquete | Rol |
|---------|-----|
| `konva` | Motor de canvas 2D con objetos, capas, drag, transform |
| `react-konva` | Bindings React para Konva (JSX idiomático) |
| `use-image` | Hook para cargar imágenes asíncronas en Konva.Image |

---

## Listado de tareas (17)

### Backend (4 tareas)

| # | Tarea | Prioridad |
|---|-------|-----------|
| F1T1 | Dominio de mapas (MapData, MapLayer, MapElement) + MapRepository port en application/ports.ts | Alta |
| F1T2 | Casos de uso (createMap, getMap, listMaps, updateMap, deleteMap) con autorización DM + MapError | Alta |
| F1T3 | Rutas HTTP REST + schema zod en shared/commands.ts + wiring (HttpDeps, buildServer, testing repos) | Alta |
| F1T4 | Repositorio Postgres (mapRepository.ts) + migración 004_maps.sql (tabla maps con data jsonb) | Media |

### Frontend (11 tareas)

| # | Tarea | Prioridad |
|---|-------|-----------|
| F1T5 | Instalar dependencias (react-konva, konva, use-image) | Alta |
| F1T6 | Descargar y curar tiles Kenney CC0 en `frontend/src/screens/Mapas/assets/tiles/` | Alta |
| F1T7 | Catálogo de tiles (tiles.ts) con categorías + buscador | Alta |
| F1T8 | DTOs + API client (MapDTO, listMaps, getMap, createMap, updateMap, deleteMap) en net/http.ts | Alta |
| F1T9 | Pantalla Biblioteca de Mapas (lista de mapas, crear nuevo, abrir, borrar) | Alta |
| F1T10 | Editor con react-konva (Stage, Layer, drag & drop, snap a grid, rotar, eliminar, zoom) | Alta |
| F1T11 | Toolbar con categorías colapsables + buscador de tiles + panel de capas | Alta |
| F1T12 | Barra superior (nombre, tipo, entorno, guardar, exportar PNG, volver) | Alta |
| F1T13 | Integración en app.tsx (nuevo state view `maps`) + botón en SessionBar | Alta |
| F1T14 | Exportar como PNG (stage.toDataURL) + grid/snap opcional toggle | Media |
| F1T15 | CSS responsive del editor (desktop con 3 paneles + móvil con paneles colapsables) | Media |

### Verificación (2 tareas)

| # | Tarea | Prioridad |
|---|-------|-----------|
| F1T16 | Tests: backend (dominio, repos memoria, casos de uso, rutas) + frontend (editor básico, biblioteca) | Media |
| F1T17 | `make check` + push final | Alta |

---

## Fases futuras (fuera de alcance F1)

| Fase | Descripción |
|------|-------------|
| **F2** | Visibilidad para jugadores: el DM asigna un mapa a la sesión, los jugadores lo ven en su vista |
| **F3** | VTT: tokens de combate sobre el mapa, sincronizado con el combate por WS, fog of war, iluminación |
| **F4** | Mapas colaborativos: múltiples DMs editando, historial de versiones |
| **F5** | Importar mapas externos (imagen/third-party VTT), capas de pintura libre |

---

## Atribución

Tile assets by [Kenney](https://kenney.nl) — licencia CC0 1.0 Universal (dominio público).