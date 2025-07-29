import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private readonly PDF_NAME_KEY = 'currentPdfName';
  private _currentPdfName = new BehaviorSubject<string | null>(null);

  public currentPdfName$: Observable<string | null> = this._currentPdfName.asObservable();
  private _newPdfUploaded = new Subject<void>();
  public newPdfUploaded$: Observable<void> = this._newPdfUploaded.asObservable();
  
  constructor() {}

  setPdfName(name: string): void {
    if (name) {
      localStorage.setItem(this.PDF_NAME_KEY, name);
    } else {
      localStorage.removeItem(this.PDF_NAME_KEY);
    }
    this._currentPdfName.next(name);
  }

getPdfName(): string | null {
    return this._currentPdfName.value;
  }

  clearPdfName(): void {
    localStorage.removeItem(this.PDF_NAME_KEY);
    this._currentPdfName.next(null);
  }

  notifyNewPdfUploaded(): void {
    this._newPdfUploaded.next();
  }
}
