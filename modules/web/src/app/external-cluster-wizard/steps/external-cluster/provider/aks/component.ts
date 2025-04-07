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
import {MatCheckboxChange} from '@angular/material/checkbox';
import {StepBase} from '@app/external-cluster-wizard/steps/base';
import {ExternalClusterService} from '@core/services/external-cluster';
import {NameGeneratorService} from '@core/services/name-generator';
import {ErrorType} from '@shared/types/error-type';
import {Observable, of} from 'rxjs';
import {debounceTime, switchMap, takeUntil, tap, filter} from 'rxjs/operators';
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
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {ProjectService} from '@core/services/project';

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

export enum NodePoolVersionState {
  Ready = 'Kubernetes Version',
  Loading = 'Loading...',
  Empty = 'No Kubernetes Versions Available',
}

@Component({
  selector: 'km-aks-cluster-settings',
  templateUrl: './template.html',
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
  standalone: false,
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
  readonly MIN_COUNT_DEFAULT_VALUE = 1;
  readonly MAX_COUNT_DEFAULT_VALUE = 5;
  readonly DEFAULT_LOCATION = 'eastus';
  readonly DEFAULT_VMSIZE = 'Standard_DS2_v2';
  @Input() projectID: string;
  @Input() cluster: ExternalCluster;
  @Input() quotaWidget: TemplateRef<QuotaWidgetComponent>;
  vmSizeLabel = VMSizeState.Ready;
  vmSizes: AKSVMSize[] = [];
  locationLabel = LocationState.Ready;
  locations: AKSLocation[] = [];
  securityGroups: EKSSecurityGroup[] = [];
  nodePoolVersionsForMDLabel = NodePoolVersionState.Ready;
  nodePoolVersionsForMD: AKSNodePoolVersionForMachineDeployments[] = [];
  kubernetesVersions: string[] = [];
  resourceGroupLabel = ResourceGroupState.Ready;
  resourceGroups: AzureResourceGroup[] = [];

  @ViewChild('nodePoolVersionsForMDCombobox')
  private readonly _nodePoolVersionsForMDCombobox: FilteredComboboxComponent;

  @ViewChild('vmSizeCombobox')
  private readonly _vmSizeCombobox: FilteredComboboxComponent;

  private readonly _debounceTime = 500;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _projectService: ProjectService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
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
        [Controls.MaxCount]: this.MAX_COUNT_DEFAULT_VALUE,
        [Controls.MinCount]: this.MIN_COUNT_DEFAULT_VALUE,
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
      [Controls.MaxCount]: this._builder.control(this.MAX_COUNT_DEFAULT_VALUE, [
        Validators.required,
        Validators.max(this.AUTOSCALING_MAX_VALUE),
      ]),
      [Controls.MinCount]: this._builder.control(this.MIN_COUNT_DEFAULT_VALUE, [
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
      this._getAKSVmSizesForMachineDeployment(this.cluster.cloud.aks.location).subscribe((vmSizes: AKSVMSize[]) => {
        this.vmSizes = vmSizes;
        const defaultValue = this.vmSizes.find((vmSize: AKSVMSize) => vmSize.name === this.DEFAULT_VMSIZE);
        if (defaultValue) {
          this.control(Controls.VmSize).setValue(defaultValue.name);
        }
        this.vmSizeLabel = this.vmSizes?.length ? VMSizeState.Ready : VMSizeState.Empty;
      });

      this.nodePoolVersionsForMDLabel = NodePoolVersionState.Loading;
      this._getAKSAvailableNodePoolVersionsForCreateMachineDeployment()
        .pipe(tap(_ => this._clearNodePoolVersions()))
        .subscribe((nodePoolVersions: AKSNodePoolVersionForMachineDeployments[]) => {
          this.nodePoolVersionsForMD = nodePoolVersions;
          this.nodePoolVersionsForMDLabel = this.nodePoolVersionsForMD?.length
            ? NodePoolVersionState.Ready
            : NodePoolVersionState.Empty;
          nodePoolVersions.forEach((nodePoolVersion: AKSNodePoolVersionForMachineDeployments) => {
            if (nodePoolVersion.default) {
              this.control(Controls.KubernetesVersion).setValue(nodePoolVersion.version);
            }
          });
        });
    } else {
      this._getAKSKubernetesVersions();
      this._getAKSLocations();
      this._getAKSResourceGroups();

      this.control(Controls.Location)
        .valueChanges.pipe(debounceTime(this._debounceTime))
        .pipe(tap(_ => this._clearVmSize()))
        .pipe(
          switchMap(() => {
            let obs$;
            const locationValue = this.controlValue(Controls.Location)?.[ComboboxControls.Select];
            if (locationValue) {
              obs$ = this._getAKSVmSizes(locationValue);
            } else {
              obs$ = of([]);
            }
            this.vmSizeLabel = VMSizeState.Loading;
            return obs$;
          })
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((vmSizes: AKSVMSize[]) => {
          this.vmSizes = vmSizes;
          const defaultValue = this.vmSizes.find((vmSize: AKSVMSize) => vmSize.name === this.DEFAULT_VMSIZE);
          defaultValue && this.control(Controls.VmSize).setValue(defaultValue.name);
          this.vmSizeLabel = this.vmSizes?.length ? VMSizeState.Ready : VMSizeState.Empty;
        });

      this._externalClusterService.presetChanges
        .pipe(
          filter(preset => !!preset),
          takeUntil(this._unsubscribe)
        )
        .subscribe(_ => {
          this._getAKSKubernetesVersions();
          this._getAKSLocations();
          this._getAKSResourceGroups();
        });
    }
  }

  private _getAKSVmSizes(location: string): Observable<AKSVMSize[]> {
    return this._externalClusterService
      .getAKSVmSizes(this._projectService.selectedProjectID, location)
      .pipe(takeUntil(this._unsubscribe));
  }

  private _getAKSKubernetesVersions(): void {
    this._externalClusterService.getAKSKubernetesVersions(this._projectService.selectedProjectID).subscribe(
      (versions: MasterVersion[]) =>
        (this.kubernetesVersions = versions.map(version => {
          return version.version;
        }))
    );
  }

  private _getAKSLocations(): void {
    this.locationLabel = LocationState.Loading;
    this._externalClusterService
      .getAKSLocations(this._projectService.selectedProjectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((locations: AKSLocation[]) => {
        this.locations = locations;
        this.locationLabel = this.locations?.length ? LocationState.Ready : LocationState.Empty;
        locations.forEach((location: AKSLocation) => {
          if (location.name === this.DEFAULT_LOCATION) {
            this.control(Controls.Location).setValue(this.DEFAULT_LOCATION);
          }
        });
      });
  }

  private _getAKSResourceGroups(): void {
    this.resourceGroupLabel = ResourceGroupState.Loading;
    this._externalClusterService
      .getAKSResourceGroups(this._projectService.selectedProjectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((resourceGroups: AzureResourceGroup[]) => {
        this.resourceGroups = resourceGroups;
        this.resourceGroupLabel = this.resourceGroups?.length ? ResourceGroupState.Ready : ResourceGroupState.Empty;
      });
  }

  private _getAKSVmSizesForMachineDeployment(location?: string): Observable<AKSVMSize[]> {
    return this._externalMachineDeploymentService
      .getAKSVmSizesForMachineDeployment(this.projectID, this.cluster.id, location)
      .pipe(takeUntil(this._unsubscribe));
  }

  private _getAKSAvailableNodePoolVersionsForCreateMachineDeployment(): Observable<
    AKSNodePoolVersionForMachineDeployments[]
  > {
    return this._externalMachineDeploymentService
      .getAKSAvailableNodePoolVersionsForMachineDeployment(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe));
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
          location: this.controlValue(Controls.Location)?.[ComboboxControls.Select],
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
            orchestratorVersion: this.controlValue(Controls.KubernetesVersion)?.[ComboboxControls.Select],
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

  private _clearNodePoolVersions(): void {
    this.nodePoolVersionsForMD = [];
    this.nodePoolVersionsForMDLabel = NodePoolVersionState.Ready;
    this._nodePoolVersionsForMDCombobox.reset();
    this._cdr.detectChanges();
  }

  private _clearVmSize(): void {
    this.vmSizes = [];
    this.vmSizeLabel = VMSizeState.Ready;
    this._vmSizeCombobox.reset();
    this._cdr.detectChanges();
  }
}
