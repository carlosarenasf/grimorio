/**
 * Wire command schemas (zod) — every command from SPEC.md §6.
 *
 * Commands are the only thing a client may send. They are validated at the
 * transport boundary (HTTP body / WS message) before any handler runs, so the
 * server never trusts client-supplied results — only intent + notation (SPEC §7).
 * The whole set is one discriminated union on `type`.
 */
import { z } from 'zod';

// ---------- Shared leaf schemas ----------

const Visibility = z.enum(['public', 'dm_only', 'owner']);
const CampaignStatus = z.enum(['planning', 'active', 'paused']);
const CombatantType = z.enum(['pc', 'monster']);

const AbilityScores = z.object({
  str: z.number().int(),
  dex: z.number().int(),
  con: z.number().int(),
  int: z.number().int(),
  wis: z.number().int(),
  cha: z.number().int(),
});

const ConditionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1),
});

const Notation = z.string().min(1);

// ---------- Account & campaign commands (HTTP) ----------

export const RegisterSchema = z.object({
  type: z.literal('Register'),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

export const LoginSchema = z.object({
  type: z.literal('Login'),
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateCampaignSchema = z.object({
  type: z.literal('CreateCampaign'),
  name: z.string().min(1),
  tagline: z.string().default(''),
});

export const UpdateCampaignSchema = z.object({
  type: z.literal('UpdateCampaign'),
  campaignId: z.string().min(1),
  name: z.string().min(1).optional(),
  tagline: z.string().optional(),
  status: CampaignStatus.optional(),
});

export const InviteToCampaignSchema = z.object({
  type: z.literal('InviteToCampaign'),
  campaignId: z.string().min(1),
});

export const JoinCampaignSchema = z.object({
  type: z.literal('JoinCampaign'),
  joinCode: z.string().min(1),
});

const CharacterCorePatch = z.object({
  name: z.string().min(1).optional(),
  species: z.string().optional(),
  className: z.string().optional(),
  background: z.string().optional(),
  level: z.number().int().min(1).max(20).optional(),
  scores: AbilityScores.optional(),
  maxHp: z.number().int().min(0).optional(),
  currentHp: z.number().int().optional(),
  armorClass: z.number().int().optional(),
  speed: z.number().optional(),
  proficientSkills: z.array(z.string()).optional(),
  gold: z.number().min(0).optional(),
  notes: z.string().optional(),
  visibility: Visibility.optional(),
});

export const CreateCharacterSchema = z.object({
  type: z.literal('CreateCharacter'),
  campaignId: z.string().min(1),
  name: z.string().min(1),
  species: z.string().min(1),
  className: z.string().min(1),
  background: z.string().min(1),
  level: z.number().int().min(1).max(20),
  // Optional so method 'roll' (server rolls 4d6) is valid. The "buy requires
  // scores" rule is enforced server-side: the domain throws → IllegalPointBuy.
  scores: AbilityScores.optional(),
  method: z.enum(['buy', 'roll']),
  proficientSkills: z.array(z.string()).optional(),
  spells: z.array(z.string()).optional(),
});

export const UpdateCharacterSchema = z.object({
  type: z.literal('UpdateCharacter'),
  characterId: z.string().min(1),
  patch: CharacterCorePatch,
});

// ---------- Live session commands (WS) ----------

export const StartCombatSchema = z.object({
  type: z.literal('StartCombat'),
});

export const AddCombatantFromBestiarySchema = z.object({
  type: z.literal('AddCombatantFromBestiary'),
  monsterId: z.string().min(1),
  hpVisibility: Visibility.default('dm_only'),
});

export const AddManualCombatantSchema = z.object({
  type: z.literal('AddManualCombatant'),
  name: z.string().min(1),
  maxHp: z.number().int().min(0),
  initiative: z.number().int(),
  combatantType: CombatantType,
  hpVisibility: Visibility.default('public'),
  refId: z.string().nullable().default(null),
});

export const RemoveCombatantSchema = z.object({
  type: z.literal('RemoveCombatant'),
  combatantId: z.string().min(1),
});

export const SeatPlayerSchema = z.object({
  type: z.literal('SeatPlayer'),
  characterId: z.string().min(1),
});

export const SetInitiativeSchema = z.object({
  type: z.literal('SetInitiative'),
  combatantId: z.string().min(1),
  initiative: z.number().int(),
});

export const ReorderInitiativeSchema = z.object({
  type: z.literal('ReorderInitiative'),
  order: z.array(z.string().min(1)),
});

export const NextTurnSchema = z.object({
  type: z.literal('NextTurn'),
});

export const PrevTurnSchema = z.object({
  type: z.literal('PrevTurn'),
});

export const EndMyTurnSchema = z.object({
  type: z.literal('EndMyTurn'),
});

export const SetConditionSchema = z.object({
  type: z.literal('SetCondition'),
  combatantId: z.string().min(1),
  condition: ConditionSchema,
});

export const ClearConditionSchema = z.object({
  type: z.literal('ClearCondition'),
  combatantId: z.string().min(1),
  conditionKey: z.string().min(1),
});

export const ApplyDamageSchema = z.object({
  type: z.literal('ApplyDamage'),
  combatantId: z.string().min(1),
  amount: z.number().int().min(0),
});

export const ApplyHealingSchema = z.object({
  type: z.literal('ApplyHealing'),
  combatantId: z.string().min(1),
  amount: z.number().int().min(0),
});

export const RollDiceSchema = z.object({
  type: z.literal('RollDice'),
  notation: Notation,
  visibility: Visibility.default('public'),
});

export const RollAttackSchema = z.object({
  type: z.literal('RollAttack'),
  name: z.string().min(1),
  toHitBonus: z.number().int().nullable().default(null),
  damage: z.string().nullable().default(null),
  visibility: Visibility.default('public'),
});

export const RollHiddenSchema = z.object({
  type: z.literal('RollHidden'),
  notation: Notation,
});

export const AppendDmNoteSchema = z.object({
  type: z.literal('AppendDmNote'),
  notes: z.string(),
});

export const EndCombatSchema = z.object({
  type: z.literal('EndCombat'),
});

// ---------- The discriminated union over `type` ----------

export const CommandSchema = z.discriminatedUnion('type', [
  RegisterSchema,
  LoginSchema,
  CreateCampaignSchema,
  UpdateCampaignSchema,
  InviteToCampaignSchema,
  JoinCampaignSchema,
  CreateCharacterSchema,
  UpdateCharacterSchema,
  StartCombatSchema,
  AddCombatantFromBestiarySchema,
  AddManualCombatantSchema,
  RemoveCombatantSchema,
  SeatPlayerSchema,
  SetInitiativeSchema,
  ReorderInitiativeSchema,
  NextTurnSchema,
  PrevTurnSchema,
  EndMyTurnSchema,
  SetConditionSchema,
  ClearConditionSchema,
  ApplyDamageSchema,
  ApplyHealingSchema,
  RollDiceSchema,
  RollAttackSchema,
  RollHiddenSchema,
  AppendDmNoteSchema,
  EndCombatSchema,
]);

export type Command = z.infer<typeof CommandSchema>;
export type CommandType = Command['type'];

// Individual inferred command types (handy for handlers downstream).
export type RegisterCommand = z.infer<typeof RegisterSchema>;
export type LoginCommand = z.infer<typeof LoginSchema>;
export type CreateCampaignCommand = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignCommand = z.infer<typeof UpdateCampaignSchema>;
export type InviteToCampaignCommand = z.infer<typeof InviteToCampaignSchema>;
export type JoinCampaignCommand = z.infer<typeof JoinCampaignSchema>;
export type CreateCharacterCommand = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterCommand = z.infer<typeof UpdateCharacterSchema>;
export type StartCombatCommand = z.infer<typeof StartCombatSchema>;
export type AddCombatantFromBestiaryCommand = z.infer<typeof AddCombatantFromBestiarySchema>;
export type AddManualCombatantCommand = z.infer<typeof AddManualCombatantSchema>;
export type RemoveCombatantCommand = z.infer<typeof RemoveCombatantSchema>;
export type SeatPlayerCommand = z.infer<typeof SeatPlayerSchema>;
export type SetInitiativeCommand = z.infer<typeof SetInitiativeSchema>;
export type ReorderInitiativeCommand = z.infer<typeof ReorderInitiativeSchema>;
export type NextTurnCommand = z.infer<typeof NextTurnSchema>;
export type PrevTurnCommand = z.infer<typeof PrevTurnSchema>;
export type EndMyTurnCommand = z.infer<typeof EndMyTurnSchema>;
export type SetConditionCommand = z.infer<typeof SetConditionSchema>;
export type ClearConditionCommand = z.infer<typeof ClearConditionSchema>;
export type ApplyDamageCommand = z.infer<typeof ApplyDamageSchema>;
export type ApplyHealingCommand = z.infer<typeof ApplyHealingSchema>;
export type RollDiceCommand = z.infer<typeof RollDiceSchema>;
export type RollAttackCommand = z.infer<typeof RollAttackSchema>;
export type RollHiddenCommand = z.infer<typeof RollHiddenSchema>;
export type AppendDmNoteCommand = z.infer<typeof AppendDmNoteSchema>;
export type EndCombatCommand = z.infer<typeof EndCombatSchema>;
