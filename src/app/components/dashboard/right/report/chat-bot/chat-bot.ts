import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Rag } from './rag';

declare global {
  interface Window {
    ai?: {
      languageModel: {
        create: () => Promise<{ prompt: (text: string) => Promise<string> }>;
      };
    };
  }
}

@Component({
  selector: 'app-chat-bot',
  standalone: true,
  imports: [FormsModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-4 right-4 z-50">
      @if (isOpen()) {
        <div class="w-80 h-96 bg-white shadow-xl rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div class="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
            <h4 class="font-semibold text-slate-800">Gemma Assistant</h4>
            <button (click)="isOpen.set(false)" class="text-slate-500 hover:text-slate-800">✕</button>
          </div>
          <div class="flex-grow p-4 overflow-y-auto space-y-2">
            @for (msg of messages(); track msg.id) {
              <div [class]="'p-2 rounded-lg text-sm ' + (msg.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-slate-100')">
                {{ msg.content }}
              </div>
            }
          </div>
          <div class="p-2 border-t border-slate-200 flex">
            <input [(ngModel)]="input" (keyup.enter)="sendMessage()" class="flex-grow border rounded-l-lg p-2 text-sm" placeholder="Ask Gemma..." />
            <button (click)="sendMessage()" class="bg-blue-600 text-white rounded-r-lg px-4 text-sm">Send</button>
          </div>
        </div>
      } @else {
        <button (click)="isOpen.set(true)" class="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700">
          🤖
        </button>
      }
    </div>
  `
})
export class ChatBot implements OnInit {
  private ragService = inject(Rag);
  isOpen = signal(false);
  input = '';
  messages = signal<{ id: number, role: 'user' | 'model', content: string }[]>([]);
  private model: { prompt: (text: string) => Promise<string> } | null = null;

  async ngOnInit() {
    if (window.ai && window.ai.languageModel) {
      try {
        this.model = await window.ai.languageModel.create();
      } catch {
        console.error("Failed to initialize Gemma");
      }
    }
  }

  async sendMessage() {
    if (!this.input.trim()) return;
    const userMsg = this.input;
    this.messages.update(m => [...m, { id: Date.now(), role: 'user', content: userMsg }]);
    this.input = '';

    if (this.model) {
      try {
        const found = this.ragService.searchDisease(userMsg);
        let context = '';
        if (found.length > 0) {
            context = "Context: " + found.map(d => `${d.name}: ${d.desc} Symptoms: ${d.symptoms.join(', ')} Treatment: ${d.treatment.immediate}`).join('\n');
        }
        
        const response = await this.model.prompt(context ? `${context}\n\nQuestion: ${userMsg}` : userMsg);
        this.messages.update(m => [...m, { id: Date.now(), role: 'model', content: response }]);
      } catch {
        this.messages.update(m => [...m, { id: Date.now(), role: 'model', content: "Error: Could not generate response." }]);
      }
    } else {
        this.messages.update(m => [...m, { id: Date.now(), role: 'model', content: "window.ai not supported or Gemma model not available." }]);
    }
  }
}
