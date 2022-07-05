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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MatStepper} from '@angular/material/stepper';
import {Router} from '@angular/router';
import {ClusterListTab} from '@app/cluster/list/component';
import {ExternalCluster, ExternalClusterProvider} from '@app/shared/entity/external-cluster';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {ExternalClusterWizardService} from '@core/services/external-cluster-wizard/external-cluster-wizard';
import {ExternalClusterService} from '@core/services/external-cluster';
import {Project} from '@shared/entity/project';
import {Observable, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {ExternalClusterWizardStep, StepRegistry, WizardSteps} from './config';

@Component({
  selector: 'km-external-cluster-wizard',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ExternalClusterWizardComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly stepRegistry = StepRegistry;
  readonly externalProviders = [ExternalClusterProvider.EKS];
  form: FormGroup;
  project = {} as Project;

  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _wizard: ExternalClusterWizardService,
    private readonly _projectService: ProjectService,
    private readonly _notificationService: NotificationService,
    private readonly _router: Router
  ) {}

  get steps(): ExternalClusterWizardStep[] {
    return this._wizard.steps.filter(step => step.enabled);
  }

  get active(): ExternalClusterWizardStep {
    return this.steps[this._stepper.selectedIndex];
  }

  get stepperFirstIndex(): boolean {
    return this._stepper.selectedIndex === 0;
  }

  get stepperLastIndex(): boolean {
    return this._stepper.selectedIndex === this.steps.length - 1;
  }

  get isInvalidStep(): boolean {
    switch (this.active.name) {
      case StepRegistry.Provider:
        return !this._externalClusterService.provider;
      case StepRegistry.Credentials:
        return !this._externalClusterService.isCredentialsStepValid;
      case StepRegistry.ExternalClusterDetails:
        if (this.selectedProvider === ExternalClusterProvider.EKS) {
          return !this._externalClusterService.isClusterDetailsStepValid;
        }
        return false;
      default:
        return true;
    }
  }

  get isPresetSelected(): boolean {
    return !!this._externalClusterService.preset;
  }

  get isCredentialStepValid(): boolean {
    return this._externalClusterService.isCredentialsStepValid;
  }

  get selectedProvider(): string {
    return this._externalClusterService.provider;
  }

  ngOnInit(): void {
    this._wizard.reset();
    this._wizard.steps = WizardSteps;
    this._wizard.stepper = this._stepper;
    this._initForm(this.steps);
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._wizard.reset();
  }

  onNext(): void {
    this._stepper.next();
  }

  onCancel(): void {
    this._router.navigate(['projects', this.project.id, 'clusters'], {
      fragment: `${ClusterListTab.ExternalCluster}`,
    });
  }

  onProviderChanged(provider: ExternalClusterProvider): void {
    this._externalClusterService.provider = provider;
  }

  getObservable(): Observable<ExternalCluster> {
    const createExternalClusterModel = this._externalClusterService.externalCluster;
    return this._externalClusterService
      .createExternalCluster(this.project.id, createExternalClusterModel)
      .pipe(takeUntil(this._unsubscribe));
  }

  onCreateSuccess(externalCluster: ExternalCluster): void {
    this._notificationService.success(`Created the ${externalCluster.name} external cluster`);
    this._router.navigate(['projects', this.project.id, 'clusters'], {
      fragment: `${ClusterListTab.ExternalCluster}`,
    });
  }

  private _initForm(steps: ExternalClusterWizardStep[]): void {
    const controls = {};
    steps.forEach(step => (controls[step.name] = this._builder.control('')));
    this.form = this._builder.group(controls);
  }

  private _initSubscriptions() {
    this._externalClusterService.providerChanges
      .pipe(filter(provider => !!provider))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this.onNext();
      });

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.project = project));
  }
}
