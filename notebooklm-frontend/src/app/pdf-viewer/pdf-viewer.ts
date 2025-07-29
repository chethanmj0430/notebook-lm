import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxExtendedPdfViewerModule } from "ngx-extended-pdf-viewer";
import { Observable } from 'rxjs';
import { ThemeService } from '../services/theme-service';

@Component({
  selector: 'app-pdf-viewer',
  imports: [NgxExtendedPdfViewerModule, CommonModule],
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.scss'
})
export class PdfViewer {
  @Input() pdfSrc: string | Uint8Array | null = null;
  @Output() uploadNewFile = new EventEmitter<void>();
  currentTheme$: Observable<'light' | 'dark'>;

  toolbarOptions = { 
    showHandToolButton: true,
    showOpenFileButton: false,
    showPrintButton: true,
    showDownloadButton: true,
    showPagingButtons: true,
    showZoomButtons: true,
    showPresentationModeButton: false,
    showSidebarButton: true,
    showBookmarkButton: false,
  };

  constructor(private themeService: ThemeService) { this.currentTheme$ = this.themeService.currentTheme$;}

  onUploadNewFileClick(): void {
    this.uploadNewFile.emit();
  }
}
