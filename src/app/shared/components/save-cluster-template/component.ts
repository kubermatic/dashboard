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
import {MatDialogRef} from '@angular/material/dialog';
import {NodeData} from '@shared/model/NodeSpecChange';
import {Cluster} from '@shared/entity/cluster';
import {ClusterTemplate, ClusterTemplateScope} from '@shared/entity/cluster-template';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from '@core/services/user';
import {take} from 'rxjs/operators';
import {Member} from '@shared/entity/member';
import {ClusterTemplateService} from '@core/services/cluster-templates';

enum Control {
  Name = 'name',
  Scope = 'scope',
}

@Component({
  selector: 'km-cluster-from-template-dialog',
  templateUrl: './template.html',
})
export class SaveClusterTemplateDialogComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() nodeData: NodeData;
  @Input() projectID: string;
  scope = ClusterTemplateScope;
  control = Control;
  form: FormGroup;
  user: Member;

  constructor(
    public dialogRef: MatDialogRef<SaveClusterTemplateDialogComponent>,
    private readonly _clusterTemplateService: ClusterTemplateService,
    private readonly _userService: UserService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      [Control.Name]: new FormControl('', [Validators.required]),
      [Control.Scope]: new FormControl(ClusterTemplateScope.User, [Validators.required]),
    });

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.user = user));
  }

  save(): void {
    this._clusterTemplateService
      .create(this._getClusterTemplate(), this.projectID)
      .pipe(take(1))
      .subscribe(ct => this.dialogRef.close(ct));
  }

  private _getClusterTemplate(): ClusterTemplate {
    return {
      name: this.form.get(Control.Name).value,
      scope: this.form.get(Control.Scope).value,
      cluster: this.cluster,
      nodeDeployment: {
        name: this.nodeData.name,
        spec: {
          template: this.nodeData.spec,
          replicas: this.nodeData.count,
          dynamicConfig: this.nodeData.dynamicConfig,
        },
      },
    };
  }
}
