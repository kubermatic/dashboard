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

import {Component, Input, OnInit} from '@angular/core';
import {Auth} from '@core/services/auth/service';
import {UserService} from '@core/services/user';
import {Cluster} from '@shared/entity/cluster';
import {take} from 'rxjs/operators';
import {ClusterService} from '@core/services/cluster';
import {getEditionVersion} from '@shared/utils/common';
import {MatDialogRef} from '@angular/material/dialog';

export enum ShareKubeconfigDialogTitle {
  Share = 'Share',
  Download = 'Download',
}
@Component({
  selector: 'km-share-kubeconfig',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class ShareKubeconfigComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() seed: string;
  @Input() projectID: string;
  @Input() dialogTitle: ShareKubeconfigDialogTitle;
  private _userID: string;
  readonly shareKubeconfigDialogTitle = ShareKubeconfigDialogTitle;
  readonly brewInstallCommand = 'brew install kubelogin';
  readonly chocoInstallCommand = 'choco install kubelogin';
  kubeconfigLink: string;
  editionVersion: string = getEditionVersion();
  isOIDCKubeLoginEnabled = false;
  buttonIcon: string;
  buttonLabel: string;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _auth: Auth,
    private readonly _userService: UserService,
    private readonly _matDialogRef: MatDialogRef<ShareKubeconfigComponent>
  ) {}

  ngOnInit(): void {
    this.buttonIcon = this.dialogTitle === ShareKubeconfigDialogTitle.Share ? 'km-icon-share' : 'km-icon-download';
    this.buttonLabel = this.dialogTitle === ShareKubeconfigDialogTitle.Share ? 'Share Cluster' : 'Get Kubeconfig';
    if (this._auth.authenticated()) {
      this._userService.currentUser.pipe(take(1)).subscribe(user => {
        this._userID = user.id;
        this.getDownloadLink();
      });
    }
  }

  getDownloadLink(): void {
    this.kubeconfigLink = this._clusterService.getShareKubeconfigURL(
      this.projectID,
      this.seed,
      this.cluster.id,
      this._userID,
      this.isOIDCKubeLoginEnabled
    );
  }

  onClick(): void {
    if (this.dialogTitle === ShareKubeconfigDialogTitle.Download) {
      window.open(this.kubeconfigLink, '_blank');
    }
    this._matDialogRef.close();
  }
}
