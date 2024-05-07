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

import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Application} from '@shared/entity/application';
import {NodeData} from '@shared/model/NodeSpecChange';
import {Cluster} from '@shared/entity/cluster';
import {ClusterTemplate, ClusterTemplateScope, ClusterTemplateSSHKey} from '@shared/entity/cluster-template';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from '@core/services/user';
import {take} from 'rxjs/operators';
import {Member} from '@shared/entity/member';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {SSHKey} from '@shared/entity/ssh-key';
import _ from 'lodash';
import {Observable} from 'rxjs';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';
import {OPERATING_SYSTEM_PROFILE_ANNOTATION} from '@app/shared/entity/machine-deployment';

class SaveClusterTemplateDialogData {
  cluster: Cluster;
  nodeData: NodeData;
  sshKeys: SSHKey[];
  projectID: string;
  applications: Application[];
  name?: string;
  clusterTemplateID?: string;
  scope?: string;
}

enum Control {
  Name = 'name',
  Scope = 'scope',
}

@Component({
  selector: 'km-cluster-from-template-dialog',
  templateUrl: './template.html',
})
export class SaveClusterTemplateDialogComponent implements OnInit {
  scope = ClusterTemplateScope;
  control = Control;
  form: FormGroup;
  user: Member;
  operatingSystemProfileAnnotation = OPERATING_SYSTEM_PROFILE_ANNOTATION;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SaveClusterTemplateDialogData,
    public dialogRef: MatDialogRef<SaveClusterTemplateDialogComponent>,
    private readonly _clusterTemplateService: ClusterTemplateService,
    private readonly _userService: UserService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      [Control.Name]: new FormControl(this.data.name ?? '', [
        Validators.required,
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
      [Control.Scope]: new FormControl(this.data.scope ?? ClusterTemplateScope.User, [Validators.required]),
    });

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.user = user));
  }

  get showSSHKeyWarning(): boolean {
    return this.form.get(Control.Scope).value !== ClusterTemplateScope.Project && !_.isEmpty(this.data.sshKeys);
  }

  getObservable(): Observable<ClusterTemplate> {
    if (this.data.clusterTemplateID) {
      return this._clusterTemplateService
        .update(this._getClusterTemplate(), this.data.projectID, this.data.clusterTemplateID)
        .pipe(take(1));
    }
    return this._clusterTemplateService.create(this._getClusterTemplate(), this.data.projectID).pipe(take(1));
  }

  onNext(ct: ClusterTemplate): void {
    this.dialogRef.close(ct);
  }

  private _getClusterTemplate(): ClusterTemplate {
    let annotations = null;
    if (this.data.nodeData.operatingSystemProfile) {
      annotations = {
        [this.operatingSystemProfileAnnotation]: this.data.nodeData.operatingSystemProfile,
      };
    }

    return {
      name: this.form.get(Control.Name).value,
      scope: this.form.get(Control.Scope).value,
      cluster: this.data.cluster,
      nodeDeployment: {
        name: this.data.nodeData.name,
        annotations: annotations,
        spec: {
          template: this.data.nodeData.spec,
          replicas: this.data.nodeData.count,
          dynamicConfig: this.data.nodeData.dynamicConfig,
          minReplicas: this.data.nodeData.minReplicas,
          maxReplicas: this.data.nodeData.maxReplicas,
        },
      },
      userSshKeys: this._getClusterTemplateSSHKeys(),
      applications: this.data.applications,
    } as ClusterTemplate;
  }

  private _getClusterTemplateSSHKeys(): ClusterTemplateSSHKey[] {
    return this.data.sshKeys
      ? this.data.sshKeys.map(key => {
          return {name: key.name, id: key.id} as ClusterTemplateSSHKey;
        })
      : [];
  }
}
