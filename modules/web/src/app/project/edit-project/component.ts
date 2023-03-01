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
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {GlobalModule} from '@core/services/global/module';
import {NotificationService} from '@core/services/notification';
import {DynamicModule} from '@app/dynamic/module-registry';
import {ResourceType} from '@shared/entity/common';
import {Project, ProjectModel} from '@shared/entity/project';
import _ from 'lodash';
import {ProjectService} from '@core/services/project';
import {Observable} from 'rxjs';
import {AsyncValidators} from '@shared/validators/async.validators';
import {QuotaService} from '@app/dynamic/enterprise/quotas/service';
import {QuotaDetails} from '@app/shared/entity/quota';
import {UserService} from '@app/core/services/user';
import {Member} from '@app/shared/entity/member';

enum Controls {
  Name = 'name',
  Labels = 'labels',
  CPUQuota = 'cpuQuota',
  MemoryQuota = 'memoryQuota',
  StorageQuota = 'storageQuota',
}

@Component({
  selector: 'km-edit-project',
  templateUrl: './template.html',
})
export class EditProjectComponent implements OnInit {
  @Input() project: Project;

  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  labels: object;
  form: FormGroup;
  projectQouta: QuotaDetails;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Project)];
  user: Member;
  isMember: boolean;
  readonly Controls = Controls;

  private _quotaService: QuotaService;

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _matDialogRef: MatDialogRef<EditProjectComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _userService: UserService
  ) {
    if (this.isEnterpriseEdition) {
      this._quotaService = GlobalModule.injector.get(QuotaService);
    }
  }

  ngOnInit(): void {
    this.labels = _.cloneDeep(this.project.labels);

    this._userService.currentUser.subscribe(user => (this.user = user));
    this._initForm();
  }

  getObservable(): Observable<Project> {
    const project: ProjectModel = {
      name: this.form?.controls?.name?.value,
      labels: this.labels,
    };

    // Remove nullified labels as project uses PUT endpoint, not PATCH, and labels component returns patch object.
    // TODO: Make the labels component customizable so it can return patch (current implementation)
    //  or entity (without nullified labels).
    // TODO: Implement and use PATCH endpoint for project edits.
    for (const label in project.labels) {
      if (Object.prototype.hasOwnProperty.call(project.labels, label) && project.labels[label] === null) {
        delete project.labels[label];
      }
    }

    return this._projectService.edit(this.project.id, project);
  }

  onNext(project: Project): void {
    this._matDialogRef.close(project);

    if (this.isEnterpriseEdition && this.user.isAdmin && this.projectQouta) {
      const quotaVariables = {
        cpu: this.form?.controls?.cpuQuota?.value,
        memory: this.form?.controls?.memoryQuota?.value,
        storage: this.form?.controls?.storageQuota?.value,
      };
      this._quotaService.updateQuota(this.projectQouta?.name, quotaVariables).subscribe();
    }
    this._notificationService.success(`Updated the ${this.project.name} project`);
  }

  private _initForm(): void {
    this.form = new FormGroup({
      [Controls.Name]: new FormControl(this.project.name, [Validators.required]),
      [Controls.Labels]: new FormControl(''),
      [Controls.CPUQuota]: new FormControl(''),
      [Controls.MemoryQuota]: new FormControl(''),
      [Controls.StorageQuota]: new FormControl(''),
    });

    this.isMember = !!this.user.projects?.find(project => project.id === this.project.id);

    if (this.isMember && this.isEnterpriseEdition) {
      this._quotaService.getProjectQuota(this.project.id).subscribe(quota => {
        if (quota) {
          this.projectQouta = quota;
          this.form.get(Controls.CPUQuota).setValue(this.projectQouta.quota.cpu);
          this.form.get(Controls.MemoryQuota).setValue(this.projectQouta.quota.memory);
          this.form.get(Controls.StorageQuota).setValue(this.projectQouta.quota.storage);
        }
      });
    }
  }
}
