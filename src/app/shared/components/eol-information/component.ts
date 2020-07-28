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

import {Component, Input, OnInit} from '@angular/core';
import {AppConfigService} from '../../../app-config.service';
import {EndOfLife} from '../../model/Config';
import {lte, compare} from 'semver';

@Component({
  selector: 'km-eol-information',
  templateUrl: 'template.html',
})
export class EndOfLifeInformationComponent implements OnInit {
  @Input() version: string;

  private _eolConfig: EndOfLife;

  constructor(private readonly _appConfigService: AppConfigService) {}

  get eolVersion(): string {
    return Object.keys(this._eolConfig)
      .sort((v1, v2) => compare(v1, v2))
      .find(version => lte(this.version, version));
  }

  get eolDate(): Date {
    const version = this.eolVersion;
    const date = this._eolConfig[version];
    return date ? new Date(date) : undefined;
  }

  ngOnInit() {
    this._eolConfig = this._appConfigService.getConfig().end_of_life;
  }

  isAfterEOL(): boolean {
    const eol = this.eolDate;
    const now = new Date();

    return eol ? now > eol : false;
  }

  isBeforeEOL(): boolean {
    const eol = this.eolDate;
    const now = new Date();

    return eol ? now <= eol : false;
  }
}
