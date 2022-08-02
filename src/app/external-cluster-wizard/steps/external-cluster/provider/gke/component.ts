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
import {StepBase} from '@app/external-cluster-wizard/steps/base';
import {
  ExternalCloudSpec,
  ExternalCluster,
  ExternalClusterModel,
  ExternalClusterSpec,
} from '@app/shared/entity/external-cluster';
import {GKECloudSpec, GKEClusterSpec, GKEZone} from '@app/shared/entity/provider/gke';
import {ExternalClusterService} from '@core/services/external-cluster';
import {map, takeUntil} from 'rxjs/operators';
import {GKE_POOL_NAME_VALIDATOR} from '@app/shared/validators/others';
import {NodeDataService} from '@app/core/services/node-data/service';
import {ExternalMachineDeploymentService} from '@app/core/services/external-machine-deployment';
import {
  ExternalMachineDeployment,
  ExternalMachineDeploymentCloudSpec,
  GKEMachineDeploymentCloudSpec,
  GKENodeConfig,
} from '@app/shared/entity/external-machine-deployment';
import {MachineDeploymentSpec} from '@app/shared/entity/machine-deployment';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {GCPDiskType, GCPMachineSize} from '@app/shared/entity/provider/gcp';
import {NameGeneratorService} from '@app/core/services/name-generator';
import {MasterVersion} from '@app/shared/entity/cluster';

enum Controls {
  Name = 'name',
  Zone = 'zone',
  Version = 'version',
  DiskSize = 'diskSize',
  MaxCount = 'maxCount',
  MinCount = 'minCount',
  NodeCount = 'nodeCount',
  DiskTypes = 'diskTypes',
  MachineTypes = 'machineTypes',
  EnableAutoScaling = 'enableAutoScaling',
  KubernetesVersionMode = 'kubernetesVersionMode',
  ReleaseChannelOptions = 'releaseChannelOptions',
}

enum KubernetesVersionMode {
  StaticVersion = 'Manual',
  ReleaseChannel = 'Auto',
}

@Component({
  selector: 'km-gke-cluster-settings',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GKEClusterSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GKEClusterSettingsComponent),
      multi: true,
    },
  ],
})
export class GKEClusterSettingsComponent
  extends StepBase
  implements OnInit, OnDestroy, ControlValueAccessor, Validator
{
  readonly Controls = Controls;
  readonly KubernetesVersionMode = KubernetesVersionMode;
  readonly DISK_SIZE_MIN_VALUE = 10;
  readonly DISK_SIZE_MAX_VALUE = 65536;
  readonly AUTOSCALING_MIN_VALUE = 1;
  readonly AUTOSCALING_MAX_VALUE = 1000;
  readonly DISK_SIZE_DEFAULT_VALUE = 25;
  readonly MAX_REPLICAS_COUNT_DEFAULT_VALUE = 5;
  readonly MIN_REPLICAS_COUNT_DEFAULT_VALUE = 1;
  readonly ZONE_DEFAULT_VALUE = 'us-central1-c';

  zones: string[] = [];
  diskTypes: string[] = [];
  machineTypes: string[] = [];
  releaseChannelOptions: string[] = ['RAPID', 'REGULAR', 'STABLE'];
  kubernetesVersions: string[] = [];
  isLoadingZones: boolean;

  @Input() projectID: string;
  @Input() cluster: ExternalCluster;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _nameGenerator: NameGeneratorService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();

    if (!this.isDialogView()) {
      this._getGKEZones();
    }
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
        [Controls.MaxCount]: this.MAX_REPLICAS_COUNT_DEFAULT_VALUE,
        [Controls.MinCount]: this.MIN_REPLICAS_COUNT_DEFAULT_VALUE,
      });

      this.control(Controls.MaxCount).updateValueAndValidity();
      this.control(Controls.MinCount).updateValueAndValidity();
    }
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, GKE_POOL_NAME_VALIDATOR]),
      [Controls.Zone]: this._builder.control({main: this.ZONE_DEFAULT_VALUE}, Validators.required),
      [Controls.KubernetesVersionMode]: this._builder.control(KubernetesVersionMode.StaticVersion),
      [Controls.ReleaseChannelOptions]: this._builder.control({main: this.releaseChannelOptions[1]}),
      [Controls.Version]: this._builder.control('', Validators.required),
      [Controls.NodeCount]: this._builder.control(this.MIN_REPLICAS_COUNT_DEFAULT_VALUE, Validators.required),
      [Controls.MachineTypes]: this._builder.control(''),
      [Controls.DiskTypes]: this._builder.control(''),
      [Controls.DiskSize]: this._builder.control(this.DISK_SIZE_DEFAULT_VALUE),
      [Controls.EnableAutoScaling]: this._builder.control(false),
      [Controls.MaxCount]: this._builder.control(this.MAX_REPLICAS_COUNT_DEFAULT_VALUE),
      [Controls.MinCount]: this._builder.control(this.MIN_REPLICAS_COUNT_DEFAULT_VALUE),
    });
  }

  private _initSubscriptions(): void {
    this._getGKEKubernetesVersions();
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateExternalClusterModel();
      this._updateExternalMachineDeployment();
      this._externalClusterService.isClusterDetailsStepValid = this.form.valid;
      this._externalMachineDeploymentService.isAddMachineDeploymentFormValid = this.form.valid;
    });

    this.control(Controls.Zone)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._getGKEKubernetesVersions();
      });

    this.control(Controls.ReleaseChannelOptions)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._getGKEKubernetesVersions();
      });

    this.control(Controls.KubernetesVersionMode)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._getGKEKubernetesVersions();
      });

    if (this.isDialogView()) {
      const version = this.cluster.spec.version;
      this._getGKEDiskTypesForMachineDeployment();
      this._getGKEMachineSizesForMachineDeployment();
      this.control(Controls.Version).setValue(version.slice(1, version.indexOf('-')));
      this.control(Controls.Version).disable();
      this.control(Controls.Zone).clearValidators();
      this.control(Controls.Zone).updateValueAndValidity();
      this.control(Controls.MaxCount).setValidators([Validators.max(this.AUTOSCALING_MAX_VALUE)]);
      this.control(Controls.MinCount).setValidators([Validators.max(this.AUTOSCALING_MIN_VALUE)]);
      this.control(Controls.MaxCount).updateValueAndValidity();
      this.control(Controls.MinCount).updateValueAndValidity();
    }
  }

  private _getGKEZones(): void {
    this._externalClusterService
      .getGKEZones()
      .pipe(map((zones: GKEZone[]) => zones.map(zone => zone.name)))
      .subscribe((zones: string[]) => (this.zones = zones));
  }

  private _getGKEDiskTypesForMachineDeployment(): void {
    this._externalMachineDeploymentService
      .getGKEDiskTypesForMachineDeployment(this.projectID, this.cluster.id)
      .pipe(map((diskTypes: GCPDiskType[]) => diskTypes.map(type => type.name + ` (${type.description})`)))
      .subscribe((diskTypes: string[]) => (this.diskTypes = diskTypes));
  }

  private _getGKEKubernetesVersions(): void {
    this.kubernetesVersions = [];
    this.control(Controls.Version).setValue({main: ''});
    const zone = this.controlValue(Controls.Zone)?.main;
    const mode = this.controlValue(Controls.KubernetesVersionMode);
    let releaseChannel: string;
    if (mode === KubernetesVersionMode.ReleaseChannel) {
      releaseChannel = this.controlValue(Controls.ReleaseChannelOptions)?.main;
    }
    this._externalClusterService
      .getGKEKubernetesVersions(zone, mode, releaseChannel)
      .subscribe((versions: MasterVersion[]) => (this.kubernetesVersions = versions.map(version => version.version)));
  }

  private _getGKEMachineSizesForMachineDeployment(): void {
    this._externalMachineDeploymentService
      .getGKEMachineSizesForMachineDeployment(this.projectID, this.cluster.id)
      .pipe(
        map((machineSizes: GCPMachineSize[]) =>
          machineSizes.map((machineType: GCPMachineSize) => {
            return `${machineType.name} ${machineType.description})`;
          })
        )
      )
      .subscribe((machineTypes: string[]) => (this.machineTypes = machineTypes));
  }

  private _updateExternalClusterModel(): void {
    this._externalClusterService.externalCluster = {
      name: this.controlValue(Controls.Name),
      cloud: {
        gke: {
          ...this._externalClusterService.externalCluster.cloud?.gke,
          name: this.controlValue(Controls.Name),
          zone: this.controlValue(Controls.Zone)?.main,
        } as GKECloudSpec,
      } as ExternalCloudSpec,
      spec: {
        gkeclusterSpec: {
          initialClusterVersion: this.controlValue(Controls.Version)?.main,
          initialNodeCount: this.controlValue(Controls.NodeCount),
        } as GKEClusterSpec,
      } as ExternalClusterSpec,
    } as ExternalClusterModel;
  }

  private _updateExternalMachineDeployment(): void {
    const selectedMachineType = this.controlValue(Controls.MachineTypes)?.main;
    const selectedDiskType = this.controlValue(Controls.DiskTypes)?.main;

    this._externalMachineDeploymentService.externalMachineDeployment = {
      name: this.controlValue(Controls.Name),
      cloud: {
        gke: {
          config: {
            machineType: selectedMachineType?.slice(0, selectedMachineType.indexOf(' ')),
            diskType: selectedDiskType?.slice(0, selectedDiskType.indexOf(' ')),
            diskSizeGb: this.controlValue(Controls.DiskSize),
          } as GKENodeConfig,
        } as GKEMachineDeploymentCloudSpec,
      } as ExternalMachineDeploymentCloudSpec,
      spec: {
        replicas: this.controlValue(Controls.NodeCount),
        template: {
          versions: {
            kubelet: this.controlValue(Controls.Version),
          },
        },
      } as MachineDeploymentSpec,
    } as ExternalMachineDeployment;

    if (this.controlValue(Controls.EnableAutoScaling)) {
      this._externalMachineDeploymentService.externalMachineDeployment.cloud.gke.autoscaling = {
        enabled: this.controlValue(Controls.EnableAutoScaling),
        maxNodeCount: this.controlValue(Controls.MaxCount),
        minNodeCount: this.controlValue(Controls.MinCount),
      };
    }
  }
}
