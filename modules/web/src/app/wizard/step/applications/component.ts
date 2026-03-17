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
import {WizardMode} from '@app/wizard/types/wizard-mode';
import {ApplicationService} from '@core/services/application';
import {NodeDataService} from '@core/services/node-data/service';
import {WizardService} from '@core/services/wizard/wizard';
import {ApplicationsListView} from '@shared/components/application-list/component';
import {
  Application,
  ApplicationAnnotations,
  ApplicationDefinition,
  getApplicationVersion,
  CLUSTER_AUTOSCALING_APP_DEF_NAME,
  ApplicationSettings,
} from '@shared/entity/application';
import * as y from 'js-yaml';
import _ from 'lodash';
import {forkJoin, switchMap, of, takeUntil} from 'rxjs';

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
  wizardMode: WizardMode;

  private _applicationSettings: ApplicationSettings;

  constructor(
    wizard: WizardService,
    private readonly _builder: FormBuilder,
    private readonly _applicationService: ApplicationService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _nodeDataService: NodeDataService
  ) {
    super(wizard, StepRegistry.Applications);
  }

  ngOnInit(): void {
    this.wizardMode = window.history.state?.mode;

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
    this._loadDefaultAndEnforcedApplications();
    if (this.wizardMode !== WizardMode.CustomizeClusterTemplate && this.wizardMode !== WizardMode.EditClusterTemplate) {
      this._clusterSpecService.datacenterChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
        this._applicationService.applications = [];
        this.applications = [];
        this._loadDefaultAndEnforcedApplications();
      });

      this._nodeDataService.nodeDataChanges
        .pipe(takeUntil(this._unsubscribe))
        .pipe(
          switchMap(nodeData => {
            const clusterAutoscalingApp = this.applications.find(
              application => application.spec.applicationRef.name === CLUSTER_AUTOSCALING_APP_DEF_NAME
            );
            if (clusterAutoscalingApp) {
              if (!nodeData.enableClusterAutoscalingApp) {
                this.onApplicationDeleted(clusterAutoscalingApp);
              }
            } else if (nodeData.enableClusterAutoscalingApp) {
              return this._applicationService.getApplicationDefinition(CLUSTER_AUTOSCALING_APP_DEF_NAME);
            }
            return of(null);
          })
        )
        .subscribe(appDef => {
          if (appDef) {
            const application = this.createApplicationInstallation(appDef);
            this.onApplicationAdded(application);
          }
        });

      this._onApplicationsChanged();
    }
  }

  private _loadDefaultAndEnforcedApplications() {
    this._applicationService
      .listApplicationDefinitions()
      .pipe(
        switchMap(apps => {
          const defaultAndEnforcedApplications = apps.filter(application => {
            return (
              (application.spec.default || application.spec.enforced) &&
              (!application.spec.selector?.datacenters ||
                application.spec.selector?.datacenters?.includes(this._clusterSpecService.datacenter))
            );
          });
          return forkJoin(
            defaultAndEnforcedApplications.map(application =>
              this._applicationService.getApplicationDefinition(application.name)
            )
          );
        })
      )
      // Fetch individual application definitions and create ApplicationInstallations
      .subscribe(applicationDefinitions => {
        applicationDefinitions.forEach(appDef => {
          if (appDef.name === 'k8sgpt') {
            appDef.spec.enforced = true;
          }

          if (appDef.name === 'cert-manager') {
            appDef.spec.default = true;
          }

          const applicationInstallation = this.createApplicationInstallation(appDef);
          this.onApplicationAdded(applicationInstallation);
        });
      });
  }

  private createApplicationInstallation(appDef: ApplicationDefinition): Application {
    const applicationInstallation: Application = {
      name: appDef.name,
      namespace: this._applicationSettings?.defaultNamespace || appDef.name,
      labels: appDef.labels ? {...appDef.labels} : {},
      spec: {
        applicationRef: {
          name: appDef.name,
          version: getApplicationVersion(appDef),
        },
        namespace: appDef.spec.defaultNamespace || {
          name: appDef.name,
          create: true,
        },
      },
    };

    if (!_.isEmpty(appDef.spec.defaultValuesBlock)) {
      applicationInstallation.spec.valuesBlock = appDef.spec.defaultValuesBlock;
    } else if (!_.isEmpty(appDef.spec.defaultValues)) {
      applicationInstallation.spec.valuesBlock = y.dump(appDef.spec.defaultValues);
    } else {
      applicationInstallation.spec.valuesBlock = '';
    }

    const annotations = new Map<string, string>();
    if (appDef.spec.default) {
      annotations.set(ApplicationAnnotations.Default, 'true');
    }
    if (appDef.spec.enforced) {
      annotations.set(ApplicationAnnotations.Enforce, 'true');
    }
    applicationInstallation.annotations = Object.fromEntries(annotations);

    return applicationInstallation;
  }

  onApplicationAdded(application: Application): void {
    application.id = `${application.name}/${application.spec.namespace.name}`;
    if (this.applications.find(app => app.id === application.id)) {
      return;
    }
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
