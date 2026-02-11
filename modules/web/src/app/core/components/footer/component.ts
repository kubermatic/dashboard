// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Input, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {BrandingService} from '@core/services/branding';
import {AdminSettings, CustomLink} from '@shared/entity/settings';
import {VersionInfo} from '@shared/entity/version-info';

@Component({
  selector: 'km-footer',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  standalone: false,
})
export class FooterComponent {
  @Input() version: VersionInfo;
  @Input() settings: AdminSettings;
  @Input() customLinks: CustomLink[] = [];
  @Input() authenticated: boolean;

  constructor(
    private readonly _sanitizer: DomSanitizer,
    private readonly _brandingService: BrandingService
  ) {}

  get productName(): string {
    return this._brandingService.getProductName();
  }

  get productUrl(): string {
    return this._brandingService.getProductUrl();
  }

  get hideVersion(): boolean {
    return this._brandingService.hideVersion;
  }

  getCustomLinks(): CustomLink[] {
    return this.authenticated ? this.settings.customLinks : this.customLinks;
  }

  getBackgroundImage(link: CustomLink): SafeStyle {
    return this._sanitizer.sanitize(SecurityContext.STYLE, `url(${CustomLink.getIcon(link)})`);
  }

  getFilter(): SafeStyle {
    return this.authenticated
      ? ''
      : this._sanitizer.bypassSecurityTrustStyle('invert(.25) brightness(100) contrast(100)');
  }

  getVersion(): string {
    const isTag = !!this.version && this.version.distance === 0;
    return isTag ? this.version.tag : this.version.hash;
  }
}
