import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrearPersonajeScreen } from './CrearPersonajeScreen';
import { ApiError } from '../../net';
import type { ApiClient, CharacterDTO } from '../../net';
import type {
  ClassDTO,
  SpeciesDTO,
  BackgroundDTO,
  SpellDTO,
} from '../../net/http';

const CLASSES: ClassDTO[] = [
  {
    id: 'fighter',
    name: 'Guerrero',
    hitDie: 10,
    primaryAbility: 'str',
    savingThrows: ['str', 'con'],
    spellcasting: 'none',
    description: 'Maestro del combate marcial.',
    skillChoices: 2,
    skillOptions: ['athletics', 'intimidation', 'perception', 'survival'],
  },
  {
    id: 'wizard',
    name: 'Mago',
    hitDie: 6,
    primaryAbility: 'int',
    savingThrows: ['int', 'wis'],
    spellcasting: 'full',
    description: 'Erudito de la magia arcana.',
    skillChoices: 2,
    skillOptions: ['arcana', 'history', 'investigation', 'insight'],
  },
];

const SPECIES: SpeciesDTO[] = [
  {
    id: 'human',
    name: 'Humano',
    size: 'Mediano',
    speed: 9,
    description: 'Versátil y ambicioso.',
    traits: ['Versátil', 'Hábil'],
  },
  {
    id: 'elf',
    name: 'Elfo',
    size: 'Mediano',
    speed: 9,
    description: 'Grácil y longevo.',
    traits: ['Visión en la oscuridad', 'Linaje feérico'],
  },
];

const BACKGROUNDS: BackgroundDTO[] = [
  {
    id: 'soldier',
    name: 'Soldado',
    description: 'Veterano de guerra.',
    abilityOptions: ['str', 'con'],
    skills: ['athletics', 'intimidation'],
  },
  {
    id: 'sage',
    name: 'Sabio',
    description: 'Estudioso de tomos.',
    abilityOptions: ['int'],
    skills: ['arcana', 'history'],
  },
];

const SPELLS: SpellDTO[] = [
  {
    id: 'firebolt',
    name: 'Rayo de fuego',
    level: 0,
    school: 'Evocación',
    classes: ['wizard'],
    description: 'Lanza una mota de fuego.',
  },
  {
    id: 'mage-hand',
    name: 'Mano de mago',
    level: 0,
    school: 'Conjuración',
    classes: ['wizard'],
    description: 'Una mano espectral.',
  },
  {
    id: 'magic-missile',
    name: 'Proyectil mágico',
    level: 1,
    school: 'Evocación',
    classes: ['wizard'],
    description: 'Dardos de fuerza infalibles.',
  },
  {
    id: 'shield',
    name: 'Escudo',
    level: 1,
    school: 'Abjuración',
    classes: ['wizard'],
    description: 'Una barrera de fuerza.',
  },
];

function fakeSheet(over: Partial<CharacterDTO> = {}): CharacterDTO {
  return {
    id: 'char-1',
    campaignId: 'camp-1',
    ownerId: 'user-1',
    name: 'Lyra',
    species: 'Humano',
    className: 'Guerrero',
    background: 'Soldado',
    level: 1,
    scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    maxHp: 12,
    currentHp: 12,
    armorClass: 12,
    speed: 9,
    proficientSkills: [],
    gold: 0,
    notes: '',
    ...over,
  };
}

function makeApi(over: Partial<ApiClient> = {}): ApiClient {
  return {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    listCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    invite: vi.fn(),
    joinByCode: vi.fn(),
    createCharacter: vi.fn(async () => fakeSheet()),
    updateCharacter: vi.fn(async () => fakeSheet()),
    getCharacter: vi.fn(),
    getSnapshot: vi.fn(),
    searchMonsters: vi.fn(),
    getSpecies: vi.fn(async () => SPECIES),
    getClasses: vi.fn(async () => CLASSES),
    getBackgrounds: vi.fn(async () => BACKGROUNDS),
    getSpells: vi.fn(async () => SPELLS),
    listCampaignCharacters: vi.fn(),
    ...over,
  } as ApiClient;
}

const baseProps = { campaignId: 'camp-1', ownerId: 'user-1' };

function nextButton() {
  return screen.getByRole('button', { name: 'Siguiente' });
}

/** Drive the wizard through Clase→Especie→Trasfondo→Características→Competencias. */
async function fillToCompetencias(
  user: ReturnType<typeof userEvent.setup>,
  className: RegExp,
) {
  await user.click(await screen.findByRole('button', { name: className }));
  await user.click(nextButton()); // -> Especie
  await user.click(screen.getByRole('button', { name: /Humano/ }));
  await user.click(nextButton()); // -> Trasfondo
  await user.click(screen.getByRole('button', { name: /Soldado/ }));
  // Soldado offers two ability boosts; pick one so the step is valid.
  await user.selectOptions(
    screen.getByLabelText('Característica a mejorar (+1)'),
    'str',
  );
  await user.click(nextButton()); // -> Características
  await user.click(nextButton()); // -> Competencias
}

describe('CrearPersonajeScreen wizard', () => {
  it('loads classes, species and backgrounds and shows them as choices', async () => {
    const api = makeApi();
    render(<CrearPersonajeScreen api={api} {...baseProps} />);

    // Starts on the Clase step and renders class cards.
    expect(await screen.findByRole('button', { name: /Guerrero/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mago/ })).toBeInTheDocument();
    expect(api.getClasses).toHaveBeenCalled();
    expect(api.getSpecies).toHaveBeenCalled();
    expect(api.getBackgrounds).toHaveBeenCalled();

    // Step indicator names the current step. With no class chosen yet the
    // Conjuros step is not counted, so the flow is 6 steps.
    expect(screen.getByText(/Paso 1 de 6 · Clase/)).toBeInTheDocument();
  });

  it('cannot advance past Clase without choosing a class', async () => {
    const user = userEvent.setup();
    render(<CrearPersonajeScreen api={makeApi()} {...baseProps} />);

    await screen.findByRole('button', { name: /Guerrero/ });
    expect(nextButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Guerrero/ }));
    expect(nextButton()).toBeEnabled();
  });

  it('shows a Conjuros step for a caster class', async () => {
    const user = userEvent.setup();
    render(<CrearPersonajeScreen api={makeApi()} {...baseProps} />);

    await user.click(await screen.findByRole('button', { name: /Mago/ }));
    // Mago is a full caster → the flow expands to 7 steps including Conjuros.
    expect(screen.getByText(/Paso 1 de 7 · Clase/)).toBeInTheDocument();
  });

  it('skips the Conjuros step for a non-caster class', async () => {
    const user = userEvent.setup();
    render(<CrearPersonajeScreen api={makeApi()} {...baseProps} />);

    await user.click(await screen.findByRole('button', { name: /Guerrero/ }));
    // Guerrero has no spellcasting → 6 steps, no Conjuros.
    expect(screen.getByText(/Paso 1 de 6 · Clase/)).toBeInTheDocument();
  });

  it('enforces the class skill-choice count before advancing', async () => {
    const user = userEvent.setup();
    render(<CrearPersonajeScreen api={makeApi()} {...baseProps} />);

    await fillToCompetencias(user, /Guerrero/);
    expect(screen.getByText(/Paso 5 de 6 · Competencias/)).toBeInTheDocument();

    // Guerrero needs 2 class skills; none picked yet.
    expect(nextButton()).toBeDisabled();

    await user.click(screen.getByLabelText('Competente en Percepción'));
    expect(nextButton()).toBeDisabled();
    await user.click(screen.getByLabelText('Competente en Supervivencia'));
    expect(nextButton()).toBeEnabled();
  });

  it('creates a non-caster with method buy and the full payload, then calls onSaved', async () => {
    const user = userEvent.setup();
    const created = fakeSheet({ id: 'new-1', name: 'Brom' });
    const createCharacter = vi.fn<ApiClient['createCharacter']>(async () => created);
    const onSaved = vi.fn();
    render(
      <CrearPersonajeScreen
        api={makeApi({ createCharacter })}
        {...baseProps}
        onSaved={onSaved}
      />,
    );

    await fillToCompetencias(user, /Guerrero/);
    // Pick the 2 class skills.
    await user.click(screen.getByLabelText('Competente en Percepción'));
    await user.click(screen.getByLabelText('Competente en Supervivencia'));
    await user.click(nextButton()); // -> Resumen

    await user.type(screen.getByLabelText('Nombre'), 'Brom');
    await user.click(screen.getByRole('button', { name: 'Crear personaje' }));

    await waitFor(() => expect(createCharacter).toHaveBeenCalledTimes(1));
    const payload = createCharacter.mock.calls[0][0];
    expect(payload).toMatchObject({
      campaignId: 'camp-1',
      ownerId: 'user-1',
      name: 'Brom',
      className: 'Guerrero',
      species: 'Humano',
      background: 'Soldado',
      level: 1,
      method: 'buy',
    });
    // Background skills are auto-added; class picks are included.
    const skills = (payload as unknown as { proficientSkills: string[] })
      .proficientSkills;
    expect(skills).toEqual(
      expect.arrayContaining(['athletics', 'intimidation', 'perception', 'survival']),
    );
    expect(onSaved).toHaveBeenCalledWith(created);
    expect(await screen.findByRole('status')).toHaveTextContent(/Brom.*creado/);
  });

  it('sends chosen spells for a caster and surfaces the Conjuros step', async () => {
    const user = userEvent.setup();
    const createCharacter = vi.fn<ApiClient['createCharacter']>(async () =>
      fakeSheet({ id: 'mage-1', name: 'Eldra', className: 'Mago' }),
    );
    const api = makeApi({ createCharacter });
    render(<CrearPersonajeScreen api={api} {...baseProps} />);

    // Clase = Mago (caster).
    await user.click(await screen.findByRole('button', { name: /Mago/ }));
    await user.click(nextButton()); // -> Especie
    await user.click(screen.getByRole('button', { name: /Humano/ }));
    await user.click(nextButton()); // -> Trasfondo
    await user.click(screen.getByRole('button', { name: /Sabio/ }));
    await user.click(nextButton()); // -> Características
    await user.click(nextButton()); // -> Competencias
    await user.click(screen.getByLabelText('Competente en Investigación'));
    await user.click(screen.getByLabelText('Competente en Perspicacia'));
    await user.click(nextButton()); // -> Conjuros

    expect(screen.getByText(/Paso 6 de 7 · Conjuros/)).toBeInTheDocument();
    await user.click(await screen.findByLabelText('Elegir Rayo de fuego'));
    await user.click(screen.getByLabelText('Elegir Proyectil mágico'));
    await user.click(nextButton()); // -> Resumen

    await user.type(screen.getByLabelText('Nombre'), 'Eldra');
    await user.click(screen.getByRole('button', { name: 'Crear personaje' }));

    await waitFor(() => expect(createCharacter).toHaveBeenCalledTimes(1));
    const payload = createCharacter.mock.calls[0][0] as unknown as {
      spells: string[];
      method: string;
    };
    expect(payload.spells).toEqual(
      expect.arrayContaining(['firebolt', 'magic-missile']),
    );
    expect(api.getSpells).toHaveBeenCalledWith('wizard');
  });

  it('standard array creates with method roll then patches the chosen scores', async () => {
    const user = userEvent.setup();
    const created = fakeSheet({ id: 'sa-1', name: 'Brom' });
    const createCharacter = vi.fn<ApiClient['createCharacter']>(async () => created);
    const updateCharacter = vi.fn<ApiClient['updateCharacter']>(async () => created);
    render(
      <CrearPersonajeScreen
        api={makeApi({ createCharacter, updateCharacter })}
        {...baseProps}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /Guerrero/ }));
    await user.click(nextButton()); // -> Especie
    await user.click(screen.getByRole('button', { name: /Humano/ }));
    await user.click(nextButton()); // -> Trasfondo
    await user.click(screen.getByRole('button', { name: /Soldado/ }));
    await user.selectOptions(
      screen.getByLabelText('Característica a mejorar (+1)'),
      'str',
    );
    await user.click(nextButton()); // -> Características
    await user.click(screen.getByRole('button', { name: 'Reparto estándar' }));
    await user.click(nextButton()); // -> Competencias
    await user.click(screen.getByLabelText('Competente en Percepción'));
    await user.click(screen.getByLabelText('Competente en Supervivencia'));
    await user.click(nextButton()); // -> Resumen
    await user.type(screen.getByLabelText('Nombre'), 'Brom');
    await user.click(screen.getByRole('button', { name: 'Crear personaje' }));

    await waitFor(() => expect(createCharacter).toHaveBeenCalledTimes(1));
    expect(createCharacter.mock.calls[0][0]).toMatchObject({ method: 'roll' });
    // Standard array is not a legal 27-buy → server rolls, then we patch scores.
    await waitFor(() => expect(updateCharacter).toHaveBeenCalledTimes(1));
    const patch = updateCharacter.mock.calls[0][1] as { scores: Record<string, number> };
    expect(patch.scores).toBeDefined();
  });

  it('shows a Spanish error when the server rejects an illegal point-buy (400)', async () => {
    const user = userEvent.setup();
    const createCharacter = vi.fn(async () => {
      throw new ApiError(400, 'illegal point-buy', 'IllegalPointBuy');
    });
    render(<CrearPersonajeScreen api={makeApi({ createCharacter })} {...baseProps} />);

    await fillToCompetencias(user, /Guerrero/);
    await user.click(screen.getByLabelText('Competente en Percepción'));
    await user.click(screen.getByLabelText('Competente en Supervivencia'));
    await user.click(nextButton());
    await user.type(screen.getByLabelText('Nombre'), 'Brom');
    await user.click(screen.getByRole('button', { name: 'Crear personaje' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La compra de puntos no es válida.',
    );
  });
});
