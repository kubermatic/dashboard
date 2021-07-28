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
import {ApiService} from '@core/services/api';
import {Auth} from '@core/services/auth/service';
import {UserService} from '@core/services/user';
import {Cluster, OIDCParams} from '@shared/entity/cluster';
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
  oidcParams: OIDCParams;

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

    this._api
      .getClusterOIDCParams(this.projectID, this.cluster.id)
      .pipe(take(1))
      .subscribe(oidcParams => (this.oidcParams = oidcParams));
  }

  getKubeloginCommand(): string {
    const iu = this.oidcParams && this.oidcParams.issuerUrl ? this.oidcParams.issuerUrl : '<<ISSUER_URL>>';
    const ci = this.oidcParams && this.oidcParams.clientId ? this.oidcParams.clientId : '<<CLIENT_ID>>';
    const cs = this.oidcParams && this.oidcParams.clientSecret ? this.oidcParams.clientSecret : '<<CLIENT_SECRET>>';
    return `kubectl oidc-login setup --oidc-issuer-url=${iu} --oidc-client-id=${ci} --oidc-client-secret=${cs}`;
  }
}
