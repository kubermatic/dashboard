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
import {
  Application,
  ApplicationDefinition,
  ApplicationNamespace,
  ApplicationRef,
  ApplicationSpec,
  ApplicationVersion,
} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Version = 'version',
  Name = 'name',
  Namespace = 'namespace',
  Values = 'values',
}

@Component({
  selector: 'km-edit-application-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EditApplicationDialogComponent implements OnInit, OnDestroy {
  readonly Controls = Controls;

  @Input() application: Application;
  @Input() installedApplications: Application[] = [];
  @Input() applicationDefinition: ApplicationDefinition;
  @Input() cluster: Cluster;

  form: FormGroup;
  valuesConfig = '';
  applicationMethod: string;
  selectedVersionSource: string;
  isValuesConfigValid = true;

  private readonly _unsubscribe = new Subject<void>();

  constructor(public dialogRef: MatDialogRef<EditApplicationDialogComponent>, private readonly _builder: FormBuilder) {}

  ngOnInit(): void {
    this._initForm();
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

  private _initForm(): void {
    this.valuesConfig = this.application.spec.values as string; // TODO: confirm it works on edit cluster page
    this.form = this._builder.group({
      [Controls.Values]: this._builder.control(this.valuesConfig),
    });
    if (!this.application.creationTimestamp) {
      this.form.addControl(
        Controls.Namespace,
        this._builder.control(this.application.spec.namespace?.name, [
          Validators.required,
          KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
        ])
      );
      this.form.addControl(
        Controls.Name,
        this._builder.control(this.application.name, [
          Validators.required,
          KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
          this._duplicateNameValidator(),
        ])
      );
      this.form.addControl(
        Controls.Version,
        this._builder.control(this.application.spec.applicationRef?.version, Validators.required)
      );
      this.applicationMethod = this.applicationDefinition.spec?.method;
      this.onVersionChanged(this.application.spec.applicationRef?.version);

      this.form
        .get(Controls.Namespace)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(() => this.form.get(Controls.Name).updateValueAndValidity());
    }
  }

  private _duplicateNameValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const namespace = this.form?.get(Controls.Namespace).value;
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
        values: this.form.get(Controls.Values).value,
      } as ApplicationSpec,
    } as Application;

    if (!this.application.creationTimestamp) {
      patch = {
        ...patch,
        name: this.form.get(Controls.Name).value,
        namespace: this.form.get(Controls.Namespace).value,
        spec: {
          ...patch.spec,
          applicationRef: {
            ...patch.spec.applicationRef,
            version: this.form.get(Controls.Version).value,
          } as ApplicationRef,
          namespace: {
            ...patch.spec.namespace,
            name: this.form.get(Controls.Namespace).value,
          } as ApplicationNamespace,
        } as ApplicationSpec,
      } as Application;
    }
    return patch;
  }
}
