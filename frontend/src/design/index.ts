// Grimorio design system barrel (frontend/src/design).
// Import './tokens.css' and './components.css' once at the app root.

export { colors, getRoleColor } from './tokens';
export type { ColorToken, ColorRole } from './tokens';

export { Panel } from './Panel';
export type { PanelProps } from './Panel';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Field } from './Field';
export type { FieldProps } from './Field';

export { StatNumber } from './StatNumber';
export type { StatNumberProps } from './StatNumber';

export { InitiativeRail } from './InitiativeRail';
export type {
  InitiativeRailProps,
  InitiativeToken,
  ConditionChip,
} from './InitiativeRail';

export { DiceRoller } from './DiceRoller';
export type { DiceRollerProps, DiceRollView } from './DiceRoller';

export { Dice3D } from './Dice3D';
export type { Dice3DProps, DieType } from './Dice3D';

export { DiceModal } from './DiceModal';
export type { DiceModalProps } from './DiceModal';
