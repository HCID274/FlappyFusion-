import { THEME } from '../../theme.js';
import { createAtomEntity } from './atomBase.js';

export function createDeuterium(x, y) {
  return createAtomEntity('D', x, y, THEME.colors.deuterium, 1, 'atomD');
}
