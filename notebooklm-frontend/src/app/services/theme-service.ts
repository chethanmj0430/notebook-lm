import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _renderer: Renderer2;
  private _currentTheme = new BehaviorSubject<'light' | 'dark'>(this.getInitialTheme());

  public currentTheme$: Observable<'light' | 'dark'> = this._currentTheme.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this._renderer = rendererFactory.createRenderer(null, null);
    this._renderer.addClass(document.body, `${this._currentTheme.value}-theme`);
  }

  private getInitialTheme(): 'light' | 'dark' {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  toggleTheme(): void {
    const newTheme = this._currentTheme.value === 'light' ? 'dark' : 'light';
    this._renderer.removeClass(document.body, `${this._currentTheme.value}-theme`);
    this._renderer.addClass(document.body, `${newTheme}-theme`);
    localStorage.setItem('theme', newTheme);
    this._currentTheme.next(newTheme);
  }
}
