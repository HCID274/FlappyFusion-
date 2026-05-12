import { THEME } from '../../theme.js';
import { createAtomEntity } from './atomBase.js';

export function createTritium(x, y) {
  return createAtomEntity('T', x, y, THEME.colors.tritium, 2);
}
