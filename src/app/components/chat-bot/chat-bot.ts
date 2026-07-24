import { 
  Component, 
  ChangeDetectionStrategy, 
  signal, 
  computed, 
  ViewChild, 
  ElementRef, 
  inject, 
  effect 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from './ai.service';
import { DiseaseMetadata, RagSearchResult } from './rag.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  sources?: RagSearchResult[];
  type?: 'question' | 'answer' | 'system' | 'error';
  confidence?: number;
  liked?: boolean;
  disliked?: boolean;
}

export interface SuggestionChip {
  label: string;
  prompt: string;
}

@Component({
  selector: 'app-chat-bot',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-bot.html',
  styleUrl: './chat-bot.scss'
})
export class ChatBot {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('inputField') private inputField?: ElementRef<HTMLTextAreaElement>;

  private readonly aiService = inject(AiService);

  readonly isOpen = signal(false);
  readonly isFullscreen = signal(false);
  readonly isGenerating = signal(false);
  readonly isWaitingForFirstChunk = signal(false);
  readonly currentInput = signal('');
  readonly inputCharCount = computed(() => this.currentInput().length);
  readonly speakingMessageId = signal<string | null>(null);
  readonly selectedSource = signal<DiseaseMetadata | null>(null);
  
  readonly aiStatus = this.aiService.status;
  readonly aiProgress = this.aiService.loadProgress;
  readonly aiBytes = this.aiService.loadBytesText;
  readonly aiLoading = this.aiService.isLoading;
  readonly isRagEnabled = this.aiService.isRagEnabled;

  readonly messages = signal<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: 'Welcome to AeroWheat Assistant! I am specialized in diagnosing wheat health and providing treatment recommendations. How can I help with your crop today?',
      timestamp: new Date(),
      type: 'system',
      confidence: 1.0
    }
  ]);

  readonly suggestions = signal<SuggestionChip[]>([
    { label: '🌾 Rust Identification', prompt: 'How do I identify wheat rust symptoms?' },
    { label: '🍄 Fungal Treatment', prompt: 'What are the treatment options for fungal diseases?' },
    { label: '📋 Scouting Checklist', prompt: 'Give me a field scouting checklist for wheat.' },
    { label: '📚 Disease Library', prompt: 'What diseases are in your database?' }
  ]);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.scrollToBottom();
      }
    });
  }

  toggleRag(): void {
    this.aiService.toggleRag();
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(current => !current);
  }

  likeMessage(msgId: string): void {
    this.messages.update(list => {
      const newList = [...list];
      const msgIndex = newList.findIndex(m => m.id === msgId);
      if (msgIndex >= 0) {
        newList[msgIndex] = {
          ...newList[msgIndex],
          liked: !newList[msgIndex].liked,
          disliked: false
        };
      }
      return newList;
    });
  }

  dislikeMessage(msgId: string): void {
    this.messages.update(list => {
      const newList = [...list];
      const msgIndex = newList.findIndex(m => m.id === msgId);
      if (msgIndex >= 0) {
        newList[msgIndex] = {
          ...newList[msgIndex],
          disliked: !newList[msgIndex].disliked,
          liked: false
        };
      }
      return newList;
    });
  }

  openSourceDetails(source: DiseaseMetadata): void {
    this.selectedSource.set(source);
  }

  closeSourceDetails(): void {
    this.selectedSource.set(null);
  }

  speakMessage(msgId: string, text: string): void {
    if (!('speechSynthesis' in window)) return;

    if (this.speakingMessageId() === msgId) {
      window.speechSynthesis.cancel();
      this.speakingMessageId.set(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\*+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (this.speakingMessageId() === msgId) {
        this.speakingMessageId.set(null);
      }
    };
    utterance.onerror = () => {
      this.speakingMessageId.set(null);
    };

    this.speakingMessageId.set(msgId);
    window.speechSynthesis.speak(utterance);
  }

  clearChat(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.speakingMessageId.set(null);
    }
    this.messages.set([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        text: 'Chat history cleared. How else can I assist you with your wheat crop?',
        timestamp: new Date()
      }
    ]);
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  toggleChat(): void {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      this.aiService.init();
      setTimeout(() => {
        this.scrollToBottom();
        this.inputField?.nativeElement.focus();
      }, 100);
    }
  }

  closeChat(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.speakingMessageId.set(null);
    }
    this.isOpen.set(false);
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.currentInput.set(target.value);
    
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 150) + 'px';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
      
      if (this.inputField?.nativeElement) {
        this.inputField.nativeElement.style.height = 'auto';
      }
    } else if (event.key === 'Escape') {
      if (this.isFullscreen()) {
        this.toggleFullscreen();
      } else {
        this.closeChat();
      }
    }
  }

  async sendSuggestion(prompt: string): Promise<void> {
    this.currentInput.set(prompt);
    await this.sendMessage();
  }

  async sendMessage(): Promise<void> {
    const query = this.currentInput().trim();
    if (!query || this.isGenerating()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date()
    };
    this.messages.update(list => [...list, userMsg]);
    this.currentInput.set('');

    if (this.inputField?.nativeElement) {
      this.inputField.nativeElement.style.height = 'auto';
    }

    this.isGenerating.set(true);
    this.isWaitingForFirstChunk.set(true);
    this.scrollToBottom();

    try {
      const formattedForAi = this.messages().map(m => ({
        role: m.role,
        content: m.text
      }));

      const botId = `bot-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botId,
        role: 'assistant',
        text: '',
        timestamp: new Date()
      };
      
      this.messages.update(list => [...list, botMsg]);

      const generationResult = await this.aiService.generateResponseStream(
        formattedForAi,
        (chunk) => {
          this.isWaitingForFirstChunk.set(false);
          this.messages.update(list => {
            const newList = [...list];
            const msgIndex = newList.findIndex(m => m.id === botId);
            if (msgIndex >= 0) {
              newList[msgIndex] = {
                ...newList[msgIndex],
                text: newList[msgIndex].text + chunk
              };
            }
            return newList;
          });
          this.scrollToBottom();
        }
      );

      this.messages.update(list => {
        const newList = [...list];
        const msgIndex = newList.findIndex(m => m.id === botId);
        if (msgIndex >= 0) {
          newList[msgIndex] = {
            ...newList[msgIndex],
            text: generationResult.text,
            sources: generationResult.sources
          };
        }
        return newList;
      });

      this.updateFollowUpSuggestions(query, generationResult.text);

    } catch (err) {
      console.error('Chat error:', err);
      this.messages.update(list => [
        ...list,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'I encountered an error processing your query. Please ask about specific symptoms like rust, mildew, or blight.',
          timestamp: new Date()
        }
      ]);
    } finally {
      this.isGenerating.set(false);
      this.isWaitingForFirstChunk.set(false);
      this.scrollToBottom();
      setTimeout(() => {
        this.inputField?.nativeElement.focus();
      }, 50);
    }
  }

  private updateFollowUpSuggestions(userQuery: string, botReply: string): void {
    const q = userQuery.toLowerCase();
    const r = botReply.toLowerCase();

    const newChips: SuggestionChip[] = [];

    if (q.includes('rust') || r.includes('rust')) {
      newChips.push({ label: 'Fungicide Options', prompt: 'What specific fungicides treat wheat rust?' });
      newChips.push({ label: 'Stripe vs Leaf Rust', prompt: 'What is the difference between Stripe Rust and Leaf Rust?' });
      newChips.push({ label: 'Prevention Steps', prompt: 'How can I prevent wheat rust next season?' });
    } else if (q.includes('scout') || r.includes('scouting')) {
      newChips.push({ label: 'Early Detection', prompt: 'What are early warning symptoms during leaf inspection?' });
      newChips.push({ label: 'Fungal vs Bacterial', prompt: 'How do I differentiate fungal lesions from bacterial leaf streaks?' });
    } else if (q.includes('blight') || r.includes('fusarium')) {
      newChips.push({ label: 'Fusarium Risk', prompt: 'What weather conditions increase Fusarium Head Blight risk?' });
      newChips.push({ label: 'Harvest Safety', prompt: 'Is wheat with Fusarium Head Blight safe to harvest?' });
    } else {
      newChips.push({ label: 'Chemical Treatment', prompt: 'What fungicides are recommended for wheat diseases?' });
      newChips.push({ label: 'Organic Management', prompt: 'Are there organic disease management practices for wheat?' });
      newChips.push({ label: 'Scouting Checklist', prompt: 'Provide a field scouting checklist.' });
    }

    this.suggestions.set(newChips);
  }

  formatScore(score: number): string {
    return Math.round(score * 100) + '%';
  }

  getChipIcon(label: string): string {
    const match = label.match(/^(\S+)/);
    return match ? match[1] : '💡';
  }

  getChipText(label: string): string {
    return label.replace(/^\S+\s*/, '');
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageText(text: string): string {
    if (!text) return '';
    let safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/^[•\-*]\s*(.*)$/gm, '• $1');
    safe = safe.replace(/\n/g, '<br>');
    
    return safe;
  }
}
