import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject } from '@angular/core';

import { RouterOutlet } from "@angular/router";
import { Header } from './components/header/header';
import { ChatBot } from './components/chat-bot/chat-bot';
import { AppState } from './services/app-state';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header,
    ChatBot
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly appState = inject(AppState);
}


