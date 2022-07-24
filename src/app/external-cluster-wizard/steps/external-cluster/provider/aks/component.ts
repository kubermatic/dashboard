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
import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator,
  Validators,
} from '@angular/forms';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {StepBase} from '@app/external-cluster-wizard/steps/base';
import {ExternalClusterService} from '@core/services/external-cluster';
import {NameGeneratorService} from '@core/services/name-generator';
import {ErrorType} from '@shared/types/error-type';
import {Observable} from 'rxjs';
import {debounceTime, finalize, switchMap, takeUntil} from 'rxjs/operators';
import {
  ExternalCloudSpec,
  ExternalCluster,
  ExternalClusterModel,
  ExternalClusterSpec,
} from '@shared/entity/external-cluster';
import {
  AgentPoolBasics,
  AKSCloudSpec,
  AKSClusterSpec,
  AKSMachineDeploymentCloudSpec,
  AKSNodegroupScalingConfig,
  AKSNoodPoolVersion,
} from '@shared/entity/provider/aks';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR, AKS_POOL_NAME_VALIDATOR} from '@shared/validators/others';
import {NodeDataService} from '@app/core/services/node-data/service';
import {ExternalMachineDeploymentService} from '@app/core/services/external-machine-deployment';
import {
  ExternalMachineDeployment,
  ExternalMachineDeploymentCloudSpec,
} from '@app/shared/entity/external-machine-deployment';

enum Controls {
  Name = 'name',
  Location = 'location',
  KubernetesVersion = 'kubernetesVersion',
  NodeResourceGroup = 'nodeResourceGroup',
  NodePoolName = 'nodePoolName',
  Count = 'count',
  VmSize = 'vmSize',
  Mode = 'mode',
  EnableAutoScaling = 'enableAutoScaling',
  MaxCount = 'maxCount',
  MinCount = 'minCount',
}

enum Mode {
  System = 'System',
  User = 'User',
}

@Component({
  selector: 'km-aks-cluster-settings',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AKSClusterSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AKSClusterSettingsComponent),
      multi: true,
    },
  ],
})
export class AKSClusterSettingsComponent
  extends StepBase
  implements OnInit, OnDestroy, ControlValueAccessor, Validator
{
  readonly Controls = Controls;
  readonly Mode = Mode;
  readonly ErrorType = ErrorType;
  readonly AUTOSCALING_MIN_VALUE = 1;
  readonly AUTOSCALING_MAX_VALUE = 1000;
  @Input() projectID: string;
  @Input() cluster: ExternalCluster;
  isLoadingVmSizes: boolean;
  isLoadingNoodPoolVersions: boolean;
  vmSizes: string[] = [];
  kubernetesVersions: string[] = [];

  private readonly _debounceTime = 500;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _nodeDataService: NodeDataService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this.reset();
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  generateName(): void {
    this.control(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  isDialogView(): boolean {
    return !this._nodeDataService.isInWizardMode();
  }

  onEnableAutoScalingChange(evt: MatCheckboxChange) {
    if (!evt.checked) {
      this.form.patchValue({
        [Controls.MaxCount]: null,
        [Controls.MinCount]: null,
      });

      this.control(Controls.MaxCount).clearValidators();
      this.control(Controls.MaxCount).updateValueAndValidity();
      this.control(Controls.MinCount).clearValidators();
      this.control(Controls.MinCount).updateValueAndValidity();
    }
  }

  private _initForm(): void {
    const MIN_COUNT_DEFAULT_VALUE = 1;
    const MAX_COUNT_DEFAULT_VALUE = 5;
    const DEFAULT_MODE = 'System';
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.Location]: this._builder.control('', Validators.required),
      [Controls.NodeResourceGroup]: this._builder.control('', Validators.required),
      [Controls.KubernetesVersion]: this._builder.control('', Validators.required),
      [Controls.NodePoolName]: this._builder.control('', [Validators.required, AKS_POOL_NAME_VALIDATOR]),
      [Controls.Count]: this._builder.control(1, Validators.required),
      [Controls.VmSize]: this._builder.control('', Validators.required),
      [Controls.Mode]: this._builder.control(DEFAULT_MODE),
      [Controls.EnableAutoScaling]: this._builder.control(true),
      [Controls.MaxCount]: this._builder.control(MAX_COUNT_DEFAULT_VALUE, [
        Validators.required,
        Validators.max(this.AUTOSCALING_MAX_VALUE),
      ]),
      [Controls.MinCount]: this._builder.control(MIN_COUNT_DEFAULT_VALUE, [
        Validators.required,
        Validators.min(this.AUTOSCALING_MIN_VALUE),
      ]),
    });
    this.control(Controls.Mode).disable();
  }

  private _initSubscriptions(): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this.isDialogView() ? this._getExternalMachineDeployment() : this._updateExternalClusterModel();
      this._externalClusterService.isClusterDetailsStepValid = this.form.valid;
      this._externalMachineDeploymentService.isAddMachineDeploymentFormValid = this.form.valid;
    });

    if (this.isDialogView()) {
      this.form.get(Controls.Name).clearValidators();
      this.form.get(Controls.Location).removeValidators(Validators.required);
      this.form.get(Controls.NodeResourceGroup).removeValidators(Validators.required);
      this.form.get(Controls.Mode).enable();
      this._getAKSVmSizesForCreateMachineDeployment(this.cluster.spec.aksclusterSpec.location).subscribe(vmSizes => {
        this.vmSizes = vmSizes;
      });
      this._getAKSAvailableNoodPoolVersions().subscribe(versions => {
        this.kubernetesVersions = versions.map(version => version.version);
      });
    } else {
      this.control(Controls.Location)
        .valueChanges.pipe(debounceTime(this._debounceTime))
        .pipe(switchMap(location => this._getAKSVmSizes(location)))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((vmSizes: string[]) => {
          this.vmSizes = vmSizes;
        });
    }
  }

  private _getAKSVmSizes(location?: string): Observable<string[]> {
    this.isLoadingVmSizes = true;
    return this._externalClusterService.getAKSVmSizes(location).pipe(
      takeUntil(this._unsubscribe),
      finalize(() => (this.isLoadingVmSizes = false))
    );
  }

  private _getAKSVmSizesForCreateMachineDeployment(location?: string): Observable<string[]> {
    this.isLoadingVmSizes = true;
    return this._externalClusterService.getAKSVmSizesForCluster(location, this.projectID, this.cluster.id).pipe(
      takeUntil(this._unsubscribe),
      finalize(() => (this.isLoadingVmSizes = false))
    );
  }

  private _getAKSAvailableNoodPoolVersions(): Observable<AKSNoodPoolVersion[]> {
    this.isLoadingNoodPoolVersions = true;
    return this._externalClusterService.getAKSAvailableNoodPoolVersions(this.projectID, this.cluster.id).pipe(
      takeUntil(this._unsubscribe),
      finalize(() => (this.isLoadingNoodPoolVersions = false))
    );
  }

  private _updateExternalClusterModel(): void {
    const config = {
      name: this.controlValue(Controls.Name),
      cloud: {
        aks: {
          ...this._externalClusterService.externalCluster?.cloud?.aks,
          name: this.controlValue(Controls.Name),
          resourceGroup: this.controlValue(Controls.NodeResourceGroup),
        } as AKSCloudSpec,
      } as ExternalCloudSpec,
      spec: {
        aksclusterSpec: {
          kubernetesVersion: this.controlValue(Controls.KubernetesVersion),
          location: this.controlValue(Controls.Location),
          machineDeploymentSpec: {
            name: this.controlValue(Controls.NodePoolName),
            basicSettings: {
              mode: this.controlValue(Controls.Mode),
              vmSize: this.controlValue(Controls.VmSize)?.main,
              count: this.controlValue(Controls.Count),
              enableAutoScaling: this.controlValue(Controls.EnableAutoScaling),
            } as AgentPoolBasics,
          } as AKSMachineDeploymentCloudSpec,
        } as AKSClusterSpec,
        version: this.controlValue(Controls.KubernetesVersion),
      } as ExternalClusterSpec,
    } as ExternalClusterModel;

    if (this.controlValue(Controls.EnableAutoScaling)) {
      config.spec.aksclusterSpec.machineDeploymentSpec.basicSettings.scalingConfig = {
        maxCount: this.controlValue(Controls.MaxCount),
        minCount: this.controlValue(Controls.MinCount),
      } as AKSNodegroupScalingConfig;
    } else {
      delete config.spec.aksclusterSpec?.machineDeploymentSpec?.basicSettings.scalingConfig;
    }
    this._externalClusterService.externalCluster = config;
  }

  private _getExternalMachineDeployment(): void {
    const config = {
      name: this.controlValue(Controls.NodePoolName),
      cloud: {
        aks: {
          basicSettings: {
            mode: this.controlValue(Controls.Mode),
            orchestratorVersion: this.controlValue(Controls.KubernetesVersion)?.main,
            enableAutoScaling: this.controlValue(Controls.EnableAutoScaling),
            vmSize: this.controlValue(Controls.VmSize)?.main,
            count: this.controlValue(Controls.Count),
          } as AgentPoolBasics,
        } as AKSMachineDeploymentCloudSpec,
      } as ExternalMachineDeploymentCloudSpec,
    } as ExternalMachineDeployment;

    if (this.controlValue(Controls.EnableAutoScaling)) {
      config.cloud.aks.basicSettings['scalingConfig'] = {
        maxCount: this.controlValue(Controls.MaxCount),
        minCount: this.controlValue(Controls.MinCount),
      } as AKSNodegroupScalingConfig;
    }
    this._externalMachineDeploymentService.externalMachineDeployment = config;
  }
}
