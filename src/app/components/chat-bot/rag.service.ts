import { Injectable } from '@angular/core';
import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

import { DISEASE_DATABASE } from '../../data';

export interface DiseaseMetadata {
  id: number;
  disease_name: string;
  scientific_name: string;
  causative_agent: string;
  yolo_class_alignment: string;
  symptoms: string;
}

export interface RagSearchResult {
  metadata: DiseaseMetadata;
  score: number;
}

@Injectable({
  providedIn: 'root'
})
export class RagService {
  private featureExtractor: FeatureExtractionPipeline | null = null;
  private vectors: Float32Array | null = null;
  private db: IDBDatabase | null = null;
  private vectorDim = 384;
  private numRecords = 0;

  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.vectors && this.db && this.featureExtractor) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    try {
      // 1. Load vectors into a raw Float32Array (minimal memory overhead)
      const buffer = await this.getOrCacheFile('rag_vectors.bin', '/rag/rag_vectors.bin');
      this.vectors = new Float32Array(buffer);
      this.numRecords = this.vectors.length / this.vectorDim;

      // 2. Initialize IndexedDB for metadata (0 RAM usage)
      this.db = await this.initIndexedDB();
      await this.ensureMetadataIndexed();

      // 3. Load Feature Extractor
      // Check if WebGPU is available before attempting to use it
      const hasWebGPU = 'gpu' in navigator;
      
      if (hasWebGPU) {
        this.featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
          device: 'webgpu'
        }).catch(async (err) => {
          // Silently fall back to CPU/WASM if WebGPU fails
          console.log('WebGPU not available, using CPU/WASM backend for feature extraction');
          return await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }) as FeatureExtractionPipeline;
      } else {
        // Use CPU/WASM by default if WebGPU is not available
        console.log('WebGPU not supported in this browser, using CPU/WASM backend');
        this.featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') as FeatureExtractionPipeline;
      }
    } catch (err) {
      console.log('RAG engine using fallback search (keyword-based matching)');
      this.initPromise = null;
    }
  }

  async search(query: string, topK = 3): Promise<RagSearchResult[]> {
    try {
      if (!this.vectors || !this.featureExtractor) await this.init();

      if (this.vectors && this.featureExtractor) {
        const output = await this.featureExtractor(query, { pooling: 'mean', normalize: true });
        const queryVector = Float32Array.from(output.data);

        const scores: { id: number; score: number }[] = [];
        for (let i = 0; i < this.numRecords; i++) {
          let dotProduct = 0;
          const offset = i * this.vectorDim;
          for (let j = 0; j < this.vectorDim; j++) {
            dotProduct += queryVector[j] * this.vectors[offset + j];
          }
          scores.push({ id: i, score: dotProduct });
        }

        scores.sort((a, b) => b.score - a.score);
        const top = scores.slice(0, topK);
        const metadataItems = await this.getMetadataByIds(top.map(s => s.id));

        return top
          .map((s, idx) => ({
            metadata: metadataItems[idx],
            score: Math.max(0.4, Math.min(0.99, s.score))
          }))
          .filter((item): item is RagSearchResult => Boolean(item.metadata));
      }
    } catch (err) {
      console.log('Using keyword-based search as fallback');
    }

    return this.fallbackSearch(query, topK);
  }

  private fallbackSearch(query: string, topK: number): RagSearchResult[] {
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(w => w.length > 2);

    const scored = DISEASE_DATABASE.map((d, index) => {
      let score = 0.35;
      const name = d.name.toLowerCase();
      const sci = d.scientific.toLowerCase();
      const desc = d.desc.toLowerCase();
      const symptoms = d.symptoms.join(' ').toLowerCase();

      if (name.includes(q)) score += 0.55;
      if (sci.includes(q)) score += 0.5;

      words.forEach(w => {
        if (name.includes(w)) score += 0.2;
        if (sci.includes(w)) score += 0.15;
        if (symptoms.includes(w)) score += 0.1;
        if (desc.includes(w)) score += 0.08;
      });

      const metadata: DiseaseMetadata = {
        id: index,
        disease_name: d.name,
        scientific_name: d.scientific,
        causative_agent: `${d.type.toUpperCase()} | Severity: ${d.severity}`,
        yolo_class_alignment: d.id,
        symptoms: d.symptoms.join(', ')
      };

      return { metadata, score: Math.min(0.98, Math.max(0.45, score)) };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  // --- IndexedDB Storage Logic ---

  private initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AeroWheatRAG', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async ensureMetadataIndexed(): Promise<void> {
    const count = await new Promise<number>((res) => {
      const tx = this.db!.transaction('metadata', 'readonly');
      const req = tx.objectStore('metadata').count();
      req.onsuccess = () => res(req.result);
    });

    if (count === 0) {
      console.log('Indexing metadata to IndexedDB...');
      const resp = await fetch('/rag/rag_metadata.json');
      if (!resp.ok) {
        throw new Error(`Failed to fetch /rag/rag_metadata.json: ${resp.status}`);
      }
      const items: DiseaseMetadata[] = await resp.json();

      const tx = this.db!.transaction('metadata', 'readwrite');
      const store = tx.objectStore('metadata');
      items.forEach(item => store.put(item));
      
      await new Promise(res => tx.oncomplete = res);
      console.log('Metadata indexed in IndexedDB. JSON freed from RAM.');
    }
  }

  private getMetadataByIds(ids: number[]): Promise<DiseaseMetadata[]> {
    return Promise.all(ids.map(id => new Promise<DiseaseMetadata>((resolve) => {
      const tx = this.db!.transaction('metadata', 'readonly');
      const req = tx.objectStore('metadata').get(id);
      req.onsuccess = () => resolve(req.result);
    })));
  }

  private async getOrCacheFile(fileName: string, fetchUrl: string): Promise<ArrayBuffer> {
    try {
      const root = await navigator.storage.getDirectory();
      try {
        const fileHandle = await root.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const buf = await file.arrayBuffer();
        if (buf.byteLength > 0 && buf.byteLength % 4 === 0) {
          return buf;
        }
        // If cached file is corrupted, remove it
        await root.removeEntry(fileName).catch(() => {});
      } catch {
        // Not cached yet
      }

      const resp = await fetch(fetchUrl);
      if (!resp.ok) {
        throw new Error(`Failed to fetch ${fetchUrl}: ${resp.status} ${resp.statusText}`);
      }
      const buf = await resp.arrayBuffer();
      if (buf.byteLength % 4 !== 0) {
        throw new Error(`Invalid binary file from ${fetchUrl}: byte length ${buf.byteLength} is not divisible by 4`);
      }

      try {
        const fileHandle = await root.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(buf);
        await writable.close();
      } catch (cacheErr) {
        console.warn('Could not write to OPFS cache:', cacheErr);
      }
      return buf;
    } catch (err) {
      console.error(`getOrCacheFile error for ${fileName}:`, err);
      throw err;
    }
  }
}