// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ApplicationService} from '@core/services/application';
import {
  Application,
  ApplicationAnnotations,
  ApplicationDefinition,
  ApplicationNamespace,
  ApplicationSpec,
  ApplicationVersion,
} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';
import * as y from 'js-yaml';
import _ from 'lodash';
import {forkJoin, of, Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {isSystemApplication} from '@shared/entity/application';

enum Controls {
  Version = 'version',
  Name = 'name',
  AppInstallationNamespace = 'appInstallationNamespace',
  AppResourcesNamespace = 'appResourcesNamespace',
  Values = 'values',
}

@Component({
  selector: 'km-edit-application-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class EditApplicationDialogComponent implements OnInit, OnDestroy {
  readonly Controls = Controls;

  @Input() application: Application;
  @Input() installedApplications: Application[] = [];
  @Input() applicationDefinition: ApplicationDefinition;
  @Input() projectID: string;
  @Input() cluster: Cluster;

  form: FormGroup;
  valuesConfig = '';
  applicationMethod: string;
  selectedVersionSource: string;
  isValuesConfigValid = true;
  isLoadingDetails: boolean;
  isSystemApplication = isSystemApplication;

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<EditApplicationDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _applicationService: ApplicationService
  ) {}

  ngOnInit(): void {
    this._loadApplicationDetails();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onVersionChanged(version: string): void {
    const selectedVersion = this.applicationDefinition.spec.versions.find(item => item.version === version);
    this.selectedVersionSource = ApplicationVersion.getVersionSource(selectedVersion);
  }

  onValuesConfigChanged(value: string) {
    this.form.get(Controls.Values).setValue(value);
  }

  onValuesConfigValidityChanged(isValid: boolean) {
    this.isValuesConfigValid = isValid;
  }

  edit(): void {
    this.dialogRef.close(this._getApplicationPatch());
  }

  close(): void {
    this.dialogRef.close();
  }

  isEnforcedApplication(): boolean {
    return this.application?.annotations?.[ApplicationAnnotations.Enforce] === 'true';
  }

  private _loadApplicationDetails() {
    this.isLoadingDetails = true;
    forkJoin([
      this._applicationService.getApplicationDefinition(this.applicationDefinition.name),
      this.cluster?.id && this.application.creationTimestamp
        ? this._applicationService.getApplication(this.application, this.projectID, this.cluster.id)
        : of(undefined),
    ])
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingDetails = false))
      )
      .subscribe({
        next: ([appDef, application]) => {
          this.applicationDefinition = appDef;
          this.application = application || this.application;
          this._initForm();
        },
        error: _ => {},
      });
  }

  private _initForm(): void {
    if (!_.isEmpty(this.application.spec.valuesBlock)) {
      this.valuesConfig = this.application.spec.valuesBlock;
    } else if (!_.isEmpty(this.application.spec.values)) {
      this.valuesConfig = y.dump(this.application.spec.values);
    }
    this.form = this._builder.group({
      [Controls.Version]: this._builder.control(
        {
          value: this.application.spec.applicationRef?.version,
          disabled: this.isEnforcedApplication() ? true : isSystemApplication(this.application?.labels),
        },
        Validators.required
      ),
      [Controls.Values]: this._builder.control({
        value: this.valuesConfig,
        disabled: this.isEnforcedApplication(),
      }),
    });

    if (!this.application.creationTimestamp) {
      this.form.addControl(
        Controls.AppInstallationNamespace,
        this._builder.control(
          {
            value: this.application.namespace,
            disabled: this.isEnforcedApplication() ? true : isSystemApplication(this.application?.labels),
          },
          [KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]
        )
      );
      this.form.addControl(
        Controls.AppResourcesNamespace,
        this._builder.control(
          {
            value: this.application.spec.namespace?.name,
            disabled: this.isEnforcedApplication() ? true : isSystemApplication(this.application?.labels),
          },
          [KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]
        )
      );
      this.form.addControl(
        Controls.Name,
        this._builder.control(
          {
            value: this.application.name,
            disabled: this.isEnforcedApplication() ? true : isSystemApplication(this.application?.labels),
          },
          [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR, this._duplicateNameValidator()]
        )
      );
      this.form
        .get(Controls.AppResourcesNamespace)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(() => this.form.get(Controls.Name).updateValueAndValidity());
    }

    this.applicationMethod = this.applicationDefinition.spec?.method;
    this.onVersionChanged(this.application.spec.applicationRef?.version);
  }

  private _duplicateNameValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const namespace = this.form?.get(Controls.AppResourcesNamespace).value;
      const name = control.value;
      if (!namespace || !name) {
        return null;
      }
      const matchingApplication = this.installedApplications.find(
        application => application.name === name && application.spec.namespace.name === namespace
      );

      return matchingApplication ? {duplicate: true} : null;
    };
  }

  private _getApplicationPatch(): Application {
    let patch = {
      ...this.application,
      spec: {
        ...this.application.spec,
        valuesBlock: this.form.get(Controls.Values).value,
      } as ApplicationSpec,
    } as Application;

    if (!this.form.get(Controls.Version).disabled) {
      patch.spec.applicationRef.version = this.form.get(Controls.Version).value;
    }

    if (!this.application.creationTimestamp) {
      patch = {
        ...patch,
        name: this.form.get(Controls.Name).value,
        namespace: this.form.get(Controls.AppInstallationNamespace).value,
        spec: {
          ...patch.spec,
          namespace: {
            ...patch.spec.namespace,
            name: this.form.get(Controls.AppResourcesNamespace).value,
          } as ApplicationNamespace,
        } as ApplicationSpec,
      } as Application;
    }
    return patch;
  }
}
