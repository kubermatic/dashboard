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

import {Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {EndOfLife} from '@shared/model/Config';
import * as semver from 'semver';

@Injectable()
export class EndOfLifeService {
  readonly cluster = new ClusterTypeEndOfLife(this._appConfigService.getEndOfLifeConfig());

  constructor(private readonly _appConfigService: AppConfigService) {}
}

interface EndOfLifeChecker {
  isAfter(version: string): boolean;
  isBefore(version: string): boolean;

  findVersion(version: string): string;
  getDate(version: string): Date;
}

class ClusterTypeEndOfLife implements EndOfLifeChecker {
  constructor(private readonly _config: EndOfLife) {}

  findVersion(version: string): string {
    return Object.keys(this._config)
      .sort((v1, v2) => semver.compare(v1, v2))
      .find(v => semver.lte(version, v));
  }

  getDate(version: string): Date {
    const date = this._config[this.findVersion(version)];
    return date ? new Date(date) : undefined;
  }

  isAfter(version: string): boolean {
    const eol = this.getDate(version);
    const now = new Date();

    return eol ? now > eol : false;
  }

  isBefore(version: string): boolean {
    const eol = this.getDate(version);
    const now = new Date();

    return eol ? now <= eol : false;
  }
}
