import { JumboRoll, MetallizerMachineSettings, MetallizerPlan, JumboRequirement } from '../../types/metallizer';
import { DEFAULT_METALLIZER_SETTINGS, INITIAL_JUMBO_ROLLS, calculateJumboWeight } from './metallizerMasterData';

const METALLIZER_STORAGE_KEYS = {
  SETTINGS: 'gpak_msl_settings_v1',
  ROLLS: 'gpak_msl_jumbo_rolls_v1',
  PLANS: 'gpak_msl_plans_v1',
  REQUIREMENTS: 'gpak_msl_requirements_v1',
};

const isStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};

export function getStoredMetallizerSettings(): MetallizerMachineSettings {
  try {
    if (isStorageAvailable()) {
      const raw = localStorage.getItem(METALLIZER_STORAGE_KEYS.SETTINGS);
      if (raw) return JSON.parse(raw);
      saveStoredMetallizerSettings(DEFAULT_METALLIZER_SETTINGS);
    }
  } catch (e) {
    console.error('Error reading metallizer settings:', e);
  }
  return DEFAULT_METALLIZER_SETTINGS;
}

export function saveStoredMetallizerSettings(settings: MetallizerMachineSettings): void {
  try {
    if (isStorageAvailable()) {
      localStorage.setItem(METALLIZER_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  } catch (e) {
    console.error('Error saving metallizer settings:', e);
  }
}

export function getStoredJumboRolls(): JumboRoll[] {
  try {
    if (isStorageAvailable()) {
      const raw = localStorage.getItem(METALLIZER_STORAGE_KEYS.ROLLS);
      if (raw) return JSON.parse(raw);
      saveStoredJumboRolls(INITIAL_JUMBO_ROLLS);
    }
  } catch (e) {
    console.error('Error reading jumbo rolls:', e);
  }
  return INITIAL_JUMBO_ROLLS;
}

export function saveStoredJumboRolls(rolls: JumboRoll[]): void {
  try {
    if (isStorageAvailable()) {
      localStorage.setItem(METALLIZER_STORAGE_KEYS.ROLLS, JSON.stringify(rolls));
    }
  } catch (e) {
    console.error('Error saving jumbo rolls:', e);
  }
}

export function getStoredMetallizerPlans(): MetallizerPlan[] {
  try {
    if (isStorageAvailable()) {
      const raw = localStorage.getItem(METALLIZER_STORAGE_KEYS.PLANS);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading metallizer plans:', e);
  }
  return [];
}

export function saveStoredMetallizerPlans(plans: MetallizerPlan[]): void {
  try {
    if (isStorageAvailable()) {
      localStorage.setItem(METALLIZER_STORAGE_KEYS.PLANS, JSON.stringify(plans));
    }
  } catch (e) {
    console.error('Error saving metallizer plans:', e);
  }
}

export function getStoredJumboRequirements(): JumboRequirement[] {
  try {
    if (isStorageAvailable()) {
      const raw = localStorage.getItem(METALLIZER_STORAGE_KEYS.REQUIREMENTS);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading jumbo requirements:', e);
  }
  return [];
}

export function saveStoredJumboRequirements(reqs: JumboRequirement[]): void {
  try {
    if (isStorageAvailable()) {
      localStorage.setItem(METALLIZER_STORAGE_KEYS.REQUIREMENTS, JSON.stringify(reqs));
    }
  } catch (e) {
    console.error('Error saving jumbo requirements:', e);
  }
}

export function consumeJumboRoll(
  rollIdOrDbId: string,
  planId: string,
  consumedLengthM: number
): { success: boolean; updatedRoll?: JumboRoll; error?: string } {
  const rolls = getStoredJumboRolls();
  const index = rolls.findIndex(r => r.id === rollIdOrDbId || r.roll_id === rollIdOrDbId);

  if (index === -1) {
    return { success: false, error: `Jumbo Roll ${rollIdOrDbId} not found in inventory.` };
  }

  const roll = rolls[index];
  if (roll.status === 'CONSUMED') {
    return { success: false, error: `Jumbo Roll ${roll.roll_id} has already been CONSUMED and cannot be reused.` };
  }

  const newRemainingLength = Math.max(0, roll.remaining_length_m - consumedLengthM);
  const newStatus = newRemainingLength <= 0 ? 'CONSUMED' : 'PARTIALLY_CONSUMED';
  const newRemainingKg = calculateJumboWeight(roll.width_mm, roll.thickness_micron, roll.density, newRemainingLength);

  const updatedRoll: JumboRoll = {
    ...roll,
    remaining_length_m: newRemainingLength,
    remaining_quantity_kg: newRemainingKg,
    status: newStatus,
    consumed_by_plan: planId,
    updated_at: new Date().toISOString(),
  };

  rolls[index] = updatedRoll;
  saveStoredJumboRolls(rolls);

  return { success: true, updatedRoll };
}

/**
 * Updates a single jumbo roll in storage and returns the updated roll list
 */
export function updateStoredJumboRoll(updatedRoll: JumboRoll): JumboRoll[] {
  const rolls = getStoredJumboRolls();
  const index = rolls.findIndex(r => r.id === updatedRoll.id || r.roll_id === updatedRoll.roll_id);
  if (index !== -1) {
    rolls[index] = {
      ...updatedRoll,
      updated_at: new Date().toISOString(),
    };
  } else {
    rolls.push(updatedRoll);
  }
  saveStoredJumboRolls(rolls);
  return rolls;
}

/**
 * Deletes a single jumbo roll by id or roll_id from storage and returns the updated roll list
 */
export function deleteStoredJumboRoll(rollIdOrId: string): JumboRoll[] {
  const rolls = getStoredJumboRolls();
  const filtered = rolls.filter(r => r.id !== rollIdOrId && r.roll_id !== rollIdOrId);
  saveStoredJumboRolls(filtered);
  return filtered;
}

/**
 * Deletes all jumbo rolls from storage and returns empty roll list
 */
export function deleteAllStoredJumboRolls(): JumboRoll[] {
  saveStoredJumboRolls([]);
  return [];
}

export function resetMetallizerDatabase(): void {
  saveStoredMetallizerSettings(DEFAULT_METALLIZER_SETTINGS);
  saveStoredJumboRolls(INITIAL_JUMBO_ROLLS);
  saveStoredMetallizerPlans([]);
  saveStoredJumboRequirements([]);
}
