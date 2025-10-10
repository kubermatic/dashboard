// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {KmValidators} from '@shared/validators/validators';
import {
  CredentialsType,
  OpenstackCredentialsTypeService,
} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {OpenstackLoadBalancerClass, OpenstackNetwork, OpenstackSubnet} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {EMPTY, merge, Observable, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, debounceTime, map, takeUntil, tap} from 'rxjs/operators';
import _ from 'lodash';
import { expandCollapse } from '@app/shared/animations/expand';

export interface LoadBalancerClassDialogData {
  loadBalancerClasses?: OpenstackLoadBalancerClass[];
  projectID: string;
}

enum Controls {
  Name = 'name',
  FloatingNetworkID = 'floatingNetworkID',
  FloatingSubnetID = 'floatingSubnetID',
  FloatingSubnetName = 'floatingSubnetName',
  FloatingSubnetTags = 'floatingSubnetTags',
  NetworkID = 'networkID',
  SubnetID = 'subnetID',
  MemberSubnetID = 'memberSubnetID',
}

enum ControlErrors {
  Duplicate = 'duplicate',
}

@Component({
  selector: 'km-openstack-lb-class-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
  animations: [expandCollapse],
})
export class OpenstackLoadBalancerClassDialogComponent implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly ControlErrors = ControlErrors;
  readonly displayedColumns: string[] = ['class', 'actions'];
  form: FormGroup;

  isPresetSelected = false;
  isFloatingNetworksLoading = false;
  isFloatingSubnetsLoading = false;
  isNetworksLoading = false;
  isSubnetsLoading = false;
  isMemberSubnetsLoading = false;

  floatingNetworks: OpenstackNetwork[] = [];
  floatingSubnets: OpenstackSubnet[] = [];
  networks: OpenstackNetwork[] = [];
  subnets: OpenstackSubnet[] = [];
  memberSubnets: OpenstackSubnet[] = [];
  openstackConfiguredClasses: OpenstackLoadBalancerClass[] = [];
  expandedStates: boolean[] = [];

  private readonly _unsubscribe = new Subject<void>();
  private readonly _debounceTime = 500;

  // Credential tracking
  private _domain = '';
  private _username = '';
  private _password = '';
  private _project = '';
  private _projectID = '';
  private _applicationCredentialID = '';
  private _applicationCredentialSecret = '';
  private _preset = '';

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _credentialsTypeService: OpenstackCredentialsTypeService,
    public dialogRef: MatDialogRef<OpenstackLoadBalancerClassDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LoadBalancerClassDialogData
  ) {}

  ngOnInit(): void {
    this._initForm();
    this._initNetworkSetup();

    // Load existing classes into the openstackConfiguredClasses list
    if (this.data?.loadBalancerClasses?.length > 0) {
      this.openstackConfiguredClasses = [...this.data.loadBalancerClasses];
      this.expandedStates = new Array(this.openstackConfiguredClasses.length).fill(false);
    }

    // Watch for floating network changes to load subnets
    this.form
      .get(Controls.FloatingNetworkID)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(networkID => {
        if (networkID) {
          this._loadFloatingSubnets(networkID);
        } else {
          this.floatingSubnets = [];
          this.form.get(Controls.FloatingSubnetID).setValue('');
          this.form.get(Controls.FloatingSubnetName).setValue('');
          this.form.get(Controls.FloatingSubnetTags).setValue([]);
        }
      });

    // Watch for floating subnet name changes to auto-populate ID
    this.form
      .get(Controls.FloatingSubnetName)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(subnetName => {
        if (subnetName) {
          const subnet = this.floatingSubnets.find(s => s.name === subnetName);
          if (subnet) {
            this.form.get(Controls.FloatingSubnetID).setValue(subnet.id);
          }
        } else {
          this.form.get(Controls.FloatingSubnetID).setValue('');
        }
      });

    // Watch for network changes to load subnets and member subnets
    this.form
      .get(Controls.NetworkID)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(networkID => {
        if (networkID) {
          this._loadSubnets(networkID);
          this._loadMemberSubnets(networkID);
        } else {
          this.subnets = [];
          this.memberSubnets = [];
          this.form.get(Controls.SubnetID).setValue('');
          this.form.get(Controls.MemberSubnetID).setValue('');
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNetworkDisplayName(network: OpenstackNetwork): string {
    return network.name ? `${network.name} (${network.id})` : network.id;
  }

  getSubnetDisplayName(subnet: OpenstackSubnet): string {
    return subnet.name ? `${subnet.name} (${subnet.id})` : subnet.id;
  }

  getDisplayNameForNetworkID(networkID: string): string {
    if (!networkID) return '-';
    const network = [...this.floatingNetworks, ...this.networks].find(n => n.id === networkID);
    return network?.name || networkID;
  }

  toggleExpanded(index: number): void {
    this.expandedStates[index] = !this.expandedStates[index];
  }

  addClass(): void {
    if (!this.form.valid) {
      return;
    }

    const floatingSubnetTags = this.form.get(Controls.FloatingSubnetTags).value;
    const newClass: OpenstackLoadBalancerClass = {
      name: this.form.get(Controls.Name).value,
      config: {
        floatingNetworkID: this.form.get(Controls.FloatingNetworkID).value || undefined,
        floatingSubnetID: this.form.get(Controls.FloatingSubnetID).value || undefined,
        floatingSubnetName: this.form.get(Controls.FloatingSubnetName).value || undefined,
        floatingSubnetTags: floatingSubnetTags?.length > 0 ? floatingSubnetTags.join(',') : undefined,
        networkID: this.form.get(Controls.NetworkID).value || undefined,
        subnetID: this.form.get(Controls.SubnetID).value || undefined,
        memberSubnetID: this.form.get(Controls.MemberSubnetID).value || undefined,
      },
    };

    this.openstackConfiguredClasses = [...this.openstackConfiguredClasses, newClass];
    this.expandedStates = [...this.expandedStates, false];
    this._updateNameValidator();
    this.form.reset();
    this.form.get(Controls.FloatingSubnetTags).setValue([]);
  }

  deleteClass(index: number): void {
    this.openstackConfiguredClasses = this.openstackConfiguredClasses.filter((_, i) => i !== index);
    this.expandedStates = this.expandedStates.filter((_, i) => i !== index);
    this._updateNameValidator();
  }

  clearForm(): void {
    this.form.reset();
    this.form.get(Controls.FloatingSubnetTags).setValue([]);
  }

  onSave(): void {
    this.dialogRef.close(this.openstackConfiguredClasses);
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Name]: ['', Validators.required],
      [Controls.FloatingNetworkID]: [''],
      [Controls.FloatingSubnetID]: [''],
      [Controls.FloatingSubnetName]: [''],
      [Controls.FloatingSubnetTags]: [[]],
      [Controls.NetworkID]: [''],
      [Controls.SubnetID]: [''],
      [Controls.MemberSubnetID]: [''],
    });
    this._updateNameValidator();
  }

  private _updateNameValidator(): void {
    const nameControl = this.form.get(Controls.Name);
    const existingNames = this.openstackConfiguredClasses.map(cls => cls.name);
    nameControl.setValidators([Validators.required, KmValidators.duplicate(existingNames)]);
    nameControl.updateValueAndValidity();
  }

  private _initNetworkSetup(): void {
    // Setup preset handling
    this._presets.presetDetailedChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
    });

    // Setup credential change watchers
    merge(
      this._clusterSpecService.clusterChanges,
      this._credentialsTypeService.credentialsTypeChanges,
      this._presets.presetChanges
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(
        tap(_ => {
          if (this._areCredentialsChanged()) {
            this._clearCredentials();
            this._loadNetworks();
            this._loadFloatingNetworks();
          }
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe();

    // Always load data when dialog opens
    this._loadNetworks();
    this._loadFloatingNetworks();
  }

  private _areCredentialsChanged(): boolean {
    const cloudSpec = this._clusterSpecService.cluster?.spec?.cloud?.openstack;
    const preset = this._presets.preset;

    if (this._credentialsTypeService.credentialsType === CredentialsType.Default) {
      return (
        this._domain !== cloudSpec?.domain ||
        this._username !== cloudSpec?.username ||
        this._password !== cloudSpec?.password ||
        this._project !== cloudSpec?.project ||
        this._projectID !== cloudSpec?.projectID ||
        this._preset !== preset
      );
    }
    return (
      this._applicationCredentialID !== cloudSpec?.applicationCredentialID ||
      this._applicationCredentialSecret !== cloudSpec?.applicationCredentialSecret ||
      this._project !== cloudSpec?.project ||
      this._projectID !== cloudSpec?.projectID ||
      this._preset !== preset
    );
  }

  private _clearCredentials(): void {
    const cloudSpec = this._clusterSpecService.cluster?.spec?.cloud?.openstack;
    const preset = this._presets.preset;

    this._domain = cloudSpec?.domain || '';
    this._username = cloudSpec?.username || '';
    this._password = cloudSpec?.password || '';
    this._project = cloudSpec?.project || '';
    this._projectID = cloudSpec?.projectID || '';
    this._applicationCredentialID = cloudSpec?.applicationCredentialID || '';
    this._applicationCredentialSecret = cloudSpec?.applicationCredentialSecret || '';
    this._preset = preset;
  }

  private _loadFloatingNetworks(): void {
    this.isFloatingNetworksLoading = true;
    this._floatingNetworkListObservable()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: networks => {
          this.floatingNetworks = networks;
          this.isFloatingNetworksLoading = false;
        },
        error: () => {
          this.floatingNetworks = [];
          this.isFloatingNetworksLoading = false;
        },
      });
  }

  private _floatingNetworkListObservable(): Observable<OpenstackNetwork[]> {
    const cloudSpec = this._clusterSpecService.cluster.spec.cloud.openstack;
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(cloudSpec.domain)
      .username(cloudSpec.username)
      .password(cloudSpec.password)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .project(cloudSpec.project)
      .projectID(cloudSpec.projectID)
      .applicationCredentialID(cloudSpec.applicationCredentialID)
      .applicationCredentialPassword(cloudSpec.applicationCredentialSecret)
      .networks()
      .pipe(map(networks => _.sortBy(networks, n => n.name?.toLowerCase())))
      .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }

  private _loadFloatingSubnets(networkID: string): void {
    this.isFloatingSubnetsLoading = true;
    this._subnetListObservable(networkID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: subnets => {
          this.floatingSubnets = subnets;
          this.isFloatingSubnetsLoading = false;
        },
        error: () => {
          this.floatingSubnets = [];
          this.isFloatingSubnetsLoading = false;
        },
      });
  }

  private _loadNetworks(): void {
    this.isNetworksLoading = true;
    this._networkListObservable()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: networks => {
          this.networks = networks.filter(network => !network.external);
          this.isNetworksLoading = false;
        },
        error: () => {
          this.networks = [];
          this.isNetworksLoading = false;
        },
      });
  }

  private _networkListObservable(): Observable<OpenstackNetwork[]> {
    const cloudSpec = this._clusterSpecService.cluster.spec.cloud.openstack;
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(cloudSpec.domain)
      .username(cloudSpec.username)
      .password(cloudSpec.password)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .project(cloudSpec.project)
      .projectID(cloudSpec.projectID)
      .applicationCredentialID(cloudSpec.applicationCredentialID)
      .applicationCredentialPassword(cloudSpec.applicationCredentialSecret)
      .networks()
      .pipe(map(networks => _.sortBy(networks, n => n.name?.toLowerCase())))
      .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }

  private _loadSubnets(networkID: string): void {
    this.isSubnetsLoading = true;
    this._subnetListObservable(networkID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: subnets => {
          this.subnets = subnets;
          this.isSubnetsLoading = false;
        },
        error: () => {
          this.subnets = [];
          this.isSubnetsLoading = false;
        },
      });
  }

  private _subnetListObservable(networkID: string): Observable<OpenstackSubnet[]> {
    const cloudSpec = this._clusterSpecService.cluster.spec.cloud.openstack;
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(cloudSpec.domain)
      .username(cloudSpec.username)
      .password(cloudSpec.password)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .project(cloudSpec.project)
      .projectID(cloudSpec.projectID)
      .applicationCredentialID(cloudSpec.applicationCredentialID)
      .applicationCredentialPassword(cloudSpec.applicationCredentialSecret)
      .subnets(networkID)
      .pipe(map(subnets => _.sortBy(subnets, s => s.name?.toLowerCase())))
      .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }

  private _loadMemberSubnets(networkID: string): void {
    this.isMemberSubnetsLoading = true;
    this._memberSubnetListObservable(networkID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: subnets => {
          this.memberSubnets = subnets;
          this.isMemberSubnetsLoading = false;
        },
        error: () => {
          this.memberSubnets = [];
          this.isMemberSubnetsLoading = false;
        },
      });
  }

  private _memberSubnetListObservable(networkID: string): Observable<OpenstackSubnet[]> {
    const cloudSpec = this._clusterSpecService.cluster.spec.cloud.openstack;
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(cloudSpec.domain)
      .username(cloudSpec.username)
      .password(cloudSpec.password)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .project(cloudSpec.project)
      .projectID(cloudSpec.projectID)
      .applicationCredentialID(cloudSpec.applicationCredentialID)
      .applicationCredentialPassword(cloudSpec.applicationCredentialSecret)
      .memberSubnets(networkID)
      .pipe(map(subnets => _.sortBy(subnets, s => s.name?.toLowerCase())))
      .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }
}
