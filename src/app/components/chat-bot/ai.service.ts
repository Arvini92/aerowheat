import { Injectable, signal, inject } from '@angular/core';
import { pipeline, env, TextStreamer, TextGenerationPipeline } from '@huggingface/transformers';
import { DISEASE_DATABASE } from '../../data';
import { RagService, DiseaseMetadata, RagSearchResult } from './rag.service';

export interface GenerationStreamResult {
  text: string;
  sources: RagSearchResult[];
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly ragService = inject(RagService);
  private generator: TextGenerationPipeline | null = null;

  // Selected ONNX Model ID
  private readonly modelId = 'onnx-community/Qwen2.5-0.5B-Instruct';

  readonly isLoading = signal<boolean>(false);
  readonly isReady = signal<boolean>(false);
  readonly loadProgress = signal<number>(0);
  readonly loadBytesText = signal<string>('');
  readonly status = signal('Offline Ready');
  readonly isRagEnabled = signal<boolean>(true);

  private initPromise: Promise<void> | null = null;
  private initAttempted = false;

  constructor() {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    env.useCustomCache = false;
  }

  toggleRag(): boolean {
    const next = !this.isRagEnabled();
    this.isRagEnabled.set(next);
    return next;
  }

  init(): Promise<void> {
    if (this.generator || this.isReady() || this.initAttempted) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    if (this.generator || this.isReady()) {
      return;
    }

    this.initAttempted = true;
    this.isLoading.set(true);
    this.status.set('Checking local cache for model weights...');
    this.loadProgress.set(5);

    try {
      // Initialize vector RAG service alongside main LLM engine
      await this.ragService.init().catch(err => {
        console.log('RAG service initialization completed with fallback configuration');
      });

      const options = {
        device: 'webgpu',
        dtype: 'q4',
        progress_callback: (progress: { status: string; progress?: number; file?: string; loaded?: number; total?: number }) => {
          if (progress.status === 'initiate') {
            this.status.set(`Loading ${progress.file ?? 'weights'}...`);
          } else if ((progress.status === 'downloading' || progress.status === 'progress') && progress.progress !== undefined) {
            const pct = Math.round(progress.progress);
            this.loadProgress.set(pct);

            if (progress.loaded !== undefined && progress.total !== undefined && progress.total > 0) {
              const loadedMB = (progress.loaded / (1024 * 1024)).toFixed(1);
              const totalMB = (progress.total / (1024 * 1024)).toFixed(1);
              this.loadBytesText.set(`${loadedMB} MB / ${totalMB} MB`);
            } else if (progress.loaded !== undefined) {
              const loadedMB = (progress.loaded / (1024 * 1024)).toFixed(1);
              this.loadBytesText.set(`${loadedMB} MB`);
            }

            if (pct >= 100) {
              this.status.set(`Loaded ${progress.file ?? 'weights'} from cache`);
            } else {
              this.status.set(`Downloading weights (${progress.file ?? ''})`);
            }
          } else if (progress.status === 'done') {
            this.loadProgress.set(85);
            this.status.set('Model weights loaded from cache');
          } else if (progress.status === 'ready') {
            this.status.set('Compiling Execution Kernels...');
            this.loadProgress.set(90);
          }
        }
      };

      // Check if WebGPU is available before attempting to use it
      const hasWebGPU = 'gpu' in navigator;
      
      if (hasWebGPU) {
        try {
          this.generator = await pipeline('text-generation', this.modelId, options as any) as TextGenerationPipeline;
        } catch (gpuErr) {
          console.log('WebGPU text-generation not available, using CPU/WASM backend');
          this.generator = await pipeline('text-generation', this.modelId, {
            ...options,
            device: undefined
          } as any) as TextGenerationPipeline;
        }
      } else {
        // Use CPU/WASM by default if WebGPU is not available
        console.log('WebGPU not supported, using CPU/WASM backend for text generation');
        this.generator = await pipeline('text-generation', this.modelId, {
          ...options,
          device: undefined
        } as any) as TextGenerationPipeline;
      }

      if (this.generator?.tokenizer && !this.generator.tokenizer.chat_template) {
        this.generator.tokenizer.chat_template = 
          "{% for message in messages %}" +
          "{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>\n'}}" +
          "{% endfor %}" +
          "{% if add_generation_prompt %}" +
          "{{'<|im_start|>assistant\n'}}" +
          "{% endif %}";
      }

      this.isReady.set(true);
      this.loadProgress.set(100);
      this.status.set('Qwen 2.5 0.5B Online (ONNX WebGPU)');
    } catch (err) {
      console.warn('WebGPU/ONNX initialization failed:', err);
      this.isReady.set(false);
      this.status.set('Local Plant DB Engine Active');
    } finally {
      this.isLoading.set(false);
      if (!this.generator && !this.isReady()) {
        this.initPromise = null;
      }
    }
  }

  private _isGenerating = false;

  async generateResponseStream(
    messages: { role: string; content: string }[],
    onChunk: (chunk: string) => void,
    ragContext = ''
  ): Promise<GenerationStreamResult> {
    if (!this.generator && !this.initAttempted) {
      await this.init();
    }

    if (this._isGenerating) {
      throw new Error('Model is currently generating a response. Please wait.');
    }

    let activeRagContext = ragContext;
    let retrievedSources: RagSearchResult[] = [];

    if (this.isRagEnabled() && !activeRagContext) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content;
      if (lastUserMsg) {
        try {
          retrievedSources = await this.ragService.search(lastUserMsg, 3);
          if (retrievedSources && retrievedSources.length > 0) {
            activeRagContext = retrievedSources
              .map(
                (s) =>
                  `- ${s.metadata.disease_name} (Scientific: ${s.metadata.scientific_name}, Agent: ${s.metadata.causative_agent}, Alignment: ${s.metadata.yolo_class_alignment}): Symptoms: ${s.metadata.symptoms}`
              )
              .join('\n');
          }
        } catch (err) {
          console.warn('RAG search during AI generation failed:', err);
        }
      }
    }

    let resultText = '';

    if (this.generator) {
      this._isGenerating = true;
      try {
        const systemPrompt = this.getSystemContext(activeRagContext);

        const formattedMessages = [
          { role: 'system', content: systemPrompt },
          ...messages
        ];

        let accumulatedText = '';

        const streamer = new TextStreamer(this.generator.tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (tokenText: string) => {
            accumulatedText += tokenText;
            onChunk(tokenText);
          }
        });

        const output = await this.generator(formattedMessages, {
          max_new_tokens: 512,
          temperature: 0.6,
          top_p: 0.9,
          repetition_penalty: 1.2,
          do_sample: true,
          streamer
        });

        const fullText = Array.isArray(output) ? (output[0] as any)?.generated_text : accumulatedText;
        
        if (typeof fullText === 'string') {
          resultText = this.cleanQwenOutput(fullText);
        } else if (Array.isArray(fullText)) {
          const lastTurn = fullText[fullText.length - 1];
          resultText = this.cleanQwenOutput(lastTurn?.content || accumulatedText);
        } else {
          resultText = accumulatedText || 'Model returned an empty response.';
        }
      } catch (err: unknown) {
        console.error('Qwen 2.5 ONNX generation error:', err);
        resultText = await this.generateLocalDbResponse(messages, onChunk);
      } finally {
        this._isGenerating = false;
      }
    } else {
      // Fallback: Local Plant DB Engine when LLM generator is not available
      resultText = await this.generateLocalDbResponse(messages, onChunk);
    }

    return {
      text: resultText,
      sources: retrievedSources
    };
  }

  private async generateLocalDbResponse(
    messages: { role: string; content: string }[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content.trim() || '';
    const query = lastUserMsg.toLowerCase();

    let response = '';

    if (query.includes('library') || query.includes('database') || query.includes('what diseases') || query.includes('list')) {
      response = `**AeroWheat Plant Pathology Database (8 Cataloged Diseases):**\n\n` +
        DISEASE_DATABASE.map((d, i) => `**${i + 1}. ${d.name}** (*${d.scientific}*)\n` +
        `• Type: ${d.type.toUpperCase()} | Severity: ${d.severity}\n` +
        `• Target Anatomy: ${d.anatomy.join(', ')}\n` +
        `• Summary: ${d.desc}`).join('\n\n');
    } else if (query.includes('scout') || query.includes('checklist') || query.includes('field checklist')) {
      response = `**AeroWheat Field Scouting Checklist:**\n\n` +
        `**1. Head & Spike Inspection:**\n` +
        `• Check for premature bleaching of individual spikelets or whole heads (Fusarium Head Blight).\n` +
        `• Look for olive-black, dusty spore masses replacing grains (Loose Smut).\n\n` +
        `**2. Leaf Canopy Inspection:**\n` +
        `• Inspect for round orange-brown pustules that rub off easily (Leaf Rust).\n` +
        `• Look for bright yellow-orange pustules in linear stripes (Stripe Rust).\n` +
        `• Check for tan lens-shaped lesions with black pycnidia specks (Septoria Leaf Blotch).\n` +
        `• Check lower leaves for fluffy white or gray powdery patches (Powdery Mildew).\n\n` +
        `**3. Stem & Sheath Inspection:**\n` +
        `• Look for elongated reddish-brown rupturing pustules (Stem Rust).\n` +
        `• Check stem base for dark brown to coal-black discoloration.\n\n` +
        `**4. Crown & Root System:**\n` +
        `• Pull up stunted or bleached plants to inspect for brittle, blackened roots (Take-all Root Rot).`;
    } else {
      // Find matching disease in DISEASE_DATABASE by keyword match
      const matches = DISEASE_DATABASE.filter(d => 
        query.includes(d.id.replace('_', ' ')) ||
        query.includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().split(' ').some(word => word.length > 3 && query.includes(word)) ||
        d.symptoms.some(s => query.split(' ').some(qw => qw.length > 3 && s.toLowerCase().includes(qw)))
      );

      if (matches.length > 0) {
        response = matches.map(d => 
          `**${d.name}** (*${d.scientific}*)\n` +
          `**Severity:** ${d.severity} | **Target Anatomy:** ${d.anatomy.join(', ')}\n\n` +
          `**Description:** ${d.desc}\n\n` +
          `**Key Symptoms:**\n${d.symptoms.map(s => `• ${s}`).join('\n')}\n\n` +
          `**Treatment & Management:**\n` +
          `• **Immediate:** ${d.treatment.immediate}\n` +
          `• **Chemical:** ${d.treatment.chemical}\n` +
          `• **Organic:** ${d.treatment.organic}\n` +
          `• **Preventive:** ${d.treatment.preventive}\n\n` +
          `**Risk Factors:**\n${d.riskFactors.map(r => `• ${r}`).join('\n')}`
        ).join('\n\n---\n\n');
      } else {
        // Fallback search using RAG or general overview
        let ragHits: DiseaseMetadata[] = [];
        try {
          const ragResults = await this.ragService.search(lastUserMsg, 2);
          ragHits = ragResults.map(result => result.metadata);
        } catch {
          // ignore error if RAG index not built
        }

        if (ragHits.length > 0) {
          response = `**Local Knowledge Base Results:**\n\n` +
            ragHits.map(r => 
              `**${r.disease_name}** (*${r.scientific_name}*)\n` +
              `• **Causative Agent:** ${r.causative_agent}\n` +
              `• **Key Symptoms:** ${r.symptoms}`
            ).join('\n\n');
        } else {
          response = `I searched the AeroWheat local plant pathology database for your query.\n\n` +
            `**Cataloged Diseases in Database:**\n` +
            DISEASE_DATABASE.map(d => `• **${d.name}** (*${d.scientific}*): ${d.desc.slice(0, 110)}...`).join('\n') +
            `\n\n*Tip: Try asking about specific diseases (e.g. leaf rust, powdery mildew), symptoms (e.g. yellow stripes, bleached heads), or treatments.*`;
        }
      }
    }

    onChunk(response);
    return response;
  }

  async generateResponse(
    messages: { role: string; content: string }[],
    ragContext = ''
  ): Promise<string> {
    let fullResponse = '';
    return this.generateResponseStream(
      messages,
      (chunk) => {
        fullResponse += chunk;
      },
      ragContext
    )
      .then(() => fullResponse)
      .catch((err) => `Error generating response: ${err.message || err}`);
  }

  private cleanQwenOutput(text: string): string {
    return text
      .replace(/<\|im_start\|>(user|assistant|system)?/gi, '')
      .replace(/<\|im_end\|>/gi, '')
      .replace(/<\|endoftext\|>/gi, '')
      .trim();
  }

  private getSystemContext(ragContext = ''): string {
    let contextStr = '';
    if (ragContext) {
      contextStr = `\nRelevant knowledge retrieved for this query:\n${ragContext}\n`;
    } else {
      contextStr = `\nGeneral disease knowledge:\n${DISEASE_DATABASE.map((d) => `- ${d.name}: ${d.desc}`).join('\n')}\n`;
    }

    return `You are AeroWheat Assistant, an expert agronomist specialized in wheat health. Answer questions concisely using this context:${contextStr}`;
  }
}