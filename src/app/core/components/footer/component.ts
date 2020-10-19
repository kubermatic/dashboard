// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {AdminSettings, CustomLink, CustomLinkLocation, filterCustomLinks} from '@shared/entity/settings';
import {VersionInfo} from '@shared/entity/version-info';

@Component({
  selector: 'km-footer',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class FooterComponent {
  @Input() version: VersionInfo;
  @Input() settings: AdminSettings;
  @Input() customLinks: CustomLink[] = [];
  @Input() authenticated: boolean;

  constructor(private readonly _sanitizer: DomSanitizer) {}

  getCustomLinks(): CustomLink[] {
    const customLinks = this.authenticated ? this.settings.customLinks : this.customLinks;
    return filterCustomLinks(customLinks, CustomLinkLocation.Footer);
  }

  getBackgroundImageUrlStyle(link: CustomLink): SafeStyle {
    return this._sanitizer.sanitize(SecurityContext.STYLE, `url(${CustomLink.getIcon(link)})`);
  }

  getFilterStyle(): SafeStyle {
    return this.authenticated
      ? ''
      : this._sanitizer.bypassSecurityTrustStyle('invert(.25) brightness(100) contrast(100)');
  }
}
