import { Injectable, signal } from '@angular/core';
import { 
  AutoProcessor, 
  AutoTokenizer,
  AutoModel, 
  RawImage, 
  Processor, 
  PreTrainedModel,
  PreTrainedTokenizer
} from '@huggingface/transformers';

interface ClipOutput {
  logits_per_image: {
    data: Float32Array;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClassifierService {
  private processor?: Processor;
  private tokenizer?: PreTrainedTokenizer;
  private model?: PreTrainedModel;
  isLoading = signal(false);

  private readonly MODEL_NAME = 'Xenova/clip-vit-base-patch16';

  async loadModel(): Promise<void> {
    if (this.model && this.processor && this.tokenizer) return;
    this.isLoading.set(true);

    try {
      this.processor = await AutoProcessor.from_pretrained(this.MODEL_NAME);
      this.tokenizer = await AutoTokenizer.from_pretrained(this.MODEL_NAME);
      this.model = await AutoModel.from_pretrained(this.MODEL_NAME, { device: 'webgpu' });
    } catch (err) {
      console.warn('WebGPU loading failed, falling back to WASM:', err);
      try {
        this.model = await AutoModel.from_pretrained(this.MODEL_NAME, { device: 'wasm' });
      } catch (fallbackErr) {
        console.error('Failed to load CLIP classifier:', fallbackErr);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async isCrop(imageSrc: string): Promise<{ isCrop: boolean; label: string; confidence: number }> {
    if (!this.model || !this.processor || !this.tokenizer) {
      await this.loadModel();
    }

    if (!this.model || !this.processor || !this.tokenizer) {
      return { isCrop: true, label: 'unknown', confidence: 0 };
    }

    try {
      const image = await RawImage.fromURL(imageSrc);
      const text = [
        'a photo of a crop plant, leaf, or farm field', 
        'a photo of an object, furniture, or building structure'
      ];

      // 1. Process image features
      const imageInputs = await this.processor(image);
      
      // 2. Process text tokens
      const textInputs = await this.tokenizer(text, { padding: true, truncation: true });

      // 3. Combine both image and text tensor inputs for CLIP
      const inputs = {
        ...imageInputs,
        ...textInputs
      };

      const { logits_per_image } = (await this.model(inputs)) as unknown as ClipOutput;
      const rawLogits = Array.from(logits_per_image.data);
      
      // Compute Softmax over candidate text classes
      const maxLogit = Math.max(...rawLogits);
      const expScores = rawLogits.map(v => Math.exp(v - maxLogit));
      const sumExp = expScores.reduce((a, b) => a + b, 0);
      const probs = expScores.map(v => v / sumExp);

      const isCropMatch = probs[0] > probs[1];
      const confidence = probs[0];

      return {
        isCrop: isCropMatch && confidence > 0.6,
        label: isCropMatch ? 'crop plant / leaf' : 'non-plant',
        confidence
      };
    } catch (error) {
      console.error('Classification error:', error);
      // Fail-open fallback so UI scanning flow is not blocked
      return { isCrop: true, label: 'bypassed', confidence: 1.0 };
    }
  }
}