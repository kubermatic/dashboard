// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {ThemeInformerService} from '@core/services/theme-informer';
import {BrandingColors, BrandingConfig} from '@shared/model/Config';
import {BehaviorSubject} from 'rxjs';

const DEFAULTS = {
  logoUrl: '/assets/images/branding/logo.svg',
  productName: 'Kubermatic',
  tagline: 'Scale Apps with One Click',
};

@Injectable({providedIn: 'root'})
export class BrandingService {
  readonly logoUrl$ = new BehaviorSubject<string>(DEFAULTS.logoUrl);
  readonly shouldInvertLogo$ = new BehaviorSubject<boolean>(false);

  private _config: BrandingConfig = {};

  constructor(
    @Inject(DOCUMENT) private readonly _document: Document,
    private readonly _themeInformer: ThemeInformerService
  ) {}

  init(branding?: BrandingConfig): void {
    this._config = branding || {};

    this._applyFavicon();
    this._applyTitle();
    this._applyFont();
    this._applyBackground();
    this._applyColors();
    this._watchThemeForLogo();
  }

  getProductName(): string {
    return this._config.product_name || DEFAULTS.productName;
  }

  getProductUrl(): string {
    return this._config.product_url || 'https://www.kubermatic.com/';
  }

  getTagline(): string {
    return this._config.tagline || DEFAULTS.tagline;
  }

  get hideVersion(): boolean {
    return !!this._config.hide_version;
  }

  get hideDocumentationLinks(): boolean {
    return !!this._config.hide_documentation_links;
  }

  injectCustomCss(): void {
    if (!this._config.custom_css_url) {
      return;
    }
    const link = this._document.createElement('link');
    link.rel = 'stylesheet';
    link.href = this._config.custom_css_url;
    link.classList.add('km-custom-branding-css');
    this._document.head.appendChild(link);
  }

  private _applyFavicon(): void {
    if (!this._config.favicon_url) {
      return;
    }
    const el = this._document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (el) {
      el.href = this._config.favicon_url;
    }
  }

  private _applyTitle(): void {
    if (this._config.product_name) {
      this._document.title = this._config.product_name;
    }
  }

  private _applyFont(): void {
    if (this._config.font_url) {
      const link = this._document.createElement('link');
      link.rel = 'stylesheet';
      link.href = this._config.font_url;
      this._document.head.appendChild(link);
    }
    if (this._config.font_family) {
      this._document.documentElement.style.setProperty('--km-font-primary', this._config.font_family);
    }
  }

  private _applyBackground(): void {
    if (this._config.background_url) {
      this._document.documentElement.style.setProperty(
        '--km-background-image',
        `url('${this._config.background_url}')`
      );
    }
  }

  private _applyColors(): void {
    const colors: BrandingColors = this._config.colors || {};
    const root = this._document.documentElement.style;

    if (colors.primary) {
      root.setProperty('--km-color-primary', colors.primary);
      root.setProperty('--km-color-primary-hover', `color-mix(in srgb, ${colors.primary} 70%, black)`);
    }

    if (colors.secondary) {
      root.setProperty('--km-color-secondary', colors.secondary);
      root.setProperty('--km-color-secondary-hover', `color-mix(in srgb, ${colors.secondary} 70%, black)`);
    }

    if (colors.header_bg) {
      root.setProperty('--km-color-background-app-bar', colors.header_bg);
    }

    if (colors.header_text) {
      root.setProperty('--km-color-header-text', colors.header_text);
    }
  }

  private _watchThemeForLogo(): void {
    this._themeInformer.isCurrentThemeDark$.subscribe(isDark => {
      const logoUrl =
        isDark && this._config.logo_dark_url ? this._config.logo_dark_url : this._config.logo_url || DEFAULTS.logoUrl;
      this.logoUrl$.next(logoUrl);
      this.shouldInvertLogo$.next(isDark && !this._config.logo_dark_url && !this._config.logo_url);
    });
  }
}
