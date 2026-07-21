import { StubToxicityClassifier } from '../ml/classifier';
import type { Filter } from './types';

// Kept for forward-compat. The UI does not expose this until a real on-device model ships.
const classifier = new StubToxicityClassifier();

export const mlFilter: Filter = {
  id: 'ml',
  enabled: (s) => s.filters.ml,
  check() {
    void classifier.ready();
    return { blocked: false };
  }
};
