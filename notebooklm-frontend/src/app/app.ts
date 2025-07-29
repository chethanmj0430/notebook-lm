import { Component, EventEmitter, Output, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PdfUpload } from "./pdf-upload/pdf-upload";
import { ChatInterface } from "./chat-interface/chat-interface";
import { CommonModule } from '@angular/common';
import { PdfViewer } from "./pdf-viewer/pdf-viewer";
import { ThemeService } from './services/theme-service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PdfUpload, ChatInterface, CommonModule, PdfViewer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  mobileMenuOpen = false;
  @Output() uploadNewFile = new EventEmitter<void>();
  currentTheme$!: Observable<'light' | 'dark'>;
  @ViewChild(ChatInterface) chatInterface!: ChatInterface;

  constructor(private themeService: ThemeService) {
    
      this.currentTheme$ = this.themeService.currentTheme$;
  }

  triggerClearChat(): void {
    this.chatInterface.clearChat();
  }

toggleMobileMenu() {
  this.mobileMenuOpen = !this.mobileMenuOpen;
}

  protected readonly title = signal('notebooklm-frontend');
   loadedPdfData: string | Uint8Array | null = null;

  onPdfLoaded(pdfData: string | Uint8Array | null): void {
    this.loadedPdfData = pdfData;
     console.log("PDF Data Loaded in App Component:", pdfData ? "Yes" : "No");
  }

  onUploadNewFileClick(): void {
    this.uploadNewFile.emit();
  }

    onUploadNewFile(): void {
    this.loadedPdfData = null;
    console.log("Upload New File triggered, clearing PDF data.");
  }

    toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
