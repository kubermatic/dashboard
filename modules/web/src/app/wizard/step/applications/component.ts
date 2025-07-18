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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ClusterSpecService} from '@app/core/services/cluster-spec';
import {StepRegistry} from '@app/wizard/config';
import {StepBase} from '@app/wizard/step/base';
import {ApplicationService} from '@core/services/application';
import {WizardService} from '@core/services/wizard/wizard';
import {ApplicationsListView} from '@shared/components/application-list/component';
import {Application, ApplicationSettings, createApplicationInstallation} from '@shared/entity/application';
import _, {merge} from 'lodash';
import {forkJoin, takeUntil} from 'rxjs';

enum Controls {
  Applications = 'applications',
}

@Component({
  selector: 'km-wizard-applications-step',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ApplicationsStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ApplicationsStepComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class ApplicationsStepComponent extends StepBase implements OnInit, OnDestroy {
  readonly ApplicationsListView = ApplicationsListView;

  applications: Application[] = [];

  private _applicationSettings: ApplicationSettings;

  constructor(
    wizard: WizardService,
    private readonly _builder: FormBuilder,
    private readonly _applicationService: ApplicationService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super(wizard, StepRegistry.Applications);
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Applications]: this._builder.control(''),
    });

    this._applicationService
      .getApplicationSettings()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => (this._applicationSettings = settings));

    this.applications =
      this._applicationService.applications?.map(application => {
        if (!application.id) {
          application.id = `${application.name}/${application.spec.namespace.name}`;
        }
        if (application.creationTimestamp) {
          delete application.creationTimestamp;
        }
        return application;
      }) || [];

    merge(this._clusterSpecService.datacenterChanges, this._applicationService.applicationChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this.loadDefaultAndEnforcedApplications();
      });
  }

  private loadDefaultAndEnforcedApplications() {
    const defaultAndEnforcedApplications = this._applicationService.applicationDefinitions.filter(
      application => application.spec.default || application.spec.enforced
    );

    // Fetch individual application definitions and create ApplicationInstallations
    forkJoin(
      defaultAndEnforcedApplications.map(application =>
        this._applicationService.getApplicationDefinition(application.name)
      )
    ).subscribe(applicationDefinitions => {
      applicationDefinitions.forEach(appDef => {
        if (appDef.name === 'k8sgpt') {
          appDef.spec.enforced = true;
        }

        if (appDef.name === 'cert-manager') {
          appDef.spec.default = true;
        }

        const applicationInstallation = createApplicationInstallation(
          appDef,
          this._applicationSettings?.defaultNamespace
        );
        this.onApplicationAdded(applicationInstallation);
      });
    });
  }

  onApplicationAdded(application: Application): void {
    application.id = `${application.name}/${application.spec.namespace.name}`;
    this.applications = [...this.applications, application];
    this._onApplicationsChanged();
  }

  onApplicationUpdated(updatedApplication: Application): void {
    const oldApplication = this.applications.find(application => application.id === updatedApplication.id);
    if (oldApplication) {
      oldApplication.name = updatedApplication.name;
      oldApplication.namespace = updatedApplication.namespace;
      oldApplication.spec = updatedApplication.spec;
      oldApplication.id = `${updatedApplication.name}/${updatedApplication.spec.namespace.name}`;
    }
    this.applications = [...this.applications];
    this._onApplicationsChanged();
  }

  onApplicationDeleted(deletedApplication: Application): void {
    this.applications = this.applications.filter(application => application.id !== deletedApplication.id);
    this._onApplicationsChanged();
  }

  private _onApplicationsChanged() {
    this._applicationService.applications = this.applications.map(application => ({...application, id: null}));
  }
}
