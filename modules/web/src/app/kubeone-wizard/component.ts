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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MatStepper} from '@angular/material/stepper';
import {ActivatedRoute, Router} from '@angular/router';
import {ExternalClusterService} from '@core/services/external-cluster';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';
import {KubeOneWizardService} from '@core/services/kubeone-wizard/wizard';
import {NotificationService} from '@core/services/notification';
import {PathParam} from '@core/services/params';
import {ProjectService} from '@core/services/project';
import {View} from '@shared/entity/common';
import {ExternalCloudSpec, ExternalCluster, ExternalClusterModel} from '@shared/entity/external-cluster';
import {KubeOneCloudSpec, KubeOneClusterSpec} from '@shared/entity/kubeone-cluster';
import {Project} from '@shared/entity/project';
import {encode, isValid} from 'js-base64';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {KubeOneWizardStep, StepRegistry, steps} from './config';

@Component({
    selector: 'km-kubeone-wizard',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class KubeOneWizardComponent implements OnInit, OnDestroy {
  readonly StepRegistry = StepRegistry;
  readonly View = View;

  form: FormGroup;
  project = {} as Project;
  creating = false;

  private _unsubscribe: Subject<void> = new Subject<void>();
  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _projectService: ProjectService,
    private readonly _wizard: KubeOneWizardService,
    private readonly _clusterSpecService: KubeOneClusterSpecService,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _notificationService: NotificationService,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute
  ) {}

  get steps(): KubeOneWizardStep[] {
    return this._wizard.steps.filter(step => step.enabled);
  }

  get active(): KubeOneWizardStep {
    return this._stepper ? this.steps[this._stepper.selectedIndex] : null;
  }

  get first(): boolean {
    return this._stepper ? this._stepper.selectedIndex === 0 : true;
  }

  get last(): boolean {
    return this._stepper ? this._stepper.selectedIndex === this.steps.length - 1 : false;
  }

  get invalid(): boolean {
    return this._stepper ? this.form.get(this.active.name).invalid : false;
  }

  ngOnInit(): void {
    this._wizard.reset();
    this._wizard.steps = steps;
    this._wizard.stepper = this._stepper;

    this.project.id = this._route.snapshot.paramMap.get(PathParam.ProjectID);

    this._initForm(this.steps);
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._wizard.reset();
  }

  getObservable(): Observable<any> {
    const createClusterModel = this._getCreateClusterModel();
    return this._externalClusterService
      .createExternalCluster(this.project.id, createClusterModel)
      .pipe(takeUntil(this._unsubscribe));
  }

  onNext(cluster: ExternalCluster): void {
    this.creating = true;
    this._notificationService.success('Imported the KubeOne cluster');
    this._router.navigate(['/projects', this.project.id, View.Clusters, View.KubeOneClusters, cluster.id]);
  }

  private _initForm(steps: KubeOneWizardStep[]): void {
    const controls = {};
    steps.forEach(step => (controls[step.name] = this._formBuilder.control('')));
    this.form = this._formBuilder.group(controls);
  }

  private _initSubscriptions(): void {
    this._wizard.stepsChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._initForm(this.steps));
    this._stepper?.selectionChange.pipe(takeUntil(this._unsubscribe)).subscribe(selection => {
      if (selection.previouslySelectedIndex > selection.selectedIndex) {
        selection.previouslySelectedStep.reset();
      }
    });

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.project = project));
  }

  private _getCreateClusterModel(): ExternalClusterModel {
    const clusterModel: ExternalClusterModel = {
      cloud: {
        kubeOne: {
          sshKey: {
            passphrase: this._clusterSpecService.cluster.cloud.kubeOne.sshKey.passphrase,
          },
          cloudSpec: {
            ...this._clusterSpecService.cluster.cloud.kubeOne.cloudSpec,
          } as KubeOneCloudSpec,
        } as KubeOneClusterSpec,
      } as ExternalCloudSpec,
    } as ExternalClusterModel;

    clusterModel.cloud.kubeOne.manifest = encode(this._clusterSpecService.cluster.cloud.kubeOne.manifest);
    const privateKey = this._clusterSpecService.cluster.cloud.kubeOne.sshKey.privateKey;
    clusterModel.cloud.kubeOne.sshKey.privateKey = isValid(privateKey) ? privateKey : encode(privateKey);

    return clusterModel;
  }
}
