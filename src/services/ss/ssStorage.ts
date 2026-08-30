import { SSJumboRoll, SSMachineSettings, SSPlan, SSJumboRequirement, JumboRoll, MetallizerMachineSettings, MetallizerPlan, JumboRequirement } from '../../types/ss';
import { DEFAULT_SS_SETTINGS, INITIAL_SS_JUMBO_ROLLS, calculateJumboWeight } from './ssMasterData';

const SS_STORAGE_KEYS = {
  SETTINGS: 'gpak_ss_settings_v1',
  ROLLS: 'gpak_ss_jumbo_rolls_v1',
  PLANS: 'gpak_ss_plans_v1',
  REQUIREMENTS: 'gpak_ss_requirements_v1',
};

const isStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};

export function getStoredSSSettings(): SSMachineSettings {
  try {
    if (isStorageAvailable()) {
      const raw = localStorage.getItem(SS_STORAGE_KEYS.SETTINGS);
      if (raw) return JSON.parse(raw);
      saveStoredSSSettings(DEFAULT_SS_SETTINGS);
    }
  } catch (e) {
    console.error('Error reading SS settings:', e);
  }
  return DEFAULT_SS_SETTINGS;
}

export function saveStoredSSSettings(settings: SSMachineSettings): void {
  try {
    if (isStorageAvailable()) {
      localStorage.setItem(SS_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  } catch (e) {
    console.error('Error saving SS settings:', e);
  }
}

// Aliases for compatibility
export const getStoredMetallizerSettings = getStoredSSSettings;
export const saveStoredMetallizerSettings = saveStoredSSSettings;

export function getStoredSSJumboRolls(): SSJumboRoll[] {
  try {
    if (isStorageAvailable()) {
      const raw = localStorage.getItem(SS_STORAGE_KEYS.ROLLS);
      if (raw) return JSON.parse(raw);
      saveStoredSSJumboRolls(INITIAL_SS_JUMBO_ROLLS);
    }
  } catch (e) {
    console.error('Error reading SS jumbo rolls:', e);
  }
  return INITIAL_SS_JUMBO_ROLLS;
}

export function saveStoredSSJumboRolls(rolls: SSJumboRoll[]): void {
  try {
    if (isStorageAvailable()) {
      localStorage.setItem(SS_STORAGE_KEYS.ROLLS, JSON.stringify(rolls));
    }
  } catch (e) {
    console.error('Error saving SS jumbo rolls:', e);
  }
}

export const getStoredJumboRolls = getStoredSSJumboRolls;
export const saveStoredJumboRolls = saveStoredSSJumboRolls;

export function getStoredSSPlans(): SSPlan[] {
  try {
    if (isStorageAvailable()) {
      const raw = localStorage.getItem(SS_STORAGE_KEYS.PLANS);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading SS plans:', e);
  }
  return [];
}

export function saveStoredSSPlans(plans: SSPlan[]): void {
  try {
    if (isStorageAvailable()) {
      localStorage.setItem(SS_STORAGE_KEYS.PLANS, JSON.stringify(plans));
    }
  } catch (e) {
    console.error('Error saving SS plans:', e);
  }
}

export const getStoredMetallizerPlans = getStoredSSPlans;
export const saveStoredMetallizerPlans = saveStoredSSPlans;

export function getStoredSSJumboRequirements(): SSJumboRequirement[] {
  try {
    if (isStorageAvailable()) {
      const raw = localStorage.getItem(SS_STORAGE_KEYS.REQUIREMENTS);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading SS jumbo requirements:', e);
  }
  return [];
}

export function saveStoredSSJumboRequirements(reqs: SSJumboRequirement[]): void {
  try {
    if (isStorageAvailable()) {
      localStorage.setItem(SS_STORAGE_KEYS.REQUIREMENTS, JSON.stringify(reqs));
    }
  } catch (e) {
    console.error('Error saving SS jumbo requirements:', e);
  }
}

export const getStoredJumboRequirements = getStoredSSJumboRequirements;
export const saveStoredJumboRequirements = saveStoredSSJumboRequirements;

export function consumeSSJumboRoll(
  rollIdOrDbId: string,
  planId: string,
  consumedLengthM: number
): { success: boolean; updatedRoll?: SSJumboRoll; error?: string } {
  const rolls = getStoredSSJumboRolls();
  const index = rolls.findIndex(r => r.id === rollIdOrDbId || r.roll_id === rollIdOrDbId);

  if (index === -1) {
    return { success: false, error: `Secondary Slitter Jumbo Roll ${rollIdOrDbId} not found in inventory.` };
  }

  const roll = rolls[index];
  if (roll.status === 'CONSUMED') {
    return { success: false, error: `Secondary Slitter Jumbo Roll ${roll.roll_id} has already been CONSUMED and cannot be reused.` };
  }

  const newRemainingLength = Math.max(0, roll.remaining_length_m - consumedLengthM);
  const newStatus = newRemainingLength <= 0 ? 'CONSUMED' : 'PARTIALLY_CONSUMED';
  const newRemainingKg = calculateJumboWeight(roll.width_mm, roll.thickness_micron, roll.density, newRemainingLength);

  const updatedRoll: SSJumboRoll = {
    ...roll,
    remaining_length_m: newRemainingLength,
    remaining_quantity_kg: newRemainingKg,
    status: newStatus,
    consumed_by_plan: planId,
    updated_at: new Date().toISOString(),
  };

  rolls[index] = updatedRoll;
  saveStoredSSJumboRolls(rolls);

  return { success: true, updatedRoll };
}

export const consumeJumboRoll = consumeSSJumboRoll;

/**
 * Updates a single jumbo roll in storage and returns the updated roll list
 */
export function updateStoredSSJumboRoll(updatedRoll: SSJumboRoll): SSJumboRoll[] {
  const rolls = getStoredSSJumboRolls();
  const index = rolls.findIndex(r => r.id === updatedRoll.id || r.roll_id === updatedRoll.roll_id);
  if (index !== -1) {
    rolls[index] = {
      ...updatedRoll,
      updated_at: new Date().toISOString(),
    };
  } else {
    rolls.push(updatedRoll);
  }
  saveStoredSSJumboRolls(rolls);
  return rolls;
}

export const updateStoredJumboRoll = updateStoredSSJumboRoll;

/**
 * Deletes a single jumbo roll by id or roll_id from storage and returns the updated roll list
 */
export function deleteStoredSSJumboRoll(rollIdOrId: string): SSJumboRoll[] {
  const rolls = getStoredSSJumboRolls();
  const filtered = rolls.filter(r => r.id !== rollIdOrId && r.roll_id !== rollIdOrId);
  saveStoredSSJumboRolls(filtered);
  return filtered;
}

export const deleteStoredJumboRoll = deleteStoredSSJumboRoll;

/**
 * Deletes all jumbo rolls from storage and returns empty roll list
 */
export function deleteAllStoredSSJumboRolls(): SSJumboRoll[] {
  saveStoredSSJumboRolls([]);
  return [];
}

export const deleteAllStoredJumboRolls = deleteAllStoredSSJumboRolls;

export function resetSSDatabase(): void {
  saveStoredSSSettings(DEFAULT_SS_SETTINGS);
  saveStoredSSJumboRolls(INITIAL_SS_JUMBO_ROLLS);
  saveStoredSSPlans([]);
  saveStoredSSJumboRequirements([]);
}

export const resetMetallizerDatabase = resetSSDatabase;
