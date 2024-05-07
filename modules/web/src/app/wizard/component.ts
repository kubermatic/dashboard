// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatStepper} from '@angular/material/stepper';
import {ActivatedRoute, Router} from '@angular/router';
import {ClusterService} from '@core/services/cluster';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {NodeDataService} from '@core/services/node-data/service';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {WizardService} from '@core/services/wizard/wizard';
import {SaveClusterTemplateDialogComponent} from '@shared/components/save-cluster-template/component';
import {Cluster, CreateClusterModel, ExposeStrategy} from '@shared/entity/cluster';
import {Project} from '@shared/entity/project';
import {OPERATING_SYSTEM_PROFILE_ANNOTATION} from '@shared/entity/machine-deployment';
import {NodeData} from '@shared/model/NodeSpecChange';
import {Observable, Subject, take} from 'rxjs';
import {filter, startWith, switchMap, takeUntil} from 'rxjs/operators';
import {StepRegistry, steps, WizardStep} from './config';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {NameGeneratorService} from '@core/services/name-generator';
import {PathParam} from '@core/services/params';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {ApplicationService} from '@core/services/application';
import {Application} from '@shared/entity/application';
import {WizardMode} from './types/wizard-mode';
import {QuotaCalculationService} from '@app/dynamic/enterprise/quotas/services/quota-calculation';

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
  operatingSystemProfileAnnotation = OPERATING_SYSTEM_PROFILE_ANNOTATION;
  clusterTemplateID: string;
  wizardMode: WizardMode;
  loadingClusterTemplate = true;
  quotaExceededWarning: boolean;
  private clusterTemplate: ClusterTemplate;
  readonly stepRegistry = StepRegistry;

  private _stepper: MatStepper;
  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _projectService: ProjectService,
    private readonly _wizard: WizardService,
    private readonly _notificationService: NotificationService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _clusterService: ClusterService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _nodeDataService: NodeDataService,
    private readonly _matDialog: MatDialog,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _clusterTemplateService: ClusterTemplateService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly applicationService: ApplicationService,
    private readonly _quotaCalculationService: QuotaCalculationService
  ) {}

  @ViewChild('stepper')
  set matStepper(stepper: MatStepper) {
    if (stepper) {
      this._stepper = stepper;
      this.initializeWizard();
    }
  }

  get steps(): WizardStep[] {
    return steps
      .filter(step => step.enabled)
      .filter(step => !(this.clusterTemplateID && step.name === StepRegistry.Provider));
  }

  get active(): WizardStep {
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

  get showCreateClusterButton(): boolean {
    if (this.wizardMode) {
      return this.last && this.wizardMode === WizardMode.CustomizeClusterTemplate;
    }
    return this.last;
  }

  ngOnInit(): void {
    this._wizard.reset();
    this._initForm(this.steps);

    // Retrieve params
    this.clusterTemplateID = this._route.snapshot.queryParams?.clusterTemplateID;
    this.wizardMode = window.history.state?.mode;

    this.project.id = this._route.snapshot.paramMap.get(PathParam.ProjectID);

    if (this.clusterTemplateID) {
      this.loadClusterTemplate();
    } else {
      this.loadingClusterTemplate = false;
    }

    if (this.wizardMode === WizardMode.CustomizeClusterTemplate || !this.wizardMode) {
      this._quotaCalculationService
        .getQuotaExceed()
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(isQuotaExceeded => {
          this.quotaExceededWarning = isQuotaExceeded;
        });
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._wizard.reset();
  }

  getObservable(): Observable<Cluster> {
    const createCluster = this._getCreateClusterModel(
      this._clusterSpecService.cluster,
      this._nodeDataService.nodeData,
      this.applicationService.applications
    );

    return this._clusterService
      .create(this.project.id, createCluster)
      .pipe(switchMap(cluster => this._clusterService.cluster(this.project.id, cluster.id)))
      .pipe(takeUntil(this._unsubscribe));
  }

  onNext(cluster: Cluster): void {
    this.creating = true;
    this._notificationService.success(`Created the ${cluster.name} cluster`);

    if (this._clusterSpecService.sshKeys.length) {
      this._clusterSpecService.sshKeys.map(key => {
        this._clusterService
          .createSSHKey(this.project.id, cluster.id, key.id)
          .subscribe(_ =>
            this._notificationService.success(`Added the ${key.name} SSH key to the cluster ${cluster.name}`)
          );
      });
    }
    this._router.navigate([`/projects/${this.project.id}/clusters/${cluster.id}`]);
  }

  onSaveClusterTemplate(isPrimaryAction?: boolean): void {
    const isNewTemplate = !isPrimaryAction || (isPrimaryAction && this.wizardMode === WizardMode.CreateClusterTemplate);
    const createCluster = !isPrimaryAction && this.wizardMode === WizardMode.CreateClusterTemplate;

    const dialogConfig: MatDialogConfig = {
      data: {
        cluster: this._clusterSpecService.cluster,
        nodeData: this._nodeDataService.nodeData,
        sshKeys: this._clusterSpecService.sshKeys,
        projectID: this.project.id,
        applications: this.applicationService.applications,
      },
    };

    if (this.clusterTemplate) {
      dialogConfig.data.name = this.clusterTemplate.name;
      dialogConfig.data.clusterTemplateID =
        isPrimaryAction && this.wizardMode === WizardMode.EditClusterTemplate && this.clusterTemplate.id;
      dialogConfig.data.scope = this.clusterTemplate.scope;
    }

    this._matDialog
      .open(SaveClusterTemplateDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(ct => !!ct))
      .pipe(take(1))
      .subscribe(ct => {
        this._notificationService.success(`${isNewTemplate ? 'Saved' : 'Updated'} the ${ct.name} cluster template`);
        this._router.navigate([`/projects/${this.project.id}/clustertemplates`]);
        if (
          this.wizardMode === WizardMode.CreateClusterTemplate ||
          (this.wizardMode === WizardMode.EditClusterTemplate && !isNewTemplate)
        ) {
          this._router.navigate([`/projects/${this.project.id}/clustertemplates`], {
            state: createCluster
              ? {
                  createClusterFromTemplateID: ct.id,
                }
              : null,
          });
        }
      });
  }

  getSecondaryButtonLabel(): string {
    switch (this.wizardMode) {
      case WizardMode.CreateClusterTemplate:
        return 'Save Template and Create Cluster';
      case WizardMode.EditClusterTemplate:
        return 'Save as New Template';
      case WizardMode.CustomizeClusterTemplate:
        return 'Save as New Template';
      default:
        return 'Save Cluster Template';
    }
  }

  getPrimaryButtonLabel(): string {
    switch (this.wizardMode) {
      case WizardMode.CreateClusterTemplate:
        return 'Save Template';
      case WizardMode.EditClusterTemplate:
        return 'Save Changes to Template';
      case WizardMode.CustomizeClusterTemplate:
        return 'Create Cluster from Customized Template';
      default:
        return 'Create Cluster';
    }
  }

  getTitle(): string {
    switch (this.wizardMode) {
      case WizardMode.CreateClusterTemplate:
        return 'Create Cluster Template';
      case WizardMode.EditClusterTemplate:
        return 'Edit Cluster Template';
      case WizardMode.CustomizeClusterTemplate:
        return 'Customize Cluster Template';
      default:
        return 'Create Cluster';
    }
  }

  private _getCreateClusterModel(
    cluster: Cluster,
    nodeData: NodeData,
    applications: Application[]
  ): CreateClusterModel {
    const clusterModel: CreateClusterModel = {
      cluster: {
        name: cluster.name,
        labels: cluster.labels,
        spec: cluster.spec,
        credential: cluster.credential,
        annotations: cluster.annotations,
      },
      nodeDeployment: {
        name: nodeData.name,
        spec: {
          template: nodeData.spec,
          replicas: nodeData.count,
          dynamicConfig: nodeData.dynamicConfig,
          minReplicas: nodeData.minReplicas,
          maxReplicas: nodeData.maxReplicas,
        },
      },
      applications: applications,
    };
    if (cluster.spec.exposeStrategy !== ExposeStrategy.tunneling) {
      clusterModel.cluster.spec.clusterNetwork.tunnelingAgentIP = null;
    }
    if (nodeData.operatingSystemProfile) {
      clusterModel.nodeDeployment.annotations = {
        [this.operatingSystemProfileAnnotation]: nodeData.operatingSystemProfile,
      };
    }
    return clusterModel;
  }

  private initializeWizard(): void {
    // Init steps for wizard
    if (this.clusterTemplateID) {
      this._wizard.forceHandleProviderChange(this._clusterSpecService.provider);
    }
    this._wizard.steps = this.steps;
    this._wizard.stepper = this._stepper;

    this._initForm(this.steps);
    this._wizard.stepsChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._initForm(this.steps));
    this._stepper?.selectionChange.pipe(takeUntil(this._unsubscribe)).subscribe(selection => {
      if (selection.previouslySelectedIndex > selection.selectedIndex) {
        selection.previouslySelectedStep.reset();
      }
    });

    this._projectService.onProjectChange
      .pipe(startWith(this.project), takeUntil(this._unsubscribe))
      .subscribe(project => {
        // Template is already loaded at this point and we don't need to reload it unless the project ID has changed.
        if (this.clusterTemplateID && project.id !== this.project.id) {
          this.project = project;
          this.loadClusterTemplate();
        }
        this.project = project;
      });

    // After much evaluation, we found out that this is the best place to trigger this EventEmitter chaining. The only
    // other option is to do this inside each and every component and sub-component for the wizard step which doesn't
    // really make any sense.
    if (this.clusterTemplateID) {
      this._clusterSpecService.emitChangeEvents();
    }
  }

  private _initForm(steps: WizardStep[]): void {
    const controls = {};
    steps.forEach(step => (controls[step.name] = this._formBuilder.control('')));
    this.form = this._formBuilder.group(controls);
  }

  private loadClusterTemplate(): void {
    this._clusterTemplateService
      .get(this.project.id, this.clusterTemplateID)
      // We just need to load the cluster template once. Usage of `takeUntil` will cause an endless chain of update that
      // will keep on reloading and defaulting the values.
      .pipe(take(1))
      .subscribe(template => {
        // Load data into corresponding services.
        const namePrefix = this._nameGenerator.generateName();
        template.cluster.name = namePrefix + '-' + template.name;
        template.nodeDeployment.name = namePrefix;
        this._clusterSpecService.initializeClusterFromClusterTemplate(template);
        this._nodeDataService.initializeNodeDataFromMachineDeployment(template.nodeDeployment);
        this.applicationService.applications = template.applications;
        this.clusterTemplate = template;

        // Re-initialize the form.
        this.loadingClusterTemplate = false;
        this._cdr.detectChanges();
      });
  }
}
