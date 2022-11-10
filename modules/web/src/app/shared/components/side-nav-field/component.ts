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

import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {View} from '@app/shared/entity/common';
import {shrinkGrow} from '@shared/animations/grow';

@Component({
  selector: 'km-side-nav-field',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [shrinkGrow],
})
export class SideNavFieldComponent {
  private _expanded = false;
  view = View;
  @Input() label = '';
  @Input() icon = '';

  constructor(private _router: Router) {}

  get expanded(): boolean {
    return this._expanded;
  }

  isExpandedActive(): boolean {
    switch (this.label) {
      case 'Resources':
        return this.checkUrl(View.Clusters) || this.checkUrl(View.ExternalClusters);
      case 'etcd Backups':
        return this.checkUrl(View.Backups) || this.checkUrl(View.Snapshots) || this.checkUrl(View.Restores);
      case 'Access':
        return (
          this.checkUrl(View.SSHKeys) ||
          this.checkUrl(View.Members) ||
          this.checkUrl(View.Groups) ||
          this.checkUrl(View.ServiceAccounts)
        );
      default:
        return false;
    }
  }

  checkUrl(url: string): boolean {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    if (url === View.Clusters) {
      return (
        (!!urlArray.find(x => x === url) && !urlArray.find(x => x === View.ExternalClusters)) ||
        !!urlArray.find(x => x === View.Wizard)
      );
    }
    return !!urlArray.find(x => x === url);
  }

  onClick(): void {
    this._expanded = !this._expanded;
  }
}
