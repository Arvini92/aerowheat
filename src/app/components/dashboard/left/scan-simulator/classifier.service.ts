import { Injectable, signal } from '@angular/core';
import { pipeline, ImageClassificationPipeline } from '@huggingface/transformers';

@Injectable({
  providedIn: 'root'
})
export class ClassifierService {
  private classifier?: ImageClassificationPipeline;
  isLoading = signal(false);

  async loadModel() {
    if (this.classifier) return;
    this.isLoading.set(true);
    try {
      // Using a small MobileNetV4 or similar lightweight model
      // 'Xenova/mobilenetv4_conv_small.e500_ahead_r224_in1k' is small and efficient
      this.classifier = await pipeline('image-classification', 'Xenova/mobilenetv4_conv_small.e500_ahead_r224_in1k', {
        device: 'webgpu', // Fallback to wasm is automatic in transformers.js
      }) as ImageClassificationPipeline;
    } catch (err) {
      console.error('Failed to load MobileNet classifier:', err);
      // Fallback to wasm if webgpu fails (though pipeline usually handles it)
      this.classifier = await pipeline('image-classification', 'Xenova/mobilenetv4_conv_small.e500_ahead_r224_in1k') as ImageClassificationPipeline;
    } finally {
      this.isLoading.set(false);
    }
  }

  async isCrop(imageSrc: string): Promise<{ isCrop: boolean; label: string; confidence: number }> {
    if (!this.classifier) {
      await this.loadModel();
    }

    if (!this.classifier) {
      return { isCrop: true, label: 'unknown', confidence: 0 }; // Fallback if model fails to load
    }

    const results = await this.classifier(imageSrc);
    
    // MobileNet labels are ImageNet-based. 
    // We look for plant-related keywords: 'corn', 'ear', 'wheat', 'leaf', 'pot', 'greenhouse', 'plant', etc.
    const cropKeywords = [
      'corn', 'maize', 'ear', 'wheat', 'barley', 'grain', 'rye', 'oat', 
      'leaf', 'plant', 'vegetation', 'crop', 'agriculture', 'grass',
      'clover', 'alfalfa', 'soybean', 'stalk', 'hay', 'straw'
    ];

    const topResult = results[0] as { label: string; score: number };
    const label = topResult.label.toLowerCase();
    const confidence = topResult.score;

    const isMatch = cropKeywords.some(keyword => label.includes(keyword));

    // High confidence threshold for "is it a crop"
    return {
      isCrop: isMatch && confidence > 0.15,
      label: topResult.label,
      confidence: confidence
    };
  }
}
