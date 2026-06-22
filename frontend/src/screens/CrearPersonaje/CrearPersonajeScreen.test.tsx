import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrearPersonajeScreen } from './CrearPersonajeScreen';
import { ApiError } from '../../net';
import type { ApiClient, CharacterDTO } from '../../net';

function fakeSheet(over: Partial<CharacterDTO> = {}): CharacterDTO {
  return {
    id: 'char-1',
    campaignId: 'camp-1',
    ownerId: 'user-1',
    name: 'Lyra',
    species: 'Elfo',
    className: 'Explorador',
    background: 'Forastero',
    level: 3,
    scores: { str: 10, dex: 14, con: 12, int: 10, wis: 13, cha: 8 },
    maxHp: 24,
    currentHp: 24,
    armorClass: 14,
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
    listCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    invite: vi.fn(),
    joinByCode: vi.fn(),
    createCharacter: vi.fn(async () => fakeSheet()),
    updateCharacter: vi.fn(async () => fakeSheet()),
    getSnapshot: vi.fn(),
    ...over,
  } as ApiClient;
}

async function goToStep(user: ReturnType<typeof userEvent.setup>, label: RegExp) {
  await user.click(screen.getByRole('button', { name: label }));
}

const baseProps = {
  campaignId: 'camp-1',
  ownerId: 'user-1',
};

describe('CrearPersonajeScreen', () => {
  it('shows the point-buy counter and marks over-budget in red state', async () => {
    const user = userEvent.setup();
    render(<CrearPersonajeScreen api={makeApi()} {...baseProps} />);

    await goToStep(user, /2\. Características/);

    // Starts in buy mode at baseline (all 8s) → 0 / 27.
    const counter = screen.getByText(/Puntos:/);
    expect(counter).toHaveTextContent('0 / 27');
    expect(counter).not.toHaveAttribute('data-over');

    // Push Fuerza to 15 (9 pts), then to budget edge and beyond is blocked at 15.
    const fue = screen.getByTestId('ability-str');
    const inc = within(fue).getByRole('button', { name: /Aumentar/ });
    for (let i = 0; i < 7; i += 1) {
      await user.click(inc); // 8 -> 15
    }
    expect(within(fue).getByLabelText('Puntuación de Fuerza')).toHaveTextContent(
      '15',
    );
    expect(screen.getByText(/Puntos:/)).toHaveTextContent('9 / 27');
    // At 15 the increment button is disabled (cap), so counter cannot exceed via this control.
    expect(inc).toBeDisabled();
  });

  it('marks the counter as over budget when scores exceed 27 points', async () => {
    const user = userEvent.setup();
    // Edit mode lets us inject an over-budget spread (all 15s = 54 pts).
    render(
      <CrearPersonajeScreen
        api={makeApi()}
        {...baseProps}
        initialSheet={fakeSheet({
          scores: { str: 15, dex: 15, con: 15, int: 15, wis: 15, cha: 15 },
        })}
      />,
    );
    await goToStep(user, /2\. Características/);
    const counter = screen.getByText(/Puntos:/);
    expect(counter).toHaveTextContent('54 / 27');
    expect(counter).toHaveAttribute('data-over', 'true');
    expect(counter).toHaveTextContent(/fuera de presupuesto/);
  });

  it('updates a skill modifier by the proficiency bonus when toggled', async () => {
    const user = userEvent.setup();
    render(
      <CrearPersonajeScreen
        api={makeApi()}
        {...baseProps}
        initialSheet={fakeSheet({
          level: 1, // prof +2
          scores: { str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        })}
      />,
    );
    await goToStep(user, /4\. Competencias/);

    // Atletismo → str (mod +2 at score 14). Not proficient: +2.
    const mod = screen.getByTestId('skill-mod-athletics');
    expect(mod).toHaveTextContent('+2');

    await user.click(screen.getByLabelText('Competente en Atletismo'));
    // +2 (ability) + 2 (prof) = +4
    expect(screen.getByTestId('skill-mod-athletics')).toHaveTextContent('+4');
  });

  it('"Tirar 4d6" populates the six scores in range', async () => {
    const user = userEvent.setup();
    render(<CrearPersonajeScreen api={makeApi()} {...baseProps} />);
    await goToStep(user, /2\. Características/);

    await user.click(screen.getByRole('button', { name: 'Tirar 4d6' }));

    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
      const cell = screen.getByTestId(`ability-${key}`);
      const score = Number(
        within(cell).getByLabelText(/Puntuación de/).textContent,
      );
      expect(score).toBeGreaterThanOrEqual(3);
      expect(score).toBeLessThanOrEqual(18);
    }
  });

  it('summary reflects an edited name and level', async () => {
    const user = userEvent.setup();
    render(<CrearPersonajeScreen api={makeApi()} {...baseProps} />);

    const aside = screen.getByRole('complementary', {
      name: /Resumen del personaje/,
    });
    expect(within(aside).getByText('Personaje sin nombre')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nombre'), 'Brom');
    expect(within(aside).getByText('Brom')).toBeInTheDocument();

    // Bump level via the identity stepper.
    await user.click(
      within(screen.getByRole('group', { name: 'Nivel' })).getByRole('button', {
        name: /Aumentar/,
      }),
    );
    expect(within(aside).getByText(/Nivel 2/)).toBeInTheDocument();
  });

  it('Guardar calls createCharacter with a correctly-shaped payload and onSaved with the result', async () => {
    const user = userEvent.setup();
    const created = fakeSheet({ id: 'new-1', name: 'Brom' });
    const createCharacter = vi.fn<ApiClient['createCharacter']>(
      async () => created,
    );
    const onSaved = vi.fn();
    render(
      <CrearPersonajeScreen
        api={makeApi({ createCharacter })}
        {...baseProps}
        onSaved={onSaved}
      />,
    );

    await user.type(screen.getByLabelText('Nombre'), 'Brom');
    await user.type(screen.getByLabelText('Especie'), 'Enano');
    await user.type(screen.getByLabelText('Clase'), 'Guerrero');
    await user.type(screen.getByLabelText('Trasfondo'), 'Soldado');

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(createCharacter).toHaveBeenCalledTimes(1);
    const payload = createCharacter.mock.calls[0][0];
    expect(payload).toMatchObject({
      type: 'CreateCharacter',
      campaignId: 'camp-1',
      ownerId: 'user-1',
      name: 'Brom',
      species: 'Enano',
      className: 'Guerrero',
      background: 'Soldado',
      level: 1,
      method: 'buy',
    });
    expect(payload.scores).toEqual({
      str: 8,
      dex: 8,
      con: 8,
      int: 8,
      wis: 8,
      cha: 8,
    });

    expect(onSaved).toHaveBeenCalledWith(created);
    expect(await screen.findByRole('status')).toHaveTextContent(
      /Brom.*guardado/,
    );
  });

  it('uses updateCharacter in edit mode', async () => {
    const user = userEvent.setup();
    const updateCharacter = vi.fn<ApiClient['updateCharacter']>(async () =>
      fakeSheet({ name: 'Lyra' }),
    );
    render(
      <CrearPersonajeScreen
        api={makeApi({ updateCharacter })}
        {...baseProps}
        initialSheet={fakeSheet()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(updateCharacter).toHaveBeenCalledTimes(1);
    expect(updateCharacter.mock.calls[0][0]).toBe('char-1');
    expect(updateCharacter.mock.calls[0][1]).toMatchObject({
      type: 'UpdateCharacter',
      characterId: 'char-1',
    });
  });

  it('shows a Spanish error when the server rejects an illegal point-buy (400)', async () => {
    const user = userEvent.setup();
    const createCharacter = vi.fn(async () => {
      throw new ApiError(400, 'illegal point-buy', 'IllegalPointBuy');
    });
    render(
      <CrearPersonajeScreen
        api={makeApi({ createCharacter })}
        {...baseProps}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La compra de puntos no es válida.',
    );
  });

  it('adds and removes attack rows', async () => {
    const user = userEvent.setup();
    render(<CrearPersonajeScreen api={makeApi()} {...baseProps} />);
    await goToStep(user, /5\. Ataques y conjuros/);

    expect(screen.queryAllByTestId('attack-row')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Añadir ataque' }));
    expect(screen.getAllByTestId('attack-row')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Quitar ataque/ }));
    expect(screen.queryAllByTestId('attack-row')).toHaveLength(0);
  });
});
