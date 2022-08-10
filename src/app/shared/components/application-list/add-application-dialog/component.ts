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

import {Component, Input, OnChanges, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {MatStepper} from '@angular/material/stepper';
import {MatTableDataSource} from '@angular/material/table';
import {
  Application,
  ApplicationDefinition,
  ApplicationNamespace,
  ApplicationRef,
  ApplicationSpec,
  ApplicationVersion,
} from '@shared/entity/application';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';
import * as y from 'js-yaml';
import _ from 'lodash';
import {Subscription} from 'rxjs';

enum Controls {
  Version = 'version',
  Name = 'name',
  Namespace = 'namespace',
  Values = 'values',
}

enum StepRegistry {
  SelectApplication = 'Select Application',
  Settings = 'Settings',
  ApplicationValues = 'Application Values',
}

@Component({
  selector: 'km-add-application-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddApplicationDialogComponent implements OnInit, OnChanges, OnDestroy {
  readonly Controls = Controls;
  readonly StepRegistry = StepRegistry;

  @Input() installedApplications: Application[] = [];
  @Input() applicationDefinitions: ApplicationDefinition[] = [];
  @Input() applicationDefinitionsMap = new Map<string, ApplicationDefinition>();
  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;

  applicationDefsDataSource = new MatTableDataSource<ApplicationDefinition>();
  selectedApplication: ApplicationDefinition;
  form: FormGroup;
  valuesConfig = '';
  applicationMethod: string;
  selectedVersionSource: string;
  isValuesConfigValid = true;

  private _namespaceValueChangesSubscription$: Subscription;

  constructor(public dialogRef: MatDialogRef<AddApplicationDialogComponent>, private readonly _builder: FormBuilder) {}

  ngOnInit(): void {
    this.applicationDefsDataSource.data = this.applicationDefinitions;
    this.applicationDefsDataSource.filterPredicate = this._filter.bind(this);
    this.applicationDefsDataSource.filter = '';
  }

  ngOnChanges(): void {
    this.applicationDefsDataSource.data = this.applicationDefinitions;
  }

  ngOnDestroy(): void {
    if (this._namespaceValueChangesSubscription$) {
      this._namespaceValueChangesSubscription$.unsubscribe();
    }
  }

  onSearchQueryChanged(query: string): void {
    this.applicationDefsDataSource.filter = query;
  }

  select(application: ApplicationDefinition): void {
    if (!this.selectedApplication || this.selectedApplication.name !== application.name) {
      this.selectedApplication = application;
      this._initForm();
      this.applicationMethod = application.spec?.method;
    }
    this.next();
  }

  onVersionChanged(version: string): void {
    const selectedVersion = this.selectedApplication.spec.versions.find(item => item.version === version);
    this.selectedVersionSource = ApplicationVersion.getVersionSource(selectedVersion);
  }

  onValuesConfigChanged(value: string): void {
    this.form.get(Controls.Values).setValue(value);
  }

  onValuesConfigValidityChanged(isValid: boolean): void {
    this.isValuesConfigValid = isValid;
  }

  next(): void {
    this._stepper.next();
  }

  goBack(): void {
    this._stepper.previous();
  }

  add(): void {
    this.dialogRef.close(this._getApplicationEntity());
  }

  private _initForm(): void {
    this.valuesConfig = '';
    const version = this.selectedApplication.spec.versions[0]?.version;
    this.form = this._builder.group({
      [Controls.Version]: this._builder.control(version, Validators.required),
      [Controls.Namespace]: this._builder.control(this.selectedApplication.name, [
        Validators.required,
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
      [Controls.Name]: this._builder.control(this.selectedApplication.name, [
        Validators.required,
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
        this._duplicateNameValidator(),
      ]),
      [Controls.Values]: this._builder.control(''),
    });

    if (version) {
      this.onVersionChanged(version);
    }

    if (this._namespaceValueChangesSubscription$) {
      this._namespaceValueChangesSubscription$.unsubscribe();
    }
    this._namespaceValueChangesSubscription$ = this.form
      .get(Controls.Namespace)
      .valueChanges.subscribe(() => this.form.get(Controls.Name).updateValueAndValidity());
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

  private _getApplicationEntity(): Application {
    return {
      name: this.form.get(Controls.Name).value,
      namespace: this.form.get(Controls.Namespace).value,
      spec: {
        applicationRef: {
          name: this.selectedApplication.name,
          version: this.form.get(Controls.Version).value,
        } as ApplicationRef,
        namespace: {
          name: this.form.get(Controls.Namespace).value,
          create: true,
        } as ApplicationNamespace,
        values: this._getValueConfig(),
      } as ApplicationSpec,
    } as Application;
  }

  private _filter(applicationDefinition: ApplicationDefinition, query: string): boolean {
    query = query.toLowerCase();
    return (
      applicationDefinition.name.toLowerCase().includes(query) ||
      applicationDefinition.spec.description?.toLowerCase().includes(query)
    );
  }

  private _getValueConfig(): any {
    const raw = y.load(this.form.get(Controls.Values).value);
    return !_.isEmpty(raw) ? raw : {};
  }
}
