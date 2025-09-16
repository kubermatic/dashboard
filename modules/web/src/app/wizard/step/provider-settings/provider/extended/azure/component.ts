// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {PresetsService} from '@core/services/wizard/presets';
import {AutocompleteControls, AutocompleteInitialState} from '@shared/components/autocomplete/component';
import {AZURE_LOADBALANCER_SKUS, AzureCloudSpec, CloudSpec, Cluster, ClusterSpec} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {EMPTY, merge, Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  ResourceGroup = 'resourceGroup',
  VNetResourceGroup = 'vnetResourceGroup',
  RouteTable = 'routeTable',
  SecurityGroup = 'securityGroup',
  Subnet = 'subnet',
  VNet = 'vnet',
  LoadBalancerSKU = 'loadBalancerSKU',
  AssignAvailabilitySet = 'assignAvailabilitySet',
}

@Component({
  selector: 'km-wizard-azure-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AzureProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AzureProviderExtendedComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class AzureProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 1000;
  readonly Controls = Controls;
  resourceGroups: string[] = [];
  isLoadingResourceGroups = false;
  routeTables: string[] = [];
  isLoadingRouteTables = false;
  securityGroups: string[] = [];
  isLoadingSecurityGroups = false;
  vnets: string[] = [];
  isLoadingVnets = false;
  subnets: string[] = [];
  isLoadingSubnets = false;
  loadBalancerSKUs = AZURE_LOADBALANCER_SKUS;

  get selectedLoadBalancerSKU(): string {
    return this.form.get(Controls.LoadBalancerSKU).value;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService
  ) {
    super('Azure Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ResourceGroup]: this._builder.control(''),
      [Controls.VNetResourceGroup]: this._builder.control(''),
      [Controls.RouteTable]: this._builder.control(''),
      [Controls.SecurityGroup]: this._builder.control(''),
      [Controls.Subnet]: this._builder.control(''),
      [Controls.VNet]: this._builder.control(''),
      [Controls.LoadBalancerSKU]: this._builder.control(''),
      [Controls.AssignAvailabilitySet]: this._builder.control(true),
    });

    const resourceGroupChanges = merge(
      this.form.get(Controls.ResourceGroup).valueChanges,
      this.form.get(Controls.VNetResourceGroup).valueChanges
    );

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.AZURE))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(AzureCloudSpec.isEmpty(this._clusterSpecService.cluster.spec.cloud.azure))
      );

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls)
        .filter(control => control !== Controls.AssignAvailabilitySet)
        .forEach(control => this._enable(!preset, control))
    );

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        // TODO: This causes reset of all default values set in the init stage. It should be fixed.
        this.form.reset();
        this.form.get(Controls.AssignAvailabilitySet).setValue(true);
      });

    this._clusterSpecService.clusterChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.AZURE && this.hasRequiredCredentials()))
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => (!this.hasRequiredCredentials() ? this._clearResourceGroup() : null)))
      .pipe(switchMap(_ => this._resourceGroupObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(resourceGroups => {
        this.resourceGroups = resourceGroups;
        this._setIsLoadingResourceGroups(false);
      });

    this._getCredentialChanges(resourceGroupChanges)
      .pipe(tap(_ => (!this.hasRequiredCredentials() || !this._getResourceGroup() ? this._clearRouteTable() : null)))
      .pipe(switchMap(_ => (this._getResourceGroup() ? this._routeTableObservable() : of([]))))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(routeTables => {
        this.routeTables = routeTables;
        this._setIsLoadingRouteTables(false);
      });

    this._getCredentialChanges(resourceGroupChanges)
      .pipe(tap(_ => (!this.hasRequiredCredentials() || !this._getResourceGroup() ? this._clearSecurityGroup() : null)))
      .pipe(switchMap(_ => (this._getResourceGroup() ? this._securityGroupObservable() : of([]))))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(securityGroups => {
        this.securityGroups = securityGroups;
        this._setIsLoadingSecurityGroups(false);
      });

    this._getCredentialChanges(resourceGroupChanges)
      .pipe(tap(_ => (!this.hasRequiredCredentials() || !this._getResourceGroup() ? this._clearVNet() : null)))
      .pipe(switchMap(_ => (this._getResourceGroup() ? this._vnetObservable() : of([]))))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(vnets => {
        this.vnets = vnets;
        this._setIsLoadingVnets(false);
      });

    this._getCredentialChanges(resourceGroupChanges, this.form.get(Controls.VNet).valueChanges)
      .pipe(
        tap(_ =>
          !this.hasRequiredCredentials() || !this._getResourceGroup() || !this.getValueFromInternalForm(Controls.VNet)
            ? this._clearSubnet()
            : null
        )
      )
      .pipe(
        switchMap(_ =>
          this._getResourceGroup() && this.getValueFromInternalForm(Controls.VNet) ? this._subnetObservable() : of([])
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(subnets => {
        this.subnets = subnets;
        this._setIsLoadingSubnets(false);
      });

    this.form
      .get(Controls.ResourceGroup)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(rg => (this._clusterSpecService.cluster.spec.cloud.azure.resourceGroup = rg));

    this.form
      .get(Controls.VNetResourceGroup)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(vrg => (this._clusterSpecService.cluster.spec.cloud.azure.vnetResourceGroup = vrg));

    this.form
      .get(Controls.RouteTable)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(rt => (this._clusterSpecService.cluster.spec.cloud.azure.routeTable = rt));

    this.form
      .get(Controls.SecurityGroup)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(sg => (this._clusterSpecService.cluster.spec.cloud.azure.securityGroup = sg));

    this.form
      .get(Controls.VNet)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(v => (this._clusterSpecService.cluster.spec.cloud.azure.vnet = v));

    this.form
      .get(Controls.Subnet)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(s => (this._clusterSpecService.cluster.spec.cloud.azure.subnet = s));

    merge(
      this.form.get(Controls.LoadBalancerSKU).valueChanges,
      this.form.get(Controls.AssignAvailabilitySet).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasRequiredCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.azure.subscriptionID &&
      !!this._clusterSpecService.cluster.spec.cloud.azure.tenantID &&
      !!this._clusterSpecService.cluster.spec.cloud.azure.clientID &&
      !!this._clusterSpecService.cluster.spec.cloud.azure.clientSecret
    );
  }

  getValueFromInternalForm(control: Controls): string {
    const internalFormValue = this.form.get(control).value;
    return internalFormValue ? internalFormValue[AutocompleteControls.Main] : '';
  }

  clearLoadBalancerSKU(): void {
    this.form.get(Controls.LoadBalancerSKU).reset();
  }

  private _getResourceGroup(): string {
    const vNetResourceGroup = this.getValueFromInternalForm(Controls.VNetResourceGroup);
    return vNetResourceGroup ? vNetResourceGroup : this.getValueFromInternalForm(Controls.ResourceGroup);
  }

  private _resourceGroupObservable(): Observable<string[]> {
    let location = '';
    return this._datacenterService
      .getDatacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .pipe(take(1))
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.AZURE))
      .pipe(tap(dc => (location = dc.spec.azure.location)))
      .pipe(
        switchMap(_dc =>
          this._presets
            .provider(NodeProvider.AZURE)
            .clientID(this._clusterSpecService.cluster.spec.cloud.azure.clientID)
            .clientSecret(this._clusterSpecService.cluster.spec.cloud.azure.clientSecret)
            .subscriptionID(this._clusterSpecService.cluster.spec.cloud.azure.subscriptionID)
            .tenantID(this._clusterSpecService.cluster.spec.cloud.azure.tenantID)
            .location(location)
            .credential(this._presets.preset)
            .resourceGroups(() => this._setIsLoadingResourceGroups(true))
            .pipe(
              map(resourceGroups => _.sortBy(resourceGroups, rg => rg.toLowerCase())),
              catchError(() => {
                this._clearResourceGroup();
                return onErrorResumeNext(EMPTY);
              })
            )
        )
      );
  }

  private _clearResourceGroup(): void {
    this.resourceGroups = [];
    this.form.get(Controls.ResourceGroup).setValue(AutocompleteInitialState);
    this._setIsLoadingResourceGroups(false);
  }

  private _setIsLoadingResourceGroups(isLoading: boolean): void {
    this.isLoadingResourceGroups = isLoading;
    this._cdr.detectChanges();
  }

  private _routeTableObservable(): Observable<string[]> {
    let location = '';
    return this._getDatacenter()
      .pipe(tap(dc => (location = dc.spec.azure.location)))
      .pipe(
        switchMap(_dc =>
          this._presets
            .provider(NodeProvider.AZURE)
            .clientID(this._clusterSpecService.cluster.spec.cloud.azure.clientID)
            .clientSecret(this._clusterSpecService.cluster.spec.cloud.azure.clientSecret)
            .subscriptionID(this._clusterSpecService.cluster.spec.cloud.azure.subscriptionID)
            .tenantID(this._clusterSpecService.cluster.spec.cloud.azure.tenantID)
            .resourceGroup(this._getResourceGroup())
            .location(location)
            .credential(this._presets.preset)
            .routeTables(() => this._setIsLoadingRouteTables(true))
            .pipe(
              map(routeTables => _.sortBy(routeTables, rt => rt.toLowerCase())),
              catchError(() => {
                this._clearRouteTable();
                return onErrorResumeNext(EMPTY);
              })
            )
        )
      );
  }

  private _clearRouteTable(): void {
    this.routeTables = [];
    this.form.get(Controls.RouteTable).setValue(AutocompleteInitialState);
    this._setIsLoadingRouteTables(false);
  }

  private _setIsLoadingRouteTables(isLoading: boolean): void {
    this.isLoadingRouteTables = isLoading;
    this._cdr.detectChanges();
  }

  private _securityGroupObservable(): Observable<string[]> {
    let location = '';
    return this._getDatacenter()
      .pipe(tap(dc => (location = dc.spec.azure.location)))
      .pipe(
        switchMap(_dc =>
          this._presets
            .provider(NodeProvider.AZURE)
            .clientID(this._clusterSpecService.cluster.spec.cloud.azure.clientID)
            .clientSecret(this._clusterSpecService.cluster.spec.cloud.azure.clientSecret)
            .subscriptionID(this._clusterSpecService.cluster.spec.cloud.azure.subscriptionID)
            .tenantID(this._clusterSpecService.cluster.spec.cloud.azure.tenantID)
            .resourceGroup(this._getResourceGroup())
            .location(location)
            .credential(this._presets.preset)
            .securityGroups(() => this._setIsLoadingSecurityGroups(true))
            .pipe(
              map(securityGroups => _.sortBy(securityGroups, sg => sg.toLowerCase())),
              catchError(() => {
                this._clearSecurityGroup();
                return onErrorResumeNext(EMPTY);
              })
            )
        )
      );
  }

  private _clearSecurityGroup(): void {
    this.securityGroups = [];
    this.form.get(Controls.SecurityGroup).setValue(AutocompleteInitialState);
    this._setIsLoadingSecurityGroups(false);
  }

  private _setIsLoadingSecurityGroups(isLoading: boolean): void {
    this.isLoadingSecurityGroups = isLoading;
    this._cdr.detectChanges();
  }

  private _vnetObservable(): Observable<string[]> {
    let location = '';
    return this._getDatacenter()
      .pipe(tap(dc => (location = dc.spec.azure.location)))
      .pipe(
        switchMap(_dc =>
          this._presets
            .provider(NodeProvider.AZURE)
            .clientID(this._clusterSpecService.cluster.spec.cloud.azure.clientID)
            .clientSecret(this._clusterSpecService.cluster.spec.cloud.azure.clientSecret)
            .subscriptionID(this._clusterSpecService.cluster.spec.cloud.azure.subscriptionID)
            .tenantID(this._clusterSpecService.cluster.spec.cloud.azure.tenantID)
            .resourceGroup(this._getResourceGroup())
            .location(location)
            .credential(this._presets.preset)
            .vnets(() => this._setIsLoadingVnets(true))
            .pipe(
              map(vnets => _.sortBy(vnets, v => v.toLowerCase())),
              catchError(() => {
                this._clearVNet();
                return onErrorResumeNext(EMPTY);
              })
            )
        )
      );
  }

  private _clearVNet(): void {
    this.vnets = [];
    this.form.get(Controls.VNet).setValue(AutocompleteInitialState);
    this._setIsLoadingVnets(false);
  }

  private _setIsLoadingVnets(isLoading: boolean): void {
    this.isLoadingVnets = isLoading;
    this._cdr.detectChanges();
  }

  private _subnetObservable(): Observable<string[]> {
    return this._presets
      .provider(NodeProvider.AZURE)
      .clientID(this._clusterSpecService.cluster.spec.cloud.azure.clientID)
      .clientSecret(this._clusterSpecService.cluster.spec.cloud.azure.clientSecret)
      .subscriptionID(this._clusterSpecService.cluster.spec.cloud.azure.subscriptionID)
      .tenantID(this._clusterSpecService.cluster.spec.cloud.azure.tenantID)
      .resourceGroup(this._getResourceGroup())
      .vnet(this.getValueFromInternalForm(Controls.VNet))
      .credential(this._presets.preset)
      .subnets(() => this._setIsLoadingSubnets(true))
      .pipe(
        map(subnets => _.sortBy(subnets, s => s.toLowerCase())),
        catchError(() => {
          this._clearSubnet();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearSubnet(): void {
    this.subnets = [];
    this.form.get(Controls.Subnet).setValue(AutocompleteInitialState);
    this._setIsLoadingSubnets(false);
  }

  private _setIsLoadingSubnets(isLoading: boolean): void {
    this.isLoadingSubnets = isLoading;
    this._cdr.detectChanges();
  }

  private _getCredentialChanges(...changes: Observable<any>[]): Observable<any> {
    return merge(this._clusterSpecService.clusterChanges, ...changes)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.AZURE))
      .pipe(debounceTime(this._debounceTime));
  }

  private _getDatacenter(): Observable<Datacenter> {
    return this._datacenterService
      .getDatacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .pipe(take(1))
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.AZURE));
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          azure: {
            loadBalancerSKU: this.form.get(Controls.LoadBalancerSKU).value,
            assignAvailabilitySet: this.form.get(Controls.AssignAvailabilitySet).value,
          } as AzureCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
