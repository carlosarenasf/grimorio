# DESIGN SPEC — Grimorio · Mesa Virtual de Rol (D&D 5e 2024 / "5.5e")

> Especificación de diseño y UX para trabajar con Claude Design.
> Define la dirección visual, el sistema de tokens, los patrones de UI y —lo más
> importante— una estructura pensada para crecer: esto es un punto de partida,
> no el alcance final. Cada decisión debe poder extenderse a features futuras.
>
> **Estado:** las 5 pantallas de la v1 ya están diseñadas en Claude Design
> (proyecto *Grimorio*): **Registro**, **Campañas**, **Crear Personaje**,
> **Vista Máster** y **Vista Jugador**. Ver el inventario de pantallas en la
> sección 4.b. El lado de producto/backend está en `SPEC.md`.
> Reglas y datos: **D&D 2024, base SRD 5.2** (CC).

---

## 0. Cómo usar este documento con Claude Design

El producto es **iterativo por diseño**. Empezamos con un núcleo (salas, fichas, dados, iniciativa con visibilidad por rol) y le iremos colgando features encima (mapas, generadores, bestiario, asistente de máster…). Por eso este documento prioriza un **sistema** sobre pantallas concretas: tokens, componentes y layout que aguanten el crecimiento sin rediseñar.

Al pedir pantallas a Claude Design, referenciar siempre los tokens de la sección 3 y los patrones de la sección 5, para que cada nueva feature herede la misma identidad.

## 1. Qué estamos diseñando y para quién

Una mesa virtual ligera para partidas de D&D 5e. Dos roles muy distintos comparten pantalla:

- **El máster (DM):** orquesta. Necesita control, densidad de información y cosas que solo ve él (HP real de monstruos, notas, tiradas ocultas). Su vista es un "panel de control".
- **Los jugadores:** participan. Necesitan claridad, su ficha a mano, y ver lo público (iniciativa, tiradas abiertas). Su vista es más limpia y enfocada.

El trabajo central de la interfaz: **hacer evidente en todo momento qué es público, qué es privado y de quién es el turno.** La visibilidad por rol no es solo backend; tiene que *leerse* en la UI.

## 2. Dirección visual

### El riesgo estético, justificado

El default de "fantasía" es pergamino, tipografías góticas y texturas de cuero — cae en kitsch y se lee mal en pantalla durante horas de juego. Tomamos la dirección opuesta y la justificamos: **"grimorio moderno"**. La atmósfera de rol viene del *color, la materialidad y los detalles de borde*, no de imitar un pergamino. Base oscura y serena (se juega de noche, reduce fatiga en sesiones largas), tipografía con carácter pero legible, y un único acento "arcano" que marca lo importante. Es bonito y atmosférico sin sacrificar usabilidad ni densidad de datos.

### Materialidad

- Superficies oscuras estratificadas (no negro plano): la mesa, las cartas de personaje, los paneles. Profundidad por capas de elevación, no por skeuomorfismo.
- Bordes finos con un leve brillo (hairline + glow muy sutil en elementos activos) que evocan grabado/runa sin literalidad.
- El acento dorado-arcano se reserva para lo que importa: turno activo, tirada crítica, acción primaria. Si todo brilla, nada brilla.

## 3. Sistema de tokens

### Color (paleta de 6, base oscura "grimorio")

```
--ink-void:     #14121C   /* fondo base, la "mesa" de noche */
--ink-surface:  #1E1B2A   /* superficie de paneles y cartas */
--ink-raised:   #2A2640   /* elementos elevados, hover */
--parchment:    #E8E2D0   /* texto principal, "tinta clara" */
--arcane:       #C9A227   /* acento dorado-arcano: turno activo, acción primaria, crítico */
--ember:        #B4452E   /* alerta/daño/peligro: HP bajo, condiciones negativas */
```

Acentos de apoyo (derivar, no abusar):
- Verde salvia apagado para curación / estados positivos.
- Azul frío tenue para lo "solo-máster", de modo que el DM identifique de un vistazo su información privada.

**Semántica de color (regla):** el color codifica visibilidad y estado, no decora.
- Borde/acento **dorado** = activo / primario / tu turno.
- Tinte **azul frío** = información solo-máster (un jugador nunca ve este tinte porque nunca recibe esos datos).
- **Ámbar/ember** = daño, HP bajo, peligro.

### Tipografía (3 roles)

- **Display** (títulos de sala, nombres de PJ, encabezados de combate): una serif con carácter, anchura media, usada con restraint. Evoca el "título de capítulo" de un manual sin ser gótica. Candidatas: *Cormorant*, *Spectral*, *Fraunces*.
- **Body / UI** (etiquetas, controles, texto de ficha): una sans humanista muy legible a tamaños pequeños y en densidad. Candidatas: *Inter*, *Public Sans*, *Source Sans 3*.
- **Data / mono** (resultados de dados, HP, números de iniciativa, modificadores): una mono con buenas cifras tabulares, porque los números cambian en vivo y deben alinearse. Candidatas: *JetBrains Mono*, *IBM Plex Mono*.

Escala de tipo clara y con intención: cifras de dados y HP grandes y en mono (son el "latido" de la mesa); etiquetas pequeñas en mayúsculas con tracking para los eyebrows de sección.

### Espaciado, radios, elevación

- Escala de espaciado en múltiplos de 4. Densidad mayor en la vista de máster, más aire en la de jugador.
- Radios moderados (8–12px) en cartas y paneles; 0 en divisores y tablas de datos para mantener seriedad de "documento".
- Elevación por color + sombra muy suave + hairline, nunca por sombras dramáticas.

## 4. El elemento de firma

**La "tira de iniciativa" (initiative rail).** Es lo que la gente recordará y el corazón funcional de la mesa: una fila horizontal (o lateral en desktop) de fichas-token ordenadas por iniciativa, donde **el turno activo se ilumina en dorado-arcano** y avanza con una transición fluida al pasar de turno. Cada token muestra nombre, HP (o solo un estado para monstruos si el máster lo oculta) e iconos de condición.

Concentra aquí la audacia visual; el resto de la interfaz se mantiene disciplinado alrededor. Es también el ejemplo perfecto de visibilidad por rol hecha visible: el máster ve el HP real del dragón, el jugador ve solo "Herido".

## 4.b Inventario de pantallas (v1)

Las cinco pantallas diseñadas y su correspondencia con el dominio (`SPEC.md` §5):

| Pantalla | Función | Notas de visibilidad |
|---|---|---|
| **Registro** | Alta de cuenta: nombre, email, contraseña con medidor de fuerza. Login enlazado. | — (sin email transaccional en v1) |
| **Campañas** | Tarjetas de campaña con status (`En curso`/`En pausa`/`Preparando`), jugadores, sesiones, código. Modales de **crear** y de **invitar** (enlace + código + QR decorativo). | El jugador solo ve sus campañas |
| **Crear Personaje** | Hoja 5e completa en pasos: Identidad (especie/raza, clase, trasfondo, nivel) · Características (compra 27 pts + tirar 4d6) · Combate (PV/CA/vel) · Competencias (18) · Ataques y conjuros · Rasgos. Resumen en vivo a la derecha. | Ficha `owner` |
| **Vista Máster** | Panel de control denso: Combatientes, Bestiario SRD, Referencia rápida, mesa central con initiative rail + turno activo, Dados (abiertos y **tirada oculta**), Historial (tiradas + eventos), **Notas del máster** (tinte azul frío + candado). | DM ve `dm_only`; HP de monstruos real |
| **Vista Jugador** | Más limpia: su ficha, **economía de acciones** (Atacar/Conjuro/Esquivar/Esprintar/Destrabarse/Esconderse/Ayudar/Preparar con texto SRD), Equipo e inventario (seguimiento), **Normas básicas** editables, rail pública, Dados, log público, "Terminar turno". | Solo público + lo `owner`; HP de monstruos como etiqueta |

**Nota de terminología:** los diseños usan "Raza" en la UI. Con reglas 2024 el
término canónico es "Especie". Mantener "Raza" si se prefiere por familiaridad,
pero ser coherente en toda la app. El modelo (`SPEC.md`) usa `species`.

## 5. Layout y patrones (pensados para crecer)

### Concepto de layout: "mesa + paneles acoplables"

La pantalla es una **mesa central** con **paneles** alrededor. Los paneles son la unidad de extensión: cada feature futura es un panel nuevo que encaja en el mismo sistema, sin rediseñar el resto.

```
DESKTOP — Vista Máster
┌───────────────────────────────────────────────────────────┐
│  [Sala: La Cripta de Ashryn]            código · jugadores  │  ← barra de sesión
├──────────────┬────────────────────────────┬────────────────┤
│              │                            │                │
│  PANELES     │      MESA CENTRAL          │   PANEL         │
│  IZQUIERDA   │  (initiative rail arriba)  │   DERECHA       │
│              │                            │                │
│  · Fichas    │   [ tokens de combate ]    │  · Tiradas      │
│  · Bestiario │                            │    (log)        │
│    (futuro)  │   zona de turno activo     │  · Notas DM     │
│  · Mapas     │                            │    (privado)    │
│    (futuro)  │                            │  · Dados        │
│              │                            │                │
├──────────────┴────────────────────────────┴────────────────┤
│  Barra de acción: tirar dados · siguiente turno · daño/cura │
└───────────────────────────────────────────────────────────┘

DESKTOP — Vista Jugador (más limpia, menos paneles)
┌───────────────────────────────────────────────────────────┐
│  [Sala: La Cripta de Ashryn]                    tu turno ●  │
├────────────────────────────────┬──────────────────────────┤
│       MESA CENTRAL             │   TU FICHA                │
│   (initiative rail arriba)     │   (HP, stats, inventario) │
│                                │                           │
│   [ tokens públicos ]          │   ─────────               │
│                                │   Log de tiradas público  │
├────────────────────────────────┴──────────────────────────┤
│  Barra de acción: tirar dados                              │
└───────────────────────────────────────────────────────────┘
```

### Sistema de paneles (clave para la iteración)

Define un **componente Panel genérico** desde el principio: cabecera con título + eyebrow + acciones, cuerpo con scroll propio, estado de "solo-máster" (tinte azul frío + icono de candado), y estados vacíos con invitación a la acción. Cada feature nueva —bestiario, generador de NPCs, mapas, asistente de máster— es una instancia de Panel. Así el producto crece sin fricción visual.

### Responsive

- **Desktop:** mesa + paneles laterales como arriba.
- **Tablet:** paneles colapsan en pestañas a un lado.
- **Móvil:** la initiative rail pasa a horizontal scroll arriba; los paneles se convierten en un bottom-sheet / tabs. El jugador en móvil es un caso de uso real (mira su ficha desde el sofá): que su vista funcione perfecta en pequeño es prioridad.

## 6. Patrones de interacción

- **El turno es el rey.** En todo momento debe estar clarísimo de quién es el turno: token iluminado en la rail + indicador en la barra de sesión ("tu turno"/"turno de X"). El paso de turno es la microinteracción más cuidada (transición del glow dorado de un token al siguiente).
- **Tiradas en vivo.** Una tirada aparece en el log con su desglose (dados individuales → total), animación breve, y color según resultado (crítico en dorado, pifia en ember). Las tiradas ocultas del máster aparecen solo en su panel, marcadas como privadas.
- **HP como latido.** Cambios de HP animados (número que baja, barra que se reduce); cruzar umbrales bajos tiñe de ember. Curación en verde salvia.
- **Visibilidad legible.** Cualquier dato privado lleva un marcador visual consistente (candado + tinte azul frío para `dm_only`). El usuario nunca debe dudar de si los demás ven algo.
- **Etiqueta de estado derivada.** Cuando el máster oculta el HP de un monstruo, su token muestra al jugador una etiqueta (`«Intacto»/«Herido»/«Malherido»/«Caído»`) en vez del número. El máster ve el HP real y, junto a él, una nota de qué ve el jugador (p. ej. `⌧ jugador: «Herido»`). Esta etiqueta la deriva el servidor; el cliente del jugador nunca recibe el número real.

## 7. Voz y copy (UI)

Desde el lado del jugador, no del sistema. Verbos activos, sentence case, sin relleno.

- Acciones nombran lo que hacen y mantienen el nombre en todo el flujo: el botón "Tirar" produce "Has tirado…"; "Pasar turno" → "Turno de Lyra".
- Vocabulario del mundo del rol donde aporta claridad, sin disfraz: "Iniciativa", "Tirada", "Condición", "Máster". Nada de jerga técnica ("crear instancia de sesión" → "Crear sala").
- Estados vacíos como invitación: un log de tiradas vacío dice "Aún no hay tiradas. Lanza los dados para empezar.", no "Sin datos".
- Errores con dirección, sin disculpas vagas: "Esa notación no es válida. Prueba algo como 2d6+3."

## 8. Quality floor (no negociable)

- Responsive real hasta móvil (sobre todo la vista de jugador).
- Foco de teclado visible y navegación por teclado en controles de combate (el máster los usa constantemente).
- `prefers-reduced-motion` respetado: las transiciones de turno y tiradas tienen variante sobria.
- Contraste suficiente sobre fondo oscuro (texto parchment sobre superficies, no gris sobre gris).
- Cifras tabulares en todos los números que cambian en vivo, para que no "salten".

## 9. Pensado para crecer: features futuras y cómo encajan

Esto es un punto de partida. **Ya en v1** el sistema absorbe, como paneles, el
bestiario SRD (búsqueda + añadir al combate), la referencia rápida y las
condiciones (chips sobre los tokens) — con un **subconjunto curado del SRD 5.2**
(ver `SPEC.md` §9). El sistema (tokens + Panel + mesa central + initiative rail)
está diseñado para seguir absorbiendo, como nuevos paneles o capas, al menos:

- **Bestiario / compendio SRD 5.2 completo:** ampliar el subconjunto curado de v1 a todo el SRD.
- **Generador de NPCs / encuentros:** panel que produce fichas insertables.
- **Mapas / grid:** nueva capa sobre la mesa central, no un rediseño.
- **Asistente de máster (LLM):** panel de chat privado del DM.
- **Conjuros (SRD 5.2):** tooltips y panel de búsqueda; ataques de tipo conjuro ya existen en la ficha.

Regla para Claude Design en cada iteración: **una feature nueva no introduce una identidad nueva.** Hereda paleta, tipografía, el componente Panel y la semántica de color/visibilidad. La audacia ya está gastada en la initiative rail; lo demás se mantiene quieto y coherente.

## 10. Orden sugerido de diseño

1. **Design system primero:** tokens, tipografía, el componente Panel, y la initiative rail como pieza de firma. Validar en pantalla antes de seguir.
2. **Vista de máster** (mesa + paneles + barra de acción), que es la más densa.
3. **Vista de jugador** (derivada, más limpia).
4. **Estados:** vacío, cargando (incluido el cold start de ~1 min al despertar el servidor — pantalla de "Entrando a la sala…" cuidada, no un spinner pelado), reconexión, error de tirada.
5. **Responsive / móvil**, con foco en la vista de jugador.

> Nota técnica para coherencia con el backend: la UI **refleja** la visibilidad por rol, pero no la implementa. El servidor ya filtra lo que cada cliente recibe; un jugador nunca tiene en su cliente los datos `dm_only`. El diseño solo debe representar con claridad esa distinción, no ocultar en CSS algo que el cliente sí tiene.
