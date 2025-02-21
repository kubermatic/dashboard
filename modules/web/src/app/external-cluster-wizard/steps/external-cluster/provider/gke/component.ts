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

import {
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  TemplateRef,
} from '@angular/core';
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
import {GKECloudSpec, GKEClusterSpec, GKEZone, GKENodeConfig} from '@app/shared/entity/provider/gke';
import {ExternalClusterService} from '@core/services/external-cluster';
import {merge} from 'rxjs';
import {debounceTime, filter, takeUntil, tap} from 'rxjs/operators';
import {GKE_POOL_NAME_VALIDATOR} from '@app/shared/validators/others';
import {NodeDataService} from '@app/core/services/node-data/service';
import {ExternalMachineDeploymentService} from '@app/core/services/external-machine-deployment';
import {
  ExternalMachineDeployment,
  ExternalMachineDeploymentCloudSpec,
  GKEMachineDeploymentCloudSpec,
} from '@app/shared/entity/external-machine-deployment';
import {MachineDeploymentSpec} from '@app/shared/entity/machine-deployment';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {GCPDiskType, GCPMachineSize} from '@app/shared/entity/provider/gcp';
import {NameGeneratorService} from '@app/core/services/name-generator';
import {MasterVersion} from '@app/shared/entity/cluster';
import {ComboboxControls, FilteredComboboxComponent} from '@app/shared/components/combobox/component';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {ProjectService} from '@core/services/project';

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
  InitialNodePoolName = 'initialNodePoolName',
  EnableAutoScaling = 'enableAutoScaling',
  KubernetesVersionMode = 'kubernetesVersionMode',
  ReleaseChannelOptions = 'releaseChannelOptions',
}

enum KubernetesVersionMode {
  StaticVersion = 'Manual',
  ReleaseChannel = 'Auto',
}

enum ReleaseChannelOptions {
  RapidChannel = 'Rapid channel',
  RegularChannel = 'Regular channel',
  StableChannel = 'Stable channel',
}

enum ReleaseChannelOptionsValue {
  Rapid = 'RAPID',
  Regular = 'REGULAR',
  Stable = 'STABLE',
}

export enum VersionState {
  Ready = 'Versions',
  Loading = 'Loading...',
  Empty = 'No Versions Available',
}

export enum MachineTypeState {
  Ready = 'Machine Types',
  Loading = 'Loading...',
  Empty = 'No Machine Types Available',
}

export enum DiskTypeState {
  Ready = 'Disk Types',
  Loading = 'Loading...',
  Empty = 'No Disk Types Available',
}

export enum Zones {
  ready = 'Zones',
  Loading = 'Loading...',
  Empty = 'No Zones Available',
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
  standalone: false,
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
  readonly DISK_SIZE_DEFAULT_VALUE = 100;
  readonly MAX_REPLICAS_COUNT_DEFAULT_VALUE = 5;
  readonly MIN_REPLICAS_COUNT_DEFAULT_VALUE = 1;
  readonly MACHINE_TYPE_DEFAULT_VALUE = 'e2-medium';
  readonly DISK_TYPE_DEFAULT_VALUE = 'pd-standard';
  readonly ZONE_DEFAULT_VALUE = 'us-central1-c';
  readonly INITIAL_NODE_POOL_NAME = 'default-pool';
  readonly releaseChannelOptions: string[] = [
    ReleaseChannelOptions.RapidChannel,
    ReleaseChannelOptions.RegularChannel,
    ReleaseChannelOptions.StableChannel,
  ];

  zones: GKEZone[] = [];
  diskTypes: GCPDiskType[] = [];
  machineTypes: GCPMachineSize[] = [];
  kubernetesVersions: string[] = [];
  versionLabel = VersionState.Ready;
  machineTypeLabel = MachineTypeState.Ready;
  diskTypeLabel = DiskTypeState.Ready;
  zoneLabel = Zones.ready;

  @Input() projectID: string;
  @Input() cluster: ExternalCluster;
  @Input() quotaWidget: TemplateRef<QuotaWidgetComponent>;

  @ViewChild('diskTypesCombobox')
  private readonly _diskTypesCombobox: FilteredComboboxComponent;
  @ViewChild('machineTypesCombobox')
  private readonly _machineTypesCombobox: FilteredComboboxComponent;

  private readonly _debounceTime = 500;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _projectService: ProjectService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this.control(Controls.InitialNodePoolName).enable();
    this.onValueChange?.(null);
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

  displayMachineType(machineType: GCPMachineSize): string {
    return `${machineType.name} (${machineType.vcpus} vCPUs ${machineType.memory}MB RAM)`;
  }

  displayDiskType(diskType: GCPDiskType): string {
    return `${diskType.name} (${diskType.description})`;
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, GKE_POOL_NAME_VALIDATOR]),
      [Controls.Zone]: this._builder.control('', Validators.required),
      [Controls.KubernetesVersionMode]: this._builder.control(KubernetesVersionMode.StaticVersion),
      [Controls.ReleaseChannelOptions]: this._builder.control(this.releaseChannelOptions[1]),
      [Controls.Version]: this._builder.control('', Validators.required),
      [Controls.NodeCount]: this._builder.control(this.MIN_REPLICAS_COUNT_DEFAULT_VALUE, Validators.required),
      [Controls.MachineTypes]: this._builder.control(''),
      [Controls.DiskTypes]: this._builder.control(''),
      [Controls.DiskSize]: this._builder.control(this.DISK_SIZE_DEFAULT_VALUE),
      [Controls.EnableAutoScaling]: this._builder.control(false),
      [Controls.MaxCount]: this._builder.control(this.MAX_REPLICAS_COUNT_DEFAULT_VALUE),
      [Controls.MinCount]: this._builder.control(this.MIN_REPLICAS_COUNT_DEFAULT_VALUE),
      [Controls.InitialNodePoolName]: this._builder.control({value: this.INITIAL_NODE_POOL_NAME, disabled: true}),
    });
  }

  private _initSubscriptions(): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this.isDialogView() ? this._updateExternalMachineDeployment() : this._updateExternalClusterModel();
      this._externalClusterService.isClusterDetailsStepValid = this.form.valid;
      this._externalMachineDeploymentService.isAddMachineDeploymentFormValid = this.form.valid;
    });

    if (this.isDialogView()) {
      const version = this.cluster.spec.version;
      this._getGKEDiskTypesForMachineDeployment();
      this._getGKEMachineTypesForMachineDeployment();
      this.control(Controls.Version).setValue(version.slice(1, version.indexOf('-')));
      this.control(Controls.Version).disable();
      this.control(Controls.Zone).clearValidators();
      this.control(Controls.Zone).updateValueAndValidity();
      this.control(Controls.MaxCount).setValidators([Validators.max(this.AUTOSCALING_MAX_VALUE)]);
      this.control(Controls.MinCount).setValidators([Validators.max(this.AUTOSCALING_MIN_VALUE)]);
      this.control(Controls.MaxCount).updateValueAndValidity();
      this.control(Controls.MinCount).updateValueAndValidity();
    } else {
      this._getGKEZones();

      merge(
        this.control(Controls.ReleaseChannelOptions).valueChanges,
        this.control(Controls.KubernetesVersionMode).valueChanges
      )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => {
          const modeValue = this.controlValue(Controls.KubernetesVersionMode) ?? KubernetesVersionMode.StaticVersion;

          if (modeValue) {
            const zoneValue = this.controlValue(Controls.Zone)?.[ComboboxControls.Select];
            this._getGKEKubernetesVersions(zoneValue, modeValue);
          }
        });

      this.control(Controls.Zone)
        .valueChanges.pipe(debounceTime(this._debounceTime))
        .pipe(
          tap(_ => {
            this._clearDiskTypes();
            this._clearMachineTypes();
          })
        )
        .subscribe(zone => {
          const zoneValue = zone?.[ComboboxControls.Select];

          if (zoneValue) {
            const modeValue = this.controlValue(Controls.KubernetesVersionMode) ?? KubernetesVersionMode.StaticVersion;
            this._getGKEKubernetesVersions(zoneValue, modeValue);
            this._getGKEDiskTypes(zoneValue);
            this._getGKEMachineTypes(zoneValue);
          }
        });

      this._externalClusterService.presetChanges
        .pipe(
          filter(preset => !!preset),
          takeUntil(this._unsubscribe)
        )
        .subscribe(_ => {
          this._getGKEZones();
        });
    }
  }

  private _getGKEZones(): void {
    this.zoneLabel = Zones.Loading;
    this._externalClusterService
      .getGKEZones(this._projectService.selectedProjectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((zones: GKEZone[]) => {
        this.zones = zones;
        this.zoneLabel = this.zones?.length ? Zones.ready : Zones.Empty;
        zones.forEach(zone => {
          if (zone.name === this.ZONE_DEFAULT_VALUE) {
            this.control(Controls.Zone).setValue(this.ZONE_DEFAULT_VALUE);
          }
        });
      });
  }

  private _getGKEDiskTypes(zone: string): void {
    this.diskTypeLabel = DiskTypeState.Loading;
    this._externalClusterService
      .getGKEDiskTypes(this._projectService.selectedProjectID, zone)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((diskTypes: GCPDiskType[]) => {
        diskTypes.map(diskType => {
          if (diskType.name === this.DISK_TYPE_DEFAULT_VALUE) {
            this.control(Controls.DiskTypes).setValue(diskType.name);
          }
        });
        this.diskTypes = diskTypes;
        this.diskTypeLabel = this.diskTypes?.length ? DiskTypeState.Ready : DiskTypeState.Empty;
      });
  }

  private _getGKEMachineTypes(zone: string): void {
    this.machineTypeLabel = MachineTypeState.Loading;
    this._externalClusterService
      .getGKEMachineTypes(this._projectService.selectedProjectID, zone)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((machineTypes: GCPMachineSize[]) => {
        machineTypes.map(machineType => {
          if (machineType.name === this.MACHINE_TYPE_DEFAULT_VALUE) {
            this.control(Controls.MachineTypes).setValue(machineType.name);
          }
        });
        this.machineTypes = machineTypes;
        this.machineTypeLabel = this.machineTypes?.length ? MachineTypeState.Ready : MachineTypeState.Empty;
      });
  }

  private _getGKEDiskTypesForMachineDeployment(): void {
    this.diskTypeLabel = DiskTypeState.Loading;
    this._externalMachineDeploymentService
      .getGKEDiskTypesForMachineDeployment(this.projectID, this.cluster.id)
      .subscribe((diskTypes: GCPDiskType[]) => {
        diskTypes.map(diskType => {
          if (diskType.name === this.DISK_TYPE_DEFAULT_VALUE) {
            this.control(Controls.DiskTypes).setValue(diskType.name);
          }
        });
        this.diskTypes = diskTypes;
        this.diskTypeLabel = this.diskTypes?.length ? DiskTypeState.Ready : DiskTypeState.Empty;
      });
  }

  private _getGKEKubernetesVersions(zone: string, mode: string): void {
    this.kubernetesVersions = [];
    let releaseChannel: string;

    if (mode === KubernetesVersionMode.ReleaseChannel) {
      const releaseChannelToUpperCase = this.controlValue(Controls.ReleaseChannelOptions)?.toUpperCase();
      releaseChannel = releaseChannelToUpperCase?.slice(0, releaseChannelToUpperCase.indexOf(' '));
    }

    if (zone && mode) {
      this.versionLabel = VersionState.Loading;
      this._externalClusterService
        .getGKEKubernetesVersions(this._projectService.selectedProjectID, zone, mode, releaseChannel)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((versions: MasterVersion[]) => {
          this.kubernetesVersions = versions.map(version => {
            if (version.default) {
              this.control(Controls.Version).setValue(version.version);
            }
            return version.version;
          });
          this.versionLabel = this.kubernetesVersions?.length ? VersionState.Ready : VersionState.Empty;
        });
    }
  }

  private _getGKEMachineTypesForMachineDeployment(): void {
    this.machineTypeLabel = MachineTypeState.Loading;
    this._externalMachineDeploymentService
      .getGKEMachineTypesForMachineDeployment(this.projectID, this.cluster.id)
      .subscribe((machineTypes: GCPMachineSize[]) => {
        machineTypes.map(machineType => {
          if (machineType.name === this.MACHINE_TYPE_DEFAULT_VALUE) {
            this.control(Controls.MachineTypes).setValue(machineType.name);
          }
        });
        this.machineTypes = machineTypes;
        this.machineTypeLabel = this.machineTypes?.length ? MachineTypeState.Ready : MachineTypeState.Empty;
      });
  }

  private _updateExternalClusterModel(): void {
    const config = {
      name: this.controlValue(Controls.Name),
      cloud: {
        gke: {
          ...this._externalClusterService.externalCluster.cloud?.gke,
          name: this.controlValue(Controls.Name),
          zone: this.controlValue(Controls.Zone)?.[ComboboxControls.Select],
        } as GKECloudSpec,
      } as ExternalCloudSpec,
      spec: {
        gkeclusterSpec: {
          initialClusterVersion: this.controlValue(Controls.Version),
          initialNodeCount: this.controlValue(Controls.NodeCount),
          nodeConfig: {
            name: this.controlValue(Controls.InitialNodePoolName),
            diskSizeGb: this.controlValue(Controls.DiskSize),
            diskType: this.controlValue(Controls.DiskTypes)?.[ComboboxControls.Select],
            machineType: this.controlValue(Controls.MachineTypes)?.[ComboboxControls.Select],
          } as GKENodeConfig,
        } as GKEClusterSpec,
      } as ExternalClusterSpec,
    } as ExternalClusterModel;

    if (this.controlValue(Controls.KubernetesVersionMode) === KubernetesVersionMode.ReleaseChannel) {
      let value = '';
      switch (this.controlValue(Controls.ReleaseChannelOptions)) {
        case ReleaseChannelOptions.RapidChannel:
          value = ReleaseChannelOptionsValue.Rapid;
          break;
        case ReleaseChannelOptions.RegularChannel:
          value = ReleaseChannelOptionsValue.Regular;
          break;
        case ReleaseChannelOptions.StableChannel:
          value = ReleaseChannelOptionsValue.Stable;
          break;
      }
      config.spec.gkeclusterSpec.releaseChannel = value;
    } else {
      delete config.cloud?.gke?.clusterSpec?.releaseChannel;
    }
    this._externalClusterService.externalCluster = config;
  }

  private _updateExternalMachineDeployment(): void {
    this._externalMachineDeploymentService.externalMachineDeployment = {
      name: this.controlValue(Controls.Name),
      cloud: {
        gke: {
          config: {
            machineType: this.controlValue(Controls.MachineTypes)?.[ComboboxControls.Select],
            diskType: this.controlValue(Controls.DiskTypes)?.[ComboboxControls.Select],
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

  private _clearDiskTypes(): void {
    this.diskTypes = [];
    this.diskTypeLabel = DiskTypeState.Ready;
    this._diskTypesCombobox.reset();
    this._cdr.detectChanges();
  }

  private _clearMachineTypes(): void {
    this.machineTypes = [];
    this.machineTypeLabel = MachineTypeState.Ready;
    this._machineTypesCombobox.reset();
    this._cdr.detectChanges();
  }
}
