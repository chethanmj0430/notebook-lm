import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PdfService } from '../services/pdf-service';

@Component({
  selector: 'app-pdf-upload',
  imports: [CommonModule],
  templateUrl: './pdf-upload.html',
  styleUrl: './pdf-upload.scss'
})
export class PdfUpload implements OnInit {
  isDragOver: boolean = false;
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  @Output() pdfLoaded = new EventEmitter<string | Uint8Array | null>();
  isUploading: boolean = false;
  uploadSuccess: boolean = false; 
  uploadError: string | null = null;
  
  constructor(private http: HttpClient, private pdfService: PdfService) { }

  ngOnInit(): void {
    this.selectedFile = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.uploadError = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.handleFile(inputElement.files[0]);
    }
  }

private handleFile(file: File): void {
  this.uploadError = null;
  this.uploadSuccess = false;

  if (file.type === 'application/pdf') {
    this.selectedFile = file;
    this.uploadProgress = 0;
    this.isUploading = true; 
    const reader = new FileReader();
    reader.onload = (e: any) => {
      let loadedPdfSrc: string | Uint8Array;
      if (e.target.result instanceof ArrayBuffer) {
        loadedPdfSrc = new Uint8Array(e.target.result);
      } else {
        loadedPdfSrc = e.target.result;
      }
      this.pdfLoaded.emit(loadedPdfSrc); 
    };
    reader.readAsArrayBuffer(file);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${environment.backendUrl}/upload-pdf`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / (event.total || 1));
        } else if (event.type === HttpEventType.Response) {

          console.log('PDF uploaded successfully to backend', event.body);
          this.isUploading = false;
          this.uploadSuccess = true;
          this.uploadProgress = 100;
          if (event.body && 'filename' in event.body) {
              this.pdfService.setPdfName(event.body.filename as string);
            }

        }
      },
      error: (err) => {
        console.error('Error uploading PDF to backend:', err);
        this.isUploading = false;
        this.uploadProgress = 0;
        this.selectedFile = null;
        this.pdfLoaded.emit(null);
        this.uploadError = `Failed to upload PDF to backend: ${err.message || err.error?.message || 'Unknown error'}`;
        this.uploadSuccess = false;
        this.pdfService.clearPdfName();
      }
    });

  } else {
    alert('Please upload a PDF file.');
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.isUploading = false;
    this.pdfLoaded.emit(null);
    this.uploadSuccess = false;
    this.pdfService.clearPdfName();
  }
}

}
