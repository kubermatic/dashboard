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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {ChangelogService} from '@core/services/changelog';
import {slideInOut} from '@shared/animations/slide';
import {Changelog, ChangelogCategory, ChangelogEntry} from '@shared/model/changelog';
import {compare} from '@shared/utils/common-utils';
import {of} from 'rxjs';
import {delay} from 'rxjs/operators';

@Component({
  selector: 'km-changelog',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  animations: [slideInOut],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogDialog implements OnInit {
  version: string;
  released: Date;
  categories: ChangelogCategory[] = [];
  saving = false;

  private _changelog: Changelog;

  get changelogURL(): URL {
    return this._changelog.externalChangelogURL;
  }

  constructor(
    private readonly _changelogService: ChangelogService,
    private readonly _configService: AppConfigService // private readonly _userService: UserService, // private readonly _matDialogRef: MatDialogRef<ChangelogDialog>
  ) {}

  ngOnInit(): void {
    this.released = new Date(this._configService.getGitVersion().date);
    this.version = this._configService.getGitVersion().humanReadable;
    this._changelog = this._changelogService.changelog;
    this.categories = this._changelog.entries
      .map(entry => entry.category)
      .filter((category, idx, arr) => arr.indexOf(category) === idx)
      .filter(category => Object.values(ChangelogCategory).indexOf(category) > -1)
      .sort((a, b) => compare(Changelog.priority(a), Changelog.priority(b)));
  }

  entries(category: ChangelogCategory): ChangelogEntry[] {
    return this._changelog.entries ? this._changelog.entries.filter(entry => entry.category === category) : [];
  }

  toDisplayName(category: string): string {
    return category.replace('-', ' ');
  }

  remember(): void {
    this.saving = true;
    of(true)
      .pipe(delay(60000))
      .subscribe({
        next: _ => {},
        error: _ => {},
        complete: () => (this.saving = false),
      });

    // this._userService
    //   .patchCurrentUserSettings({lastSeenChangelogVersion: this.version} as UserSettings)
    //   .pipe(take(1))
    //   .subscribe({
    //     next: _ => this._matDialogRef.close(),
    //     error: _ => {},
    //     complete: () => (this.saving = false),
    //   });
  }
}
