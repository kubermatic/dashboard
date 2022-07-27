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
import {GCPDiskType, GCPImage, GCPMachineSize} from '@app/shared/entity/provider/gcp';
import {NameGeneratorService} from '@app/core/services/name-generator';

enum Controls {
  Name = 'name',
  Zone = 'zone',
  Version = 'version',
  NodeCount = 'nodeCount',
  DiskTypes = 'diskTypes',
  MachineSizes = 'machineSizes',
  ClusterImages = 'clusterImages',
  EnableAutoScaling = 'enableAutoScaling',
  MaxCount = 'maxCount',
  MinCount = 'minCount',
}

@Component({
  selector: 'km-gke-cluster-settings',
  templateUrl: './template.html',
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
  readonly AUTOSCALING_MIN_VALUE = 1;
  readonly AUTOSCALING_MAX_VALUE = 1000;
  isLoadingZones: boolean;
  zones: string[] = [];
  diskTypes: string[] = [];
  machineSizes: string[] = [];
  clusterImages: string[] = [];
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
    !this.isDialogView() && this._getGKEZones();
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

      this.control(Controls.MaxCount).updateValueAndValidity();
      this.control(Controls.MinCount).updateValueAndValidity();
    }
  }

  private _initForm(): void {
    const MIN_COUNT_DEFAULT_VALUE = 1;
    const MAX_COUNT_DEFAULT_VALUE = 5;
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, GKE_POOL_NAME_VALIDATOR]),
      [Controls.Zone]: this._builder.control('', Validators.required),
      [Controls.Version]: this._builder.control('', Validators.required),
      [Controls.NodeCount]: this._builder.control(MIN_COUNT_DEFAULT_VALUE, Validators.required),
      [Controls.DiskTypes]: this._builder.control(''),
      [Controls.MachineSizes]: this._builder.control(''),
      [Controls.ClusterImages]: this._builder.control(''),
      [Controls.EnableAutoScaling]: this._builder.control(''),
      [Controls.MaxCount]: this._builder.control(MAX_COUNT_DEFAULT_VALUE),
      [Controls.MinCount]: this._builder.control(MIN_COUNT_DEFAULT_VALUE),
    });
  }

  private _initSubscriptions(): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateExternalClusterModel();
      this._updateExternalMachineDeployment();
      this._externalClusterService.isClusterDetailsStepValid = this.form.valid;
      this._externalMachineDeploymentService.isAddMachineDeploymentFormValid = this.form.valid;
    });

    if (this.isDialogView()) {
      const version = this.cluster.spec.version;
      this._getGKEDiskTypes();
      this._getGKEMachineSizes();
      this._getGKEClusterImages();
      this.control(Controls.Version).setValue(version.slice(1, version.indexOf('-')));
      this.control(Controls.Version).disable();
      this.control(Controls.Zone).clearValidators();
      this.control(Controls.MaxCount).addValidators([Validators.required, Validators.max(this.AUTOSCALING_MAX_VALUE)]);
      this.control(Controls.MinCount).addValidators([Validators.required, Validators.min(this.AUTOSCALING_MIN_VALUE)]);
    }
  }

  private _getGKEZones(): void {
    this._externalClusterService
      .getGKEZones()
      .pipe(map((zones: GKEZone[]) => zones.map(zone => zone.name)))
      .subscribe(zones => (this.zones = zones));
  }

  private _getGKEDiskTypes(): void {
    this._externalClusterService
      .getGKEDiskTypes(this.projectID, this.cluster.id)
      .pipe(map((diskTypes: GCPDiskType[]) => diskTypes.map(type => type.name)))
      .subscribe(diskTypes => (this.diskTypes = diskTypes));
  }

  private _getGKEMachineSizes(): void {
    this._externalClusterService
      .getGKEMachineSizes(this.projectID, this.cluster.id)
      .pipe(map((machineSizes: GCPMachineSize[]) => machineSizes.map(size => size.name)))
      .subscribe(machineSizes => (this.machineSizes = machineSizes));
  }

  private _getGKEClusterImages(): void {
    this._externalClusterService
      .getGKEClusterImages(this.projectID, this.cluster.id)
      .pipe(map((clusterImages: GCPImage[]) => clusterImages.map(image => image.name)))
      .subscribe(clusterImages => (this.clusterImages = clusterImages));
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
          initialClusterVersion: this.controlValue(Controls.Version),
          initialNodeCount: this.controlValue(Controls.NodeCount),
        } as GKEClusterSpec,
      } as ExternalClusterSpec,
    } as ExternalClusterModel;
  }

  private _updateExternalMachineDeployment(): void {
    this._externalMachineDeploymentService.externalMachineDeployment = {
      name: this.controlValue(Controls.Name),
      cloud: {
        gke: {
          config: {
            diskType: this.controlValue(Controls.DiskTypes)?.main,
            machineType: this.controlValue(Controls.MachineSizes)?.main,
            imageType: this.controlValue(Controls.ClusterImages)?.main,
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
