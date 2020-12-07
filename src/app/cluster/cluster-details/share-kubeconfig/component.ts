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
import {ApiService} from '@core/services/api/service';
import {Auth} from '@core/services/auth/service';
import {UserService} from '@core/services/user/service';
import {Cluster} from '@shared/entity/cluster';
import {take} from 'rxjs/operators';

@Component({
  selector: 'km-share-kubeconfig',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ShareKubeconfigComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() seed: string;
  @Input() projectID: string;
  private userID: string;
  kubeconfigLink: string;

  constructor(
    private readonly _api: ApiService,
    private readonly _auth: Auth,
    private readonly _userService: UserService
  ) {}

  ngOnInit(): void {
    if (this._auth.authenticated()) {
      this._userService.currentUser.pipe(take(1)).subscribe(user => {
        this.userID = user.id;
        this.kubeconfigLink = this._api.getShareKubeconfigURL(this.projectID, this.seed, this.cluster.id, this.userID);
      });
    }
  }
}
