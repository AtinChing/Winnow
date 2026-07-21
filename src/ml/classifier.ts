export interface ToxicityClassifier {
  ready(): Promise<void>;
  classify(text: string): Promise<{ toxic: boolean; score: number }>;
}

// V2 will bundle quantized model weights and run inference in a Worker or offscreen document.
// It must never download code or weights, and results will be cached by normalized text.
export class StubToxicityClassifier implements ToxicityClassifier {
  async ready(): Promise<void> {
    return;
  }

  async classify(_text: string): Promise<{ toxic: boolean; score: number }> {
    return { toxic: false, score: 0 };
  }
}
