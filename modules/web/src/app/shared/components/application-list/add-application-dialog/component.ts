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
import {ApplicationService} from '@core/services/application';
import {
  Application,
  ApplicationDefinition,
  ApplicationLabel,
  ApplicationLabelValue,
  ApplicationNamespace,
  ApplicationRef,
  ApplicationSettings,
  ApplicationSpec,
  ApplicationVersion,
  getApplicationVersion,
} from '@shared/entity/application';
import {getEditionVersion} from '@shared/utils/common';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';
import * as y from 'js-yaml';
import _ from 'lodash';
import {Subject, Subscription} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';

enum Controls {
  Version = 'version',
  Name = 'name',
  AppInstallationNamespace = 'appInstallationNamespace',
  AppResourcesNamespace = 'appResourcesNamespace',
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
  isLoadingDetails: boolean;
  editionVersion: string = getEditionVersion();

  private readonly _unsubscribe = new Subject<void>();
  private _applicationSettings: ApplicationSettings;
  private _namespaceValueChangesSubscription$: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AddApplicationDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _applicationService: ApplicationService
  ) {}

  ngOnInit(): void {
    this.applicationDefsDataSource.data = this._allowedApplicationDefinitions;
    this.applicationDefsDataSource.filterPredicate = this._filter.bind(this);
    this.applicationDefsDataSource.filter = '';

    this._applicationService
      .getApplicationSettings()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => (this._applicationSettings = settings));
  }

  ngOnChanges(): void {
    this.applicationDefsDataSource.data = this._allowedApplicationDefinitions;
  }

  ngOnDestroy(): void {
    if (this._namespaceValueChangesSubscription$) {
      this._namespaceValueChangesSubscription$.unsubscribe();
    }
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSearchQueryChanged(query: string): void {
    this.applicationDefsDataSource.filter = query;
  }

  select(application: ApplicationDefinition): void {
    if (!this.selectedApplication || this.selectedApplication.name !== application.name) {
      this.selectedApplication = application;
      this._loadApplicationDefinitionDetails();
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
    this.dialogRef.close([this._getApplicationEntity(), this.selectedApplication]);
  }

  private get _allowedApplicationDefinitions() {
    return this.applicationDefinitions?.filter(
      appDef => !appDef.labels || appDef.labels[ApplicationLabel.ManagedBy] !== ApplicationLabelValue.KKP
    );
  }

  private _loadApplicationDefinitionDetails() {
    this.isLoadingDetails = true;
    this._applicationService
      .getApplicationDefinition(this.selectedApplication.name)
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingDetails = false))
      )
      .subscribe({
        next: appDef => {
          this.selectedApplication = appDef;
          this._initForm();
          this.applicationMethod = this.selectedApplication.spec?.method;
        },
        error: _ => {},
      });
  }

  private _initForm(): void {
    if (!_.isEmpty(this.selectedApplication.spec.defaultValuesBlock)) {
      this.valuesConfig = this.selectedApplication.spec.defaultValuesBlock;
    } else if (!_.isEmpty(this.selectedApplication.spec.defaultValues)) {
      try {
        this.valuesConfig = y.dump(this.selectedApplication.spec.defaultValues);
      } catch (e) {
        this.valuesConfig = '';
      }
    }
    const version = getApplicationVersion(this.selectedApplication);
    this.form = this._builder.group({
      [Controls.Version]: this._builder.control(version, Validators.required),
      [Controls.AppInstallationNamespace]: this._builder.control(
        this._applicationSettings.defaultNamespace || this.selectedApplication.name,
        [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]
      ),
      [Controls.Name]: this._builder.control(this.selectedApplication.name, [
        Validators.required,
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
        this._duplicateNameValidator(),
      ]),
      [Controls.AppResourcesNamespace]: this._builder.control(
        this.selectedApplication.spec.defaultNamespace?.name || this.selectedApplication.name,
        [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]
      ),
      [Controls.Values]: this._builder.control(this.valuesConfig),
    });

    if (version) {
      this.onVersionChanged(version);
    }

    if (this._namespaceValueChangesSubscription$) {
      this._namespaceValueChangesSubscription$.unsubscribe();
    }
    this._namespaceValueChangesSubscription$ = this.form
      .get(Controls.AppResourcesNamespace)
      .valueChanges.subscribe(() => this.form.get(Controls.Name).updateValueAndValidity());

    this.form.get(Controls.Name).markAsTouched();
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

  private _getApplicationEntity(): Application {
    return {
      name: this.form.get(Controls.Name).value,
      namespace: this.form.get(Controls.AppInstallationNamespace).value,
      spec: {
        applicationRef: {
          name: this.selectedApplication.name,
          version: this.form.get(Controls.Version).value,
        } as ApplicationRef,
        namespace:
          this.form.get(Controls.AppResourcesNamespace).value === this.selectedApplication.spec.defaultNamespace?.name
            ? this.selectedApplication.spec.defaultNamespace
            : ({
                name: this.form.get(Controls.AppResourcesNamespace).value,
                create: true,
              } as ApplicationNamespace),
        valuesBlock: this.form.get(Controls.Values).value,
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
}
