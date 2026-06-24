import { StubToxicityClassifier } from '../ml/classifier';
import type { Filter } from './types';
const classifier = new StubToxicityClassifier();
export const mlFilter: Filter = { id: 'ml', enabled: (s) => s.filters.ml, check() { void classifier.ready(); return { blocked: false }; } };
