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
import {ChangeDetectorRef, Component, forwardRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {debounceTime, finalize, switchMap, takeUntil, tap} from 'rxjs/operators';
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
  AKSLocation,
  AKSMachineDeploymentCloudSpec,
  AKSNodegroupScalingConfig,
  AKSNodePoolVersionForMachineDeployments,
  AKSVMSize,
  AzureResourceGroup,
} from '@shared/entity/provider/aks';
import {AKS_POOL_NAME_VALIDATOR, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';
import {NodeDataService} from '@app/core/services/node-data/service';
import {ExternalMachineDeploymentService} from '@app/core/services/external-machine-deployment';
import {
  ExternalMachineDeployment,
  ExternalMachineDeploymentCloudSpec,
} from '@app/shared/entity/external-machine-deployment';
import {MasterVersion} from '@app/shared/entity/cluster';
import {EKSSecurityGroup} from '@shared/entity/provider/eks';
import {ComboboxControls, FilteredComboboxComponent} from '@shared/components/combobox/component';

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

export enum LocationState {
  Ready = 'Locations',
  Loading = 'Loading...',
  Empty = 'No Locations Available',
}

export enum VMSizeState {
  Ready = 'VM Sizes',
  Loading = 'Loading...',
  Empty = 'No VM Sizes Available',
}

export enum ResourceGroupState {
  Ready = 'Resource Group',
  Loading = 'Loading...',
  Empty = 'No Resource Groups Available',
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
  readonly DEFAULT_LOCATION = 'eastus';
  @Input() projectID: string;
  @Input() cluster: ExternalCluster;
  isLoadingVmSizes: boolean;
  isLoadingNodePoolVersions: boolean;
  vmSizes: AKSVMSize[] = [];
  locationLabel = LocationState.Ready;
  vmSizeLabel = VMSizeState.Ready;
  securityGroups: EKSSecurityGroup[] = [];
  locations: string[] = [];
  nodePoolVersionsForMD: string[] = [];
  kubernetesVersions: string[] = [];
  resourceGroupLabel = ResourceGroupState.Ready;
  resourceGroups: AzureResourceGroup[] = [];

  @ViewChild('vmSizeCombobox')
  private readonly _vmSizeCombobox: FilteredComboboxComponent;

  private readonly _debounceTime = 500;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _cdr: ChangeDetectorRef,
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

  vmSizeDisplayName(vmSizeName: string): string {
    const vmSize = this.vmSizes.find((vmSize: AKSVMSize) => vmSize.name === vmSizeName);
    if (!vmSize) {
      return vmSizeName;
    }
    return `${vmSize.name}, ${vmSize.numberOfCores} vCPUs, ${vmSize.memoryInMB}MB RAM`;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.Location:
        if (!this.isDialogView()) {
          if (this.form.get(Controls.Location).value) {
            return 'VM size availability varies by region.';
          }
          return 'Enter location to fetch VM sizes';
        }
        return 'Set the VM Size for this node.';

      default:
        return '';
    }
  }

  private _initForm(): void {
    const MIN_COUNT_DEFAULT_VALUE = 1;
    const MAX_COUNT_DEFAULT_VALUE = 5;
    const DEFAULT_MODE = 'System';
    const DEFAULT_NO_OF_NODES = 1;
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.Location]: this._builder.control('', Validators.required),
      [Controls.NodeResourceGroup]: this._builder.control('', Validators.required),
      [Controls.KubernetesVersion]: this._builder.control('', Validators.required),
      [Controls.NodePoolName]: this._builder.control('', [Validators.required, AKS_POOL_NAME_VALIDATOR]),
      [Controls.Count]: this._builder.control(DEFAULT_NO_OF_NODES, Validators.required),
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
  }

  private _initSubscriptions(): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this.isDialogView() ? this._updateExternalMachineDeployment() : this._updateExternalClusterModel();
      this._externalClusterService.isClusterDetailsStepValid = this.form.valid;
      this._externalMachineDeploymentService.isAddMachineDeploymentFormValid = this.form.valid;
    });

    if (this.isDialogView()) {
      const version = this.cluster.spec.version;
      this.control(Controls.KubernetesVersion).setValue({main: version.slice(1)});
      this.control(Controls.Name).clearValidators();
      this.control(Controls.Location).clearValidators();
      this.control(Controls.NodeResourceGroup).clearValidators();

      this.vmSizeLabel = VMSizeState.Loading;
      this.control(Controls.VmSize).disable();
      this._getAKSVmSizesForMachineDeployment(this.cluster.cloud.aks.location).subscribe((vmSizes: AKSVMSize[]) => {
        this.vmSizes = vmSizes;
        this.vmSizeLabel = this.vmSizes?.length ? VMSizeState.Ready : VMSizeState.Empty;
        this.control(Controls.VmSize).enable();
      });
      this._getAKSAvailableNodePoolVersionsForCreateMachineDeployment().subscribe(
        (nodePoolVersions: AKSNodePoolVersionForMachineDeployments[]) => {
          this.nodePoolVersionsForMD = nodePoolVersions.map(nodePoolVersion => nodePoolVersion.version);
        }
      );
    } else {
      this.control(Controls.Location)
        .valueChanges.pipe(debounceTime(this._debounceTime))
        .pipe(tap(_ => this._clearVmSize()))
        .pipe(
          switchMap((location: string) => {
            this.vmSizeLabel = VMSizeState.Loading;
            return this._getAKSVmSizes(location);
          })
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((vmSizes: AKSVMSize[]) => {
          this.vmSizes = vmSizes;
          this.vmSizeLabel = this.vmSizes?.length ? VMSizeState.Ready : VMSizeState.Empty;
        });

      this._getAKSKubernetesVersions();
      this._getAKSLocations();
      this._getAKSResourceGroups();
    }
  }

  private _getAKSVmSizes(location: string): Observable<AKSVMSize[]> {
    this.isLoadingVmSizes = true;
    return this._externalClusterService.getAKSVmSizes(location).pipe(
      takeUntil(this._unsubscribe),
      finalize(() => (this.isLoadingVmSizes = false))
    );
  }

  private _getAKSKubernetesVersions(): void {
    this._externalClusterService.getAKSKubernetesVersions().subscribe(
      (versions: MasterVersion[]) =>
        (this.kubernetesVersions = versions.map(version => {
          if (version.default) {
            this.control(Controls.KubernetesVersion).setValue({main: version.version});
          }
          return version.version;
        }))
    );
  }

  private _getAKSLocations(): void {
    this.locationLabel = LocationState.Loading;
    this._externalClusterService
      .getAKSLocations()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((locations: AKSLocation[]) => {
        this.locationLabel = this.locations?.length ? LocationState.Ready : LocationState.Empty;
        this.locations = locations.map((location: AKSLocation) => {
          if (location.name === this.DEFAULT_LOCATION) {
            this.control(Controls.Location).setValue(this.DEFAULT_LOCATION);
          }
          return location.name;
        });
      });
  }

  private _getAKSResourceGroups(): void {
    this.resourceGroupLabel = ResourceGroupState.Loading;
    this._externalClusterService
      .getAKSResourceGroups()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((resourceGroups: AzureResourceGroup[]) => {
        this.resourceGroups = resourceGroups;
        this.resourceGroupLabel = this.resourceGroups?.length ? ResourceGroupState.Ready : ResourceGroupState.Empty;
      });
  }

  private _getAKSVmSizesForMachineDeployment(location?: string): Observable<AKSVMSize[]> {
    this.isLoadingVmSizes = true;
    return this._externalMachineDeploymentService
      .getAKSVmSizesForMachineDeployment(this.projectID, this.cluster.id, location)
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingVmSizes = false))
      );
  }

  private _getAKSAvailableNodePoolVersionsForCreateMachineDeployment(): Observable<
    AKSNodePoolVersionForMachineDeployments[]
  > {
    this.isLoadingNodePoolVersions = true;
    return this._externalMachineDeploymentService
      .getAKSAvailableNodePoolVersionsForMachineDeployment(this.projectID, this.cluster.id)
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingNodePoolVersions = false))
      );
  }

  private _updateExternalClusterModel(): void {
    let version = this.controlValue(Controls.KubernetesVersion)?.main;
    const versionSplitArr = version?.split('.');
    if (versionSplitArr?.length && !(versionSplitArr[2] > 0)) {
      version = versionSplitArr[0] + '.' + versionSplitArr[1];
    }

    const config = {
      name: this.controlValue(Controls.Name),
      cloud: {
        aks: {
          ...this._externalClusterService.externalCluster?.cloud?.aks,
          name: this.controlValue(Controls.Name),
          resourceGroup: this.controlValue(Controls.NodeResourceGroup)?.[ComboboxControls.Select],
          location: this.controlValue(Controls.Location),
        } as AKSCloudSpec,
      } as ExternalCloudSpec,
      spec: {
        aksclusterSpec: {
          kubernetesVersion: version,
          machineDeploymentSpec: {
            name: this.controlValue(Controls.NodePoolName),
            basicSettings: {
              mode: this.controlValue(Controls.Mode),
              vmSize: this.controlValue(Controls.VmSize)?.[ComboboxControls.Select],
              count: this.controlValue(Controls.Count),
              enableAutoScaling: this.controlValue(Controls.EnableAutoScaling),
            } as AgentPoolBasics,
          } as AKSMachineDeploymentCloudSpec,
        } as AKSClusterSpec,
        version: version,
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

  private _updateExternalMachineDeployment(): void {
    const config = {
      name: this.controlValue(Controls.NodePoolName),
      cloud: {
        aks: {
          basicSettings: {
            mode: this.controlValue(Controls.Mode),
            orchestratorVersion: this.controlValue(Controls.KubernetesVersion)?.main,
            enableAutoScaling: this.controlValue(Controls.EnableAutoScaling),
            vmSize: this.controlValue(Controls.VmSize)?.[ComboboxControls.Select],
            count: this.controlValue(Controls.Count),
          } as AgentPoolBasics,
        } as AKSMachineDeploymentCloudSpec,
      } as ExternalMachineDeploymentCloudSpec,
    } as ExternalMachineDeployment;

    if (this.controlValue(Controls.EnableAutoScaling)) {
      config.cloud.aks.basicSettings.scalingConfig = {
        maxCount: this.controlValue(Controls.MaxCount),
        minCount: this.controlValue(Controls.MinCount),
      } as AKSNodegroupScalingConfig;
    }
    this._externalMachineDeploymentService.externalMachineDeployment = config;
  }

  private _clearVmSize(): void {
    this.vmSizes = [];
    this.vmSizeLabel = VMSizeState.Ready;
    this._vmSizeCombobox.reset();
    this._cdr.detectChanges();
  }
}
