/**
 * Domain tests for `createMap` (default layers, ids, timestamps).
 */
import { describe, expect, it } from 'vitest';
import { createMap } from './index.js';
import { newCampaignId } from '../ids.js';

describe('createMap', () => {
  it('creates a map with three default layers (Suelo, Objetos, Techo) sorted by index', () => {
    const map = createMap(
      {
        campaignId: newCampaignId(),
        name: 'Bosque Encantado',
        type: 'exterior',
        environment: 'bosque',
        width: 20,
        height: 15,
      },
      { now: () => '2026-01-01T00:00:00.000Z' },
    );

    expect(map.layers).toHaveLength(3);
    expect(map.layers.map((l) => l.name)).toEqual(['Suelo', 'Objetos', 'Techo']);
    expect(map.layers.every((l) => l.elements.length === 0)).toBe(true);
    expect(map.layers.every((l) => l.visible === true)).toBe(true);
    expect(new Set(map.layers.map((l) => l.id)).size).toBe(3);
  });

  it('uses default gridSize 32 when not provided', () => {
    const map = createMap(
      {
        campaignId: newCampaignId(),
        name: 'Casa',
        type: 'interior',
        environment: 'casa',
        width: 10,
        height: 10,
      },
      { now: () => 't' },
    );
    expect(map.gridSize).toBe(32);
  });

  it('honours an explicit gridSize when provided', () => {
    const map = createMap(
      {
        campaignId: newCampaignId(),
        name: 'Casa',
        type: 'interior',
        environment: 'casa',
        width: 10,
        height: 10,
        gridSize: 64,
      },
      { now: () => 't' },
    );
    expect(map.gridSize).toBe(64);
  });

  it('assigns a new MapId prefixed `map_`', () => {
    const map = createMap(
      {
        campaignId: newCampaignId(),
        name: 'X',
        type: 'exterior',
        environment: 'bosque',
        width: 10,
        height: 10,
      },
      { now: () => 't' },
    );
    expect(map.id).toMatch(/^map_/);
  });

  it('sets createdAt and updatedAt equal to the clock value', () => {
    const at = '2026-07-05T12:00:00.000Z';
    const map = createMap(
      {
        campaignId: newCampaignId(),
        name: 'X',
        type: 'exterior',
        environment: 'bosque',
        width: 10,
        height: 10,
      },
      { now: () => at },
    );
    expect(map.createdAt).toBe(at);
    expect(map.updatedAt).toBe(at);
  });

  it('propagates campaignId, type, environment and dimensions onto the snapshot', () => {
    const campaignId = newCampaignId();
    const map = createMap(
      {
        campaignId,
        name: 'Cripta',
        type: 'interior',
        environment: 'dungeon',
        width: 24,
        height: 18,
      },
      { now: () => 't' },
    );
    expect(map).toMatchObject({
      campaignId,
      name: 'Cripta',
      type: 'interior',
      environment: 'dungeon',
      width: 24,
      height: 18,
    });
  });
});