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
import {StepBase} from '@app/external-cluster-wizard/steps/base';
import {ExternalClusterService} from '@core/services/external-cluster';
import {NameGeneratorService} from '@core/services/name-generator';
import {EKSCloudSpec, EKSClusterSpec, EKSSecurityGroup, EKSSubnet, EKSVpc} from '@shared/entity/provider/eks';
import {forkJoin} from 'rxjs';
import {debounceTime, finalize, takeUntil, tap} from 'rxjs/operators';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import {
  ExternalCloudSpec,
  ExternalCluster,
  ExternalClusterModel,
  ExternalClusterSpec,
} from '@shared/entity/external-cluster';
import {NodeDataService} from '@app/core/services/node-data/service';
import {ExternalMachineDeploymentService} from '@app/core/services/external-machine-deployment';
import {
  EKSMachineDeploymentCloudSpec,
  EKSScalingConfig,
  ExternalMachineDeployment,
  ExternalMachineDeploymentCloudSpec,
} from '@app/shared/entity/external-machine-deployment';
import {MasterVersion} from '@app/shared/entity/cluster';
import {ComboboxControls, FilteredComboboxComponent} from '@shared/components/combobox/component';

enum Controls {
  Name = 'name',
  Version = 'version',
  RoleArn = 'roleArn',
  Vpc = 'vpc',
  SubnetIds = 'subnetIds',
  SecurityGroupsIds = 'securityGroupIds',
  DiskSize = 'diskSize',
  MaxSize = 'maxSize',
  MinSize = 'minSize',
  DesiredSize = 'desiredSize',
}

enum SubnetState {
  Loading = 'Loading...',
  Ready = 'Subnets',
  Empty = 'No Subnets Available',
}

enum SecurityGroupState {
  Loading = 'Loading...',
  Ready = 'Security Groups',
  Empty = 'No Security Groups Available',
}

@Component({
  selector: 'km-eks-cluster-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EKSClusterSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EKSClusterSettingsComponent),
      multi: true,
    },
  ],
})
export class EKSClusterSettingsComponent
  extends StepBase
  implements OnInit, OnDestroy, ControlValueAccessor, Validator
{
  readonly Controls = Controls;
  isLoadingVpcs: boolean;
  vpcs: string[] = [];
  kubernetesVersions: string[] = [];
  maxNodeCount: number;
  minNodeCount: number;
  subnets: EKSSubnet[] = [];
  subnetLabel = SubnetState.Ready;
  securityGroupLabel = SecurityGroupState.Ready;
  securityGroups: EKSSecurityGroup[] = [];
  @Input() projectID: string;
  @Input() cluster: ExternalCluster;
  private readonly _debounceTime = 500;
  @ViewChild('subnetCombobox')
  private readonly _subnetCombobox: FilteredComboboxComponent;

  @ViewChild('securityGroupCombobox')
  private readonly _securityGroupCombobox: FilteredComboboxComponent;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
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

  getHint(control: Controls): string {
    switch (control) {
      case Controls.SubnetIds:
        if (this.isDialogView()) {
          return 'Select the subnets in your VPC where your nodes will run.';
        }
        return 'Select the subnets in your VPC where the control plane may place elastic network interfaces (ENIs) to facilitate communication with your cluster. Subnets specified must be in at least two different AZs';

      default:
        return '';
    }
  }

  private _initForm(): void {
    const DEFAULT_MD_DISKSIZE = 20;
    const DEFAULT_MD_MAXSIZE = 1;
    const DEFAULT_MD_MINSIZE = 1;
    const DEFAULT_MD_DESIRED_SIZE = 1;
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.RoleArn]: this._builder.control('', Validators.required),
      [Controls.Version]: this._builder.control(null, [Validators.required]),
      [Controls.Vpc]: this._builder.control(null, Validators.required),
      [Controls.SubnetIds]: this._builder.control([], Validators.required),
      [Controls.SecurityGroupsIds]: this._builder.control([], Validators.required),
      [Controls.DiskSize]: this._builder.control(DEFAULT_MD_DISKSIZE),
      [Controls.MaxSize]: this._builder.control(DEFAULT_MD_MAXSIZE),
      [Controls.MinSize]: this._builder.control(DEFAULT_MD_MINSIZE),
      [Controls.DesiredSize]: this._builder.control(DEFAULT_MD_DESIRED_SIZE),
    });

    if (!this.isDialogView()) {
      this.control(Controls.SubnetIds).disable();
      this.control(Controls.SecurityGroupsIds).disable();
    }
  }

  private _initSubscriptions(): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._updateExternalClusterModel();
      this._updateExternalMachineDeployment();
      this.maxNodeCount = this.controlValue(Controls.MaxSize);
      this.minNodeCount = this.controlValue(Controls.MinSize);
      this._externalClusterService.isClusterDetailsStepValid = this.form.valid;
      this._externalMachineDeploymentService.isAddMachineDeploymentFormValid = this.form.valid;
    });

    if (this.isDialogView()) {
      const version = this.cluster.spec.version;
      this.control(Controls.Vpc).clearValidators();
      this.control(Controls.SecurityGroupsIds).clearValidators();
      this.control(Controls.Version).setValue(version.slice(1, version.indexOf('-')));
      this.control(Controls.Version).disable();
      this.control(Controls.Vpc).setValue(this.cluster.spec.eksclusterSpec.vpcConfigRequest.vpcId);
      this.control(Controls.Vpc).disable();

      this.subnetLabel = SubnetState.Loading;
      this._externalMachineDeploymentService
        .getEKSSubnetsForMachineDeployment(this.projectID, this.cluster.id, this.controlValue(Controls.Vpc))
        .pipe(tap(_ => this._clearSubnet()))
        .subscribe((subnets: EKSSubnet[]) => {
          this.subnets = subnets;
          this.subnetLabel = this.subnets?.length ? SubnetState.Ready : SubnetState.Empty;
          this._cdr.detectChanges();
        });
    } else {
      this._getEKSKubernetesVersions();

      this.form
        .get(Controls.Vpc)
        .valueChanges.pipe(debounceTime(this._debounceTime))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => {
          this._clearSubnet();
          this._clearSecurityGroups();

          const vpc = this.controlValue(Controls.Vpc);
          if (vpc) {
            this._onVPCSelectionChange(vpc);
          }
          this._enable(!!vpc, Controls.SubnetIds);
          this._enable(!!vpc, Controls.SecurityGroupsIds);
        });
    }

    this._externalClusterService.regionChanges.pipe(takeUntil(this._unsubscribe)).subscribe(region => {
      if (!region) {
        return;
      }
      this._getEKSVpcs();
    });
  }

  private _getEKSVpcs(): void {
    this.isLoadingVpcs = true;
    this._externalClusterService
      .getEKSVpcs()
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingVpcs = false))
      )
      .subscribe((vpcs: EKSVpc[]) => {
        this.vpcs = vpcs.map((vpc: EKSVpc) => {
          if (vpc.default) {
            this.control(Controls.Vpc).setValue(vpc.id);
          }
          return vpc.id;
        });
      });
  }

  private _onVPCSelectionChange(vpc: string): void {
    this.subnetLabel = SubnetState.Loading;
    this.securityGroupLabel = SecurityGroupState.Loading;
    forkJoin([
      this._externalClusterService.getEKSSubnets(vpc),
      this._externalClusterService.getEKSSecurityGroups(vpc),
    ]).subscribe(([subnets, securityGroups]) => {
      this.subnets = subnets;
      this.securityGroups = securityGroups;
      this.subnetLabel = this.subnets?.length ? SubnetState.Ready : SubnetState.Empty;
      this.securityGroupLabel = this.securityGroups?.length ? SecurityGroupState.Ready : SecurityGroupState.Empty;
      this._cdr.detectChanges();
    });
  }

  private _getEKSKubernetesVersions(): void {
    this._externalClusterService.getEKSKubernetesVersions().subscribe(
      (versions: MasterVersion[]) =>
        (this.kubernetesVersions = versions.map(version => {
          if (version.default) {
            this.control(Controls.Version).setValue({main: version.version});
          }
          return version.version;
        }))
    );
  }

  private _updateExternalClusterModel(): void {
    let version = this.controlValue(Controls.Version)?.main;
    const versionSplitArr = version?.split('.');
    if (versionSplitArr?.length && !(versionSplitArr[2] > 0)) {
      version = versionSplitArr[0] + '.' + versionSplitArr[1];
    }

    this._externalClusterService.externalCluster = {
      ...this._externalClusterService.externalCluster,
      name: this.controlValue(Controls.Name),
      cloud: {
        eks: {
          ...this._externalClusterService.externalCluster.cloud?.eks,
          name: this.controlValue(Controls.Name),
        } as EKSCloudSpec,
      } as ExternalCloudSpec,
      spec: {
        eksclusterSpec: {
          roleArn: this.controlValue(Controls.RoleArn),
          version: version,
          vpcConfigRequest: {
            subnetIds: this.controlValue(Controls.SubnetIds)?.[ComboboxControls.Select],
            securityGroupIds: this.controlValue(Controls.SecurityGroupsIds)?.[ComboboxControls.Select],
          },
        } as EKSClusterSpec,
        version: version,
      } as ExternalClusterSpec,
    } as ExternalClusterModel;
  }

  private _updateExternalMachineDeployment(): void {
    this._externalMachineDeploymentService.externalMachineDeployment = {
      name: this.controlValue(Controls.Name),
      cloud: {
        eks: {
          diskSize: this.controlValue(Controls.DiskSize),
          scalingConfig: {
            desiredSize: this.controlValue(Controls.DesiredSize),
            maxSize: this.controlValue(Controls.MaxSize),
            minSize: this.controlValue(Controls.MinSize),
          } as EKSScalingConfig,
          nodeRole: this.controlValue(Controls.RoleArn),
          subnets: this.controlValue(Controls.SubnetIds)?.[ComboboxControls.Select],
        } as EKSMachineDeploymentCloudSpec,
      } as ExternalMachineDeploymentCloudSpec,
    } as ExternalMachineDeployment;
  }

  private _clearSubnet(): void {
    this.subnets = [];
    this.subnetLabel = SubnetState.Ready;
    this._subnetCombobox.reset();
    this._cdr.detectChanges();
  }

  private _clearSecurityGroups(): void {
    this.securityGroups = [];
    this.securityGroupLabel = SecurityGroupState.Ready;
    this._securityGroupCombobox.reset();
    this._cdr.detectChanges();
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }
}
