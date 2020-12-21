// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MatStepper} from '@angular/material/stepper';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {NodeDataService} from '@app/node-data/service/service';
import {ClusterService} from '@core/services/cluster/service';
import {NotificationService} from '@core/services/notification/service';
import {ProjectService} from '@core/services/project/service';
import {Cluster} from '@shared/entity/cluster';
import {Project} from '@shared/entity/project';
import {SSHKey} from '@shared/entity/ssh-key';
import {CreateClusterModel} from '@shared/model/CreateClusterModel';
import {NodeData} from '@shared/model/NodeSpecChange';
import {ClusterService as ClusterModelService} from '@shared/services/cluster.service';
import {forkJoin, of, Subject} from 'rxjs';
import {switchMap, takeUntil, tap} from 'rxjs/operators';
import {StepRegistry, steps, WizardStep} from './config';
import {WizardService} from './service/wizard';

@Component({
  selector: 'km-wizard',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent implements OnInit, OnDestroy {
  form: FormGroup;
  project = {} as Project;
  creating = false;
  readonly stepRegistry = StepRegistry;

  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;

  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _projectService: ProjectService,
    private readonly _wizard: WizardService,
    private readonly _notificationService: NotificationService,
    private readonly _clusterModelService: ClusterModelService,
    private readonly _clusterService: ClusterService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _router: Router,
    private readonly _googleAnalyticsService: GoogleAnalyticsService
  ) {}

  get steps(): WizardStep[] {
    return this._wizard.steps.filter(step => step.enabled);
  }

  get active(): WizardStep {
    return this.steps[this._stepper.selectedIndex];
  }

  get first(): boolean {
    return this._stepper.selectedIndex === 0;
  }

  get last(): boolean {
    return this._stepper.selectedIndex === this.steps.length - 1;
  }

  get invalid(): boolean {
    return this.form.get(this.active.name).invalid;
  }

  ngOnInit(): void {
    // Init steps for wizard
    this._wizard.steps = steps;
    this._wizard.stepper = this._stepper;

    this._initForm(this.steps);
    this._wizard.stepsChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._initForm(this.steps));
    this._stepper.selectionChange.pipe(takeUntil(this._unsubscribe)).subscribe(selection => {
      if (selection.previouslySelectedIndex > selection.selectedIndex) {
        selection.previouslySelectedStep.reset();
      }
    });

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.project = project));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._wizard.reset();
  }

  create(): void {
    this.creating = true;
    let createdCluster: Cluster;
    const createCluster = this._getCreateClusterModel(
      this._clusterModelService.cluster,
      this._nodeDataService.nodeData
    );

    this._clusterService
      .create(this.project.id, createCluster)
      .pipe(
        tap(cluster => {
          this._notificationService.success(`The ${createCluster.cluster.name} cluster was created`);
          this._googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreated');
          createdCluster = cluster;
        })
      )
      .pipe(switchMap(_ => this._clusterService.cluster(this.project.id, createdCluster.id)))
      .pipe(
        switchMap(_ => {
          this.creating = false;

          if (this._clusterModelService.sshKeys.length > 0) {
            return forkJoin(
              this._clusterModelService.sshKeys.map(key =>
                this._clusterService.createSSHKey(this.project.id, createdCluster.id, key.id)
              )
            );
          }

          return of([]);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        (keys: SSHKey[]) => {
          this._router.navigate([`/projects/${this.project.id}/clusters/${createdCluster.id}`]);
          keys.forEach(key =>
            this._notificationService.success(
              `The ${key.name} SSH key was added to cluster ${createCluster.cluster.name}`
            )
          );
        },
        () => {
          this._notificationService.error(`Could not create the ${createCluster.cluster.name} cluster`);
          this._googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreationFailed');
          this.creating = false;
        }
      );
  }

  toStepID(step: WizardStep): string {
    return step.name.toLowerCase().replace(' ', '-');
  }

  private _getCreateClusterModel(cluster: Cluster, nodeData: NodeData): CreateClusterModel {
    return {
      cluster: {
        name: cluster.name,
        labels: cluster.labels,
        spec: cluster.spec,
        type: cluster.type,
        credential: cluster.credential,
      },
      nodeDeployment: {
        name: nodeData.name,
        spec: {
          template: nodeData.spec,
          replicas: nodeData.count,
          dynamicConfig: nodeData.dynamicConfig,
        },
      },
    };
  }

  private _initForm(steps: WizardStep[]): void {
    const controls = {};
    steps.forEach(step => (controls[step.name] = this._formBuilder.control('')));
    this.form = this._formBuilder.group(controls);
  }
}
