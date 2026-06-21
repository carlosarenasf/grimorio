# SPEC — Grimorio · Mesa Virtual de Rol (D&D 5e 2024 / "5.5e")

> Documento de especificación para arrancar el proyecto con Claude Code.
> Define el alcance de la v1, la arquitectura y las decisiones ya tomadas.
> Léelo como contexto antes de escribir código.
>
> **Compañero visual:** `DESIGN_SPEC.md` define la dirección de UX, los tokens y
> las pantallas. Este documento es el lado de producto/backend. Las 5 pantallas
> diseñadas (Registro, Campañas, Crear Personaje, Vista Máster, Vista Jugador)
> son el alcance de la v1.

---

## 1. Qué es

Una mesa virtual para partidas de D&D 5e (reglas **2024**, base **SRD 5.2**),
centrada en dar herramientas al máster pero compartiendo estado en tiempo real
con los jugadores. No es un creador de mapas ni un editor de avatares: el núcleo
es **estado compartido en tiempo real con visibilidad por rol**, sobre cuentas
persistentes y campañas que viven entre sesiones.

Casos de uso de la v1:

- Una persona **crea una cuenta** (email + contraseña) e inicia sesión.
- Crea una **campaña** y obtiene un código + enlace de invitación.
- Los jugadores se unen a la campaña con el enlace/código.
- Cada jugador crea una **ficha de personaje 5e completa** (características,
  competencias, ataques, inventario…).
- El máster dirige una **sesión en vivo**: tracker de iniciativa/combate,
  bestiario SRD, referencia de reglas, notas privadas.
- Cualquiera **tira dados** con notación estándar; el servidor resuelve la tirada.
- Hay información **pública** (vista por todos), **privada del máster**
  (`dm_only`) y **privada del dueño** (`owner`).

## 2. Principio rector: visibilidad por rol

Es la decisión de diseño que define el producto. Toda entidad del estado lleva
una propiedad de visibilidad:

- **`public`** — visible para todos los miembros conectados (iniciativa, HP de
  los PJ, tiradas abiertas, orden de combate).
- **`dm_only`** — solo el máster (HP real de los monstruos, notas, tiradas
  ocultas, CA real de NPCs).
- **`owner`** — solo el jugador dueño + el máster (ficha completa, inventario,
  oro).

**Regla no negociable:** el filtrado de visibilidad ocurre en el SERVIDOR, antes
de proyectar el estado a cada cliente. El cliente nunca recibe datos que no debe
ver. Nada de ocultar en el frontend lo que el servidor ya mandó. Esto se
construye desde el día uno.

**Patrón "etiqueta de estado pública derivada":** cuando un dato es `dm_only`
pero debe tener una representación pública (p. ej. el HP real del dragón es
`dm_only`, pero los jugadores deben ver *algo*), el servidor deriva una etiqueta
pública (`«Intacto» / «Herido» / «Malherido» / «Caído»`) a partir del ratio de
HP y proyecta SOLO la etiqueta al jugador. El número real nunca sale del
servidor hacia el cliente del jugador.

## 3. Stack (ya decidido)

- **Frontend:** Vercel. (Framework a elegir por el implementador; React/Vite o
  Next en modo SPA son válidos.) Las pantallas diseñadas usan las fuentes
  Spectral / Source Sans 3 / JetBrains Mono y los tokens de `DESIGN_SPEC.md`.
- **Backend:** Fastify + `@fastify/websocket`, desplegado en Render (free web
  service).
- **Base de datos:** Postgres en Neon o Supabase (free tier sin expiración a 30
  días — NO usar la Postgres free de Render, que se borra a los 30 días).
- **Lenguaje:** TypeScript en todo el backend.
- **Auth:** sesiones propias con contraseña hasheada (argon2id o bcrypt) +
  cookie httpOnly o JWT. **Sin email transaccional en v1** (no hay verificación
  de email ni recuperación de contraseña; se añaden en fase 2).

### Restricciones de la plataforma que condicionan el diseño

- Render free duerme el servicio tras 15 min sin tráfico (HTTP o mensaje WS).
  Cold start ~1 min.
- Filesystem efímero: se pierde en cada reinicio/redeploy/spin-down. Prohibido
  depender de disco local o SQLite en disco.
- **Consecuencia de diseño:** el estado de cada sesión en vivo DEBE poder
  rehidratarse desde Postgres. La memoria es solo una caché de trabajo, nunca la
  fuente de verdad persistente.

## 4. Arquitectura

Estilo: hexagonal + DDD ligero. El dominio no conoce ni Fastify ni Postgres ni
WebSockets.

```
┌─────────────────────────────────────────────────┐
│  Transport (Fastify + @fastify/websocket)        │
│  - HTTP: auth, campañas, fichas, snapshot inicial │
│  - WS: comandos entrantes / eventos salientes    │
├─────────────────────────────────────────────────┤
│  Application (casos de uso / command handlers)   │
│  - autentica y autoriza por rol y propiedad      │
│  - aplica comandos al agregado                   │
│  - persiste, proyecta por rol, difunde           │
├─────────────────────────────────────────────────┤
│  Domain                                          │
│  - User / Campaign / LiveTable (agregados)       │
│  - reglas 5e: derivados, competencia, CD conjuro │
│  - política de visibilidad                       │
│  - resolución de tiradas (server-authoritative)  │
│  - datos SRD 5.2 (condiciones, monstruos, reglas)│
├─────────────────────────────────────────────────┤
│  Infra (puertos → adaptadores)                   │
│  - UserRepository / CampaignRepository (Postgres)│
│  - LiveTableRepository (Postgres)                │
│  - Broadcaster (rooms WS)                         │
│  - SrdProvider (JSON semilla)                     │
└─────────────────────────────────────────────────┘
```

### Los tres niveles del dominio

El antiguo `GameSession` se descompone en tres entidades con ciclos de vida
distintos:

1. **`User`** — cuenta persistente. Es dueño de campañas y de personajes.
2. **`Campaign`** — contenedor persistente de una mesa. Vive entre sesiones.
   Agrupa miembros (1 DM + N jugadores), las fichas de personaje, código de
   invitación y metadatos (status, sinopsis, contadores).
3. **`LiveTable`** — el "room" de WebSocket: el estado en tiempo real de la
   sesión en curso (combate, iniciativa, rondas, logs). Es el agregado que se
   rehidrata desde Postgres al despertar/reconectar.

Cada acción del juego es un **comando** que muta un agregado y produce uno o más
**eventos**. El estado proyectado a cada cliente se deriva del agregado aplicando
el filtro de visibilidad para ese rol. Beneficio: el log de combate sale casi
gratis, y la rehidratación tras dormir/reconectar es leer el estado persistido y
reproyectar.

## 5. Modelo de dominio (punto de partida, a refinar)

```typescript
type Visibility = 'public' | 'dm_only' | 'owner';
type Role = 'dm' | 'player';
type CampaignStatus = 'planning' | 'active' | 'paused';

// ---------- Cuentas ----------
interface User {
  id: string;
  email: string;
  passwordHash: string;       // argon2id/bcrypt; nunca se proyecta
  displayName: string;        // "cómo te verán en la mesa"
  createdAt: string;
}

// ---------- Campaña (persistente) ----------
interface CampaignMember {
  userId: string;
  role: Role;                 // 1 'dm' + N 'player'
  joinedAt: string;
}

interface Campaign {
  id: string;
  ownerId: string;            // el DM creador
  name: string;
  tagline: string;            // sinopsis corta (opcional)
  status: CampaignStatus;
  joinCode: string;           // p. ej. "RAVEN-77"; base del enlace /unirse/CODE
  members: CampaignMember[];
  characterIds: string[];     // fichas vinculadas a esta campaña
  sessionCount: number;       // contador mostrado en la tarjeta
  createdAt: string;
}

// ---------- Ficha de personaje (5e 2024 / SRD 5.2) ----------
type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
type AttackKind = 'weapon' | 'spell' | 'save';

interface Attack {
  id: string;
  name: string;
  kind: AttackKind;
  bonus: number | null;       // bonus al ataque (null para conjuros de salvación)
  damage: string | null;      // notación: "1d8+4"
  damageType: string;         // "perforante", "fuego"…
}

interface InventoryItem {
  id: string;
  name: string;
  note: string;               // "2d4+2 PV", "15 m"…
  qty: number;
  equipped: boolean;          // etiqueta visual; NO afecta cálculos (seguimiento)
}

interface CharacterSheet {
  id: string;
  campaignId: string;
  ownerId: string;            // user id del jugador dueño
  name: string;
  species: string;            // "Elfo" (UI puede decir "Especie" o "Raza", ver DESIGN_SPEC)
  className: string;          // "Explorador"
  background: string;         // "Forastero"
  level: number;              // 1–20
  scores: Record<AbilityKey, number>;  // 3–20
  // Derivados los CALCULA el servidor (no se persisten como verdad):
  //   mod(score) = floor((score-10)/2); profBonus = ceil(level/4)+1; etc.
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;              // metros (10.5 ≈ 35 ft)
  proficientSkills: string[]; // keys de las 18 competencias
  attacks: Attack[];
  inventory: InventoryItem[];
  gold: number;
  notes: string;              // rasgos, personalidad, vínculos…
  visibility: Visibility;     // típicamente 'owner' (HP se proyecta público en combate)
}

// ---------- Combate / sesión en vivo ----------
type CombatantType = 'pc' | 'monster';

interface Condition {
  key: string;                // "poisoned", "marked", "blessed"…
  label: string;
  color: string;              // token de color (chip/punto)
}

interface Combatant {
  id: string;
  refId: string | null;       // ficha (pc) o entrada de bestiario (monster)
  type: CombatantType;
  name: string;
  initiative: number;
  maxHp: number;
  currentHp: number;
  conditions: Condition[];
  hpVisibility: Visibility;   // 'public' para PJ, 'dm_only' para monstruos ocultos
  // Si hpVisibility === 'dm_only', el servidor proyecta a los jugadores SOLO
  // una etiqueta derivada (statusLabel), no el HP real.
}

interface CombatState {
  active: boolean;
  round: number;              // contador de rondas mostrado en la barra
  order: string[];            // ids de Combatant, ordenados desc por initiative
  currentTurnIndex: number;
}

interface DiceRoll {
  id: string;
  byUserId: string;
  byLabel: string;            // "Lyra", "Máster"
  notation: string;          // "2d6+3", "1d20" o nombre de ataque
  results: number[];          // tiradas individuales
  breakdown: string;          // "20 + 8"
  total: number;
  tone: 'normal' | 'crit' | 'fumble';
  visibility: Visibility;     // 'public' abierta, 'dm_only' oculta
  at: string;                 // ISO timestamp
}

interface CombatEvent {       // log de eventos (separado del de tiradas)
  id: string;
  text: string;               // "Brom queda envenenado", "Empieza la ronda 3"
  color: string;
  visibility: Visibility;
  at: string;
}

interface LiveTable {
  id: string;
  campaignId: string;
  combatants: Combatant[];
  combat: CombatState;
  rollLog: DiceRoll[];
  eventLog: CombatEvent[];
  dmNotes: string;            // visibility implícita 'dm_only'
  version: number;            // optimistic concurrency / orden de eventos
}
```

## 6. Comandos y eventos (v1)

### Cuentas y campañas (HTTP)

| Comando | Quién | Efecto / Evento |
|---|---|---|
| `Register` | anónimo | crea `User` → `UserRegistered` |
| `Login` | anónimo | abre sesión → `SessionStarted` |
| `CreateCampaign` | usuario | crea campaña + joinCode → `CampaignCreated` |
| `UpdateCampaign` | DM dueño | edita nombre/sinopsis/status → `CampaignUpdated` |
| `InviteToCampaign` | DM dueño | (re)genera enlace/código → `InviteIssued` |
| `JoinCampaign` | usuario | se une por código → `MemberJoined` |
| `CreateCharacter` | jugador | crea ficha 5e → `CharacterCreated` |
| `UpdateCharacter` | dueño o DM | edita ficha → `CharacterUpdated` |

### Sesión en vivo (WS)

| Comando | Quién | Efecto / Evento |
|---|---|---|
| `StartCombat` | DM | inicia tracker (ronda 1) → `CombatStarted` |
| `AddCombatantFromBestiary` | DM | añade monstruo SRD al combate → `CombatantAdded` |
| `AddManualCombatant` | DM | añade combatiente a mano → `CombatantAdded` |
| `SetInitiative` | DM | fija/ordena iniciativa → `InitiativeSet` |
| `ReorderInitiative` | DM | reordena la rail → `InitiativeReordered` |
| `NextTurn` / `PrevTurn` | DM | avanza/retrocede turno → `TurnAdvanced` |
| `EndMyTurn` | jugador activo | termina su propio turno → `TurnAdvanced` |
| `SetCondition` / `ClearCondition` | DM | chips sobre tokens → `ConditionChanged` |
| `ApplyDamage` / `ApplyHealing` | DM | modifica HP → `HpChanged` (+ posible `CombatEvent`) |
| `RollDice` | cualquiera | servidor resuelve notación → `DiceRolled` |
| `RollAttack` | cualquiera | to-hit + daño, crítico/pifia → `DiceRolled` |
| `RollHidden` | DM | tirada oculta (`dm_only`) → `DiceRolled` (privado) |
| `AppendDmNote` | DM | edita notas privadas → `DmNotesUpdated` (privado) |
| `EndCombat` | DM | cierra tracker → `CombatEnded` |

**Autorización:** cada handler valida el rol y la propiedad antes de mutar. Un
jugador no puede editar la ficha de otro, avanzar el turno de otro, ni recibir
datos `dm_only`. `EndMyTurn` solo lo acepta el servidor si quien lo envía es el
dueño del combatiente cuyo turno está activo.

## 7. Reglas 5e y resolución de dados (server-authoritative)

- **Derivados de la ficha** los calcula el servidor, nunca el cliente:
  modificador de característica `floor((score-10)/2)`, bonificador de competencia
  `ceil(level/4)+1`, iniciativa, CD de conjuros `8 + comp + mod`, etc. El cliente
  solo muestra lo que el servidor proyecta.
- **Creación de características:** soportar **compra de puntos (presupuesto 27)** y
  **tirar 4d6 quita-el-menor**. El servidor valida el coste de compra.
- **Dados:** el cliente envía solo la notación (`"1d20+5"`) o un ataque y la
  visibilidad deseada. El servidor parsea, valida (límites sanos: nº de dados y
  caras), tira con un RNG del servidor, calcula total y emite el evento. El
  cliente NUNCA manda el resultado.
- Parser: `NdM(+/-K)?` para **d4, d6, d8, d10, d12, d20, d100**. Detectar
  **crítico** (20 natural) y **pifia** (1 natural) en `1d20`. Dejar extensible
  para **ventaja/desventaja** (tirar 2d20, quedarse con alto/bajo).
- **`RollAttack`:** resuelve tirada de ataque (d20 + bonus) y, si hay, tirada de
  daño, en un solo evento con su desglose.

## 8. Tiempo real y ciclo de vida

- Cada **sesión en vivo** (LiveTable) es un "room" de WebSocket, asociado a una
  campaña. Al conectarse, el cliente recibe un **snapshot inicial filtrado por su
  rol**, y a partir de ahí recibe eventos incrementales.
- **Reconexión:** cualquier cliente puede caerse y volver. Al reconectar pide el
  snapshot actual y rehidrata; no se asume que mantuvo estado.
- **Spin-down de Render:** mientras haya alguien conectado y activo, los mensajes
  WS mantienen vivo el servicio. Entre sesiones se duerme; al volver, cold start
  ~1 min y rehidratación desde Postgres. La UI debe tener una pantalla cuidada de
  "Entrando a la sala…" para ese cold start (ver `DESIGN_SPEC.md` §10).
- **Persistencia:** tras cada comando aplicado con éxito, persistir el nuevo
  estado (snapshot del agregado, o append de evento si se opta por event
  sourcing). La memoria es caché; Postgres es la verdad.

## 9. Datos SRD 5.2 (curado en v1)

Se empaqueta un **subconjunto curado** del SRD 5.2 (reglas 2024, licencia CC)
como JSON semilla, expuesto por un `SrdProvider`:

- **Condiciones:** set completo (son pocas y fijas) con su efecto, para la
  "Referencia rápida" y los chips de combate.
- **Referencia de reglas:** acciones (economía de turno), clases de dificultad,
  cobertura, salvaciones de muerte, descansos corto/largo.
- **Bestiario:** ~30–50 monstruos comunes (nombre, CR/meta, HP, CA, ataques)
  para la búsqueda y el "añadir al combate". Versionado y ampliable.

El dataset es **datos, no instrucciones**: se trata como contenido. Ampliar a
SRD 5.2 completo (todo el bestiario y conjuros) queda como fase 2.

## 10. Alcance de la v1 — y lo que queda FUERA

**Dentro (las 5 pantallas):**
1. **Registro / login** con cuentas reales (email + contraseña, sin email
   transaccional).
2. **Campañas:** crear, listar, estados, invitar por enlace/código, unirse.
3. **Crear Personaje:** ficha 5e completa (características con compra/tirada,
   competencias, combate, ataques/conjuros, inventario de seguimiento, notas),
   con derivados calculados en el servidor.
4. **Vista Máster:** combatientes, bestiario SRD, referencia rápida, dados
   (abiertos y ocultos), log de tiradas + log de eventos, notas privadas,
   ajuste de PV, control de iniciativa/turnos.
5. **Vista Jugador:** su ficha, economía de acciones (Atacar/Conjuro/Esquivar…),
   inventario y normas editables (seguimiento), rail pública, dados, log público,
   "Terminar turno".
6. **Visibilidad por rol** funcionando de extremo a extremo, incluida la etiqueta
   de estado pública derivada del HP oculto.
7. **Reconexión + rehidratación** desde Postgres.

**Fuera (extensiones futuras, NO implementar en v1):**
- Verificación de email / recuperación de contraseña (necesita proveedor de
  correo) — fase 2.
- SRD 5.2 completo (bestiario y conjuros enteros) — fase 2.
- Inventario/equipo **mecánico** (equipar cambia CA, peso afecta carga). En v1 es
  seguimiento, no mecánico.
- Mapas / grid / fog of war.
- Editor de avatares.
- Generador procedural de NPCs / encuentros.
- Asistente de máster con LLM.
- Escalado horizontal / Redis.

## 11. Orden de construcción sugerido

1. Esqueleto Fastify + healthcheck desplegable en Render.
2. **Auth:** `User`, registro, login, sesión + tests.
3. **Campañas:** `Campaign`, crear/listar/invitar/unirse + tests de autorización.
4. Dominio de **reglas 5e** puro (derivados, compra de puntos, competencias) +
   tests.
5. **Ficha de personaje:** `CharacterSheet`, crear/editar con cálculo en servidor.
6. Resolución de **dados** (parser d4–d100, crítico/pifia, ataque) + tests.
7. `SrdProvider` con el JSON semilla (condiciones, reglas, bestiario).
8. Repositorios sobre Postgres + **rehidratación**.
9. Capa **WS**: rooms, snapshot inicial filtrado, difusión de eventos.
10. Comandos de **combate** (iniciativa, turnos, condiciones, HP, eventos).
11. Frontend en Vercel conectado por WS, pantalla por pantalla según
    `DESIGN_SPEC.md`.

## 12. Tests (criterio mínimo)

- Unitarios del dominio: derivados 5e (mod, competencia, CD), validación de
  compra de puntos, autorización por rol y propiedad.
- **Política de visibilidad:** un jugador NUNCA ve `dm_only`; el HP `dm_only` de
  un monstruo se proyecta como etiqueta de estado, no como número.
- Parser de dados: notaciones válidas e inválidas, límites, crítico/pifia,
  `RollAttack` (to-hit + daño).
- Autorización de turno: `EndMyTurn` solo lo acepta el servidor del dueño del
  combatiente activo.
- Integración del repositorio: persistir → rehidratar → estado equivalente.
- Test de proyección por rol: dado un mismo estado, el snapshot del máster ≠
  snapshot del jugador en los campos ocultos.

## 13. Notas de licencia

D&D 2024: usar el **SRD 5.2** (Creative Commons) para reglas, monstruos y
conjuros. No incluir contenido propietario fuera del SRD. Mantener la atribución
CC requerida.
