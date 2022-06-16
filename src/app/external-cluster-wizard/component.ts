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
import {Router} from '@angular/router';
import {FormGroup} from '@angular/forms';
import {MatStepper} from '@angular/material/stepper';
import {Observable, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {ClusterListTab} from '@app/cluster/list/component';
import {ExternalWizardStep, StepRegistry, WizardSteps} from './config';
import {ExternalCluster, ExternalClusterProvider} from '@app/shared/entity/external-cluster';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {ExternalClusterWizardService} from '@core/services/wizard/external-cluster-wizard';
import {ProjectService} from '@core/services/project';
import {Project} from '@shared/entity/project';
import {NotificationService} from '@core/services/notification';

@Component({
  selector: 'km-external-cluster-wizard',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ExternalClusterWizardComponent implements OnInit, OnDestroy {
  readonly stepRegistry = StepRegistry;
  form: FormGroup;
  project = {} as Project;
  private readonly _unsubscribe = new Subject<void>();
  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;

  constructor(
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

  get invalid(): boolean {
    return this.form.get(this.active.name).invalid;
  }

  ngOnInit(): void {
    this._wizard.reset();

    // Init steps for wizard
    this._wizard.steps = WizardSteps;
    this._wizard.stepper = this._stepper;
    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.project = project));

    this._externalClusterService.providerChanges
      .pipe(filter(provider => !!provider))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._stepper.next();
      });
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onCancel() {
    this._router.navigate(['/projects/' + this.project.id + '/clusters'], {
      fragment: `${ClusterListTab.ExternalCluster}`,
    });
  }

  onExternalProviderSelected(provider: ExternalClusterProvider) {
    this._externalClusterService.provider = provider;
  }

  getObservable(): Observable<any> {
    const createExternalClusterModel = this._externalClusterService.externalCluster;
    return this._externalClusterService
      .createExternalCluster(this.project.id, createExternalClusterModel)
      .pipe(takeUntil(this._unsubscribe));
  }

  onNext(externalCluster: ExternalCluster): void {
    this._notificationService.success(`Created the ${externalCluster.name} external cluster`);
    this._router.navigate(['/projects/' + this.project.id + '/clusters'], {
      fragment: `${ClusterListTab.ExternalCluster}`,
    });
  }
}
