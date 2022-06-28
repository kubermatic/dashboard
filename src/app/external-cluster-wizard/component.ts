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
import {ExternalClusterWizardService} from '@core/services/wizard/external-cluster-wizard';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {Project} from '@shared/entity/project';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ExternalWizardStep, StepRegistry, WizardSteps} from './config';

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
    private readonly _formBuilder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _wizard: ExternalClusterWizardService,
    private readonly _projectService: ProjectService,
    private readonly _notificationService: NotificationService,
    private _router: Router
  ) {}

  get steps(): ExternalWizardStep[] {
    return this._wizard.steps.filter(step => step.enabled);
  }

  get active(): ExternalWizardStep {
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
          return !this._externalClusterService.isEKSExternalStepValid;
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
    // Init steps for wizard
    this._wizard.steps = WizardSteps;
    this._wizard.stepper = this._stepper;
    this._initForm(this.steps);
    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.project = project));
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._externalClusterService.reset();
  }

  onNext(): void {
    this._stepper.next();
  }

  onCancel() {
    this._router.navigate(['/projects/' + this.project.id + '/clusters'], {
      fragment: `${ClusterListTab.ExternalCluster}`,
    });
  }

  onExternalProviderChanged(provider: ExternalClusterProvider) {
    this._externalClusterService.provider = provider;
  }

  getObservable(): Observable<any> {
    const createExternalClusterModel = this._externalClusterService.externalCluster;
    return this._externalClusterService
      .createExternalCluster(this.project.id, createExternalClusterModel)
      .pipe(takeUntil(this._unsubscribe));
  }

  onCreateSuccess(externalCluster: ExternalCluster): void {
    this._notificationService.success(`Created the ${externalCluster.name} external cluster`);
    this._router.navigate(['/projects/' + this.project.id + '/clusters'], {
      fragment: `${ClusterListTab.ExternalCluster}`,
    });
  }

  private _initForm(steps: ExternalWizardStep[]): void {
    const controls = {};
    steps.forEach(step => (controls[step.name] = this._formBuilder.control('')));
    this.form = this._formBuilder.group(controls);
  }
}
