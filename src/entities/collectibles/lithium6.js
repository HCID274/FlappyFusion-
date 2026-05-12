import { THEME } from '../../theme.js';
import { createAtomEntity } from './atomBase.js';

export function createLithium6(x, y) {
  return createAtomEntity('Li6', x, y, THEME.colors.lithium6, 3, 'atomLi6', 'Li6');
}
