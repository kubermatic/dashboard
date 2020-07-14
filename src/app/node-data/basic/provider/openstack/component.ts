// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import * as _ from 'lodash';
import {merge, Observable, of} from 'rxjs';
import {filter, first, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {DatacenterService} from '../../../../core/services';
import {FilteredComboboxComponent} from '../../../../shared/components/combobox/component';
import {ClusterType} from '../../../../shared/entity/cluster';

import {DatacenterOperatingSystemOptions} from '../../../../shared/entity/datacenter';
import {NodeCloudSpec, NodeSpec, OpenstackNodeSpec} from '../../../../shared/entity/node';
import {OpenstackAvailabilityZone, OpenstackFlavor} from '../../../../shared/entity/provider/openstack';
import {OperatingSystem} from '../../../../shared/model/NodeProviderConstants';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {ClusterService} from '../../../../shared/services/cluster.service';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Flavor = 'flavor',
  UseFloatingIP = 'useFloatingIP',
  DiskSize = 'diskSize',
  CustomDiskSize = 'customDiskSize',
  Image = 'image',
  AvailabilityZone = 'availabilityZone',
}

enum FlavorState {
  Ready = 'Flavor',
  Loading = 'Loading...',
  Empty = 'No Flavors Available',
}

enum AvailabilityZoneState {
  Ready = 'Availability Zone',
  Loading = 'Loading...',
  Empty = 'No Availability Zones Available',
}

@Component({
  selector: 'km-openstack-basic-node-data',
  styleUrls: ['./style.scss'],
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewInit {
  private _defaultImage = '';
  private _images: DatacenterOperatingSystemOptions;

  @ViewChild('flavorCombobox')
  private readonly _flavorCombobox: FilteredComboboxComponent;

  @ViewChild('availabilityZoneCombobox')
  private readonly _availabilityZoneCombobox: FilteredComboboxComponent;

  readonly Controls = Controls;

  flavors: OpenstackFlavor[] = [];
  selectedFlavor = '';
  flavorsLabel = FlavorState.Empty;
  availabilityZones: OpenstackAvailabilityZone[] = [];
  selectedAvailabilityZone = '';
  availabilityZonesLabel = AvailabilityZoneState.Empty;

  private get _availabilityZonesObservable(): Observable<OpenstackAvailabilityZone[]> {
    return this._nodeDataService.openstack
      .availabilityZones(this._clearAvailabilityZone.bind(this), this._onAvailabilityZoneLoading.bind(this))
      .pipe(
        map((availabilityZones: OpenstackAvailabilityZone[]) =>
          availabilityZones.sort((a, b) => (a.name < b.name ? -1 : 1))
        )
      )
      .pipe(first());
  }

  private get _flavorsObservable(): Observable<OpenstackFlavor[]> {
    return this._nodeDataService.openstack
      .flavors(this._clearFlavor.bind(this), this._onFlavorLoading.bind(this))
      .pipe(map((flavors: OpenstackFlavor[]) => flavors.sort((a, b) => (a.memory < b.memory ? -1 : 1))))
      .pipe(first());
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Flavor]: this._builder.control('', Validators.required),
      [Controls.UseFloatingIP]: this._builder.control(false),
      [Controls.DiskSize]: this._builder.control(null),
      [Controls.CustomDiskSize]: this._builder.control(''),
      [Controls.Image]: this._builder.control('', Validators.required),
      [Controls.AvailabilityZone]: this._builder.control(''),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.DiskSize).valueChanges,
      this.form.get(Controls.Image).valueChanges,
      this.form.get(Controls.UseFloatingIP).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._nodeDataService.nodeData = this._getNodeData();
      });

    merge<string>(this._clusterService.datacenterChanges, of(this._clusterService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc)))
      .pipe(tap(dc => (this._images = dc.spec.openstack.images)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        this._setDefaultImage(OperatingSystem.Ubuntu);
        this._enforceFloatingIP(dc.spec.openstack.enforce_floating_ip);
      });

    merge(this._clusterService.clusterTypeChanges, of(this._clusterService.clusterType))
      .pipe(filter(clusterType => !!clusterType))
      .pipe(filter(_ => !!this._images))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._isOpenshiftCluster()
          ? this._setDefaultImage(OperatingSystem.CentOS)
          : this._setDefaultImage(OperatingSystem.Ubuntu)
      );

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(_ => !!this._images))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultImage.bind(this));
  }

  ngAfterViewInit() {
    this._flavorsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultFlavor.bind(this));
    this._availabilityZonesObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setAvailabilityZone.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isFloatingIPEnforced(): boolean {
    return this.form.get(Controls.UseFloatingIP).disabled;
  }

  onFlavorChange(flavor: string): void {
    this._nodeDataService.nodeData.spec.cloud.openstack.flavor = flavor;
    this._nodeDataService.nodeDataChanges.next();
  }

  onAvailabilityZoneChange(availabilityZone: string): void {
    this._nodeDataService.nodeData.spec.cloud.openstack.availabilityZone = availabilityZone;
    this._nodeDataService.nodeDataChanges.next();
  }

  flavorDisplayName(slug: string): string {
    const flavor = this.flavors.find(flavor => flavor.slug === slug);
    return flavor
      ? `${flavor.slug} - ${flavor.memory / 1024} GB RAM, ${flavor.vcpus} CPU${flavor.vcpus !== 1 ? 's' : ''}, ${
          flavor.disk
        } GB Disk`
      : '';
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.openstack) {
      this.form.get(Controls.UseFloatingIP).setValue(this._nodeDataService.nodeData.spec.cloud.openstack.useFloatingIP);
      this.form.get(Controls.Image).setValue(this._nodeDataService.nodeData.spec.cloud.openstack.image);
      this.form.get(Controls.DiskSize).setValue(this._nodeDataService.nodeData.spec.cloud.openstack.diskSize);

      this._cdr.detectChanges();
    }
  }

  private _isOpenshiftCluster(): boolean {
    return this._clusterService.clusterType === ClusterType.OpenShift;
  }

  private _clearFlavor(): void {
    this.flavors = [];
    this.selectedFlavor = '';
    this.flavorsLabel = FlavorState.Empty;
    this._flavorCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onFlavorLoading(): void {
    this._clearFlavor();
    this.flavorsLabel = FlavorState.Loading;
    this._cdr.detectChanges();
  }

  private _setDefaultFlavor(flavors: OpenstackFlavor[]): void {
    this.flavors = flavors;
    this.selectedFlavor = this._nodeDataService.nodeData.spec.cloud.openstack.flavor;

    if (!this.selectedFlavor && !_.isEmpty(this.flavors)) {
      this.selectedFlavor = this.flavors[0].slug;
    }

    this.flavorsLabel = this.flavors.length > 0 ? FlavorState.Ready : FlavorState.Empty;
    this._cdr.detectChanges();
  }

  private _clearAvailabilityZone(): void {
    this.availabilityZones = [];
    this.availabilityZonesLabel = AvailabilityZoneState.Empty;
    this._availabilityZoneCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onAvailabilityZoneLoading(): void {
    this._clearAvailabilityZone();
    this.availabilityZonesLabel = AvailabilityZoneState.Loading;
    this._cdr.detectChanges();
  }

  private _setAvailabilityZone(availabilityZones: OpenstackAvailabilityZone[]): void {
    this.availabilityZones = availabilityZones;
    this.selectedAvailabilityZone = this._nodeDataService.nodeData.spec.cloud.openstack.availabilityZone;
    this.availabilityZonesLabel =
      this.availabilityZones.length > 0 ? AvailabilityZoneState.Ready : AvailabilityZoneState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultImage(os: OperatingSystem): void {
    switch (os) {
      case OperatingSystem.CentOS:
        this._defaultImage = this._images.centos;
        break;
      case OperatingSystem.Ubuntu:
        this._defaultImage = this._images.ubuntu;
        break;
      case OperatingSystem.SLES:
        this._defaultImage = this._images.sles;
        break;
      case OperatingSystem.ContainerLinux:
        this._defaultImage = this._images.coreos;
        break;
      case OperatingSystem.RHEL:
        this._defaultImage = this._images.rhel;
        break;
      case OperatingSystem.Flatcar:
        this._defaultImage = this._images.flatcar;
        break;
      default:
        this._defaultImage = this._images.ubuntu;
    }

    this.form.get(Controls.Image).setValue(this._defaultImage);
    this._cdr.detectChanges();
  }

  private _enforceFloatingIP(isEnforced: boolean): void {
    if (isEnforced) {
      this.form.get(Controls.UseFloatingIP).setValue(true);
      this.form.get(Controls.UseFloatingIP).disable();
      return;
    }

    if (!this._nodeDataService.isInWizardMode() && !this._clusterService.cluster.spec.cloud.openstack.floatingIpPool) {
      this.form.get(Controls.UseFloatingIP).setValue(false);
      this.form.get(Controls.UseFloatingIP).disable();
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          openstack: {
            image: this.form.get(Controls.Image).value,
            useFloatingIP: this.form.get(Controls.UseFloatingIP).value,
            diskSize: this.form.get(Controls.DiskSize).value,
          } as OpenstackNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
