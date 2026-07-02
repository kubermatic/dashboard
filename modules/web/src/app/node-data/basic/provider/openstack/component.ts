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
import {GlobalModule} from '@core/services/global/module';
import {DynamicModule} from '@dynamic/module-registry';
import {duration} from 'moment';
import _ from 'lodash';
import {combineLatest, merge, Observable, of} from 'rxjs';
import {distinctUntilChanged, filter, map, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataService} from '@core/services/node-data/service';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {Datacenter, DatacenterOperatingSystemOptions} from '@shared/entity/datacenter';
import {NodeCloudSpec, NodeSpec, OpenstackNodeSpec} from '@shared/entity/node';
import {OpenstackAvailabilityZone, OpenstackFlavor, OpenstackImage, OpenstackServerGroup} from '@shared/entity/provider/openstack';
import {OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {SettingsService} from '@core/services/settings';
import {getDefaultForOS} from '@shared/utils/node';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {ResourceQuotaCalculationPayload} from '@shared/entity/quota';

enum Controls {
  Flavor = 'flavor',
  UseFloatingIP = 'useFloatingIP',
  CustomDiskSize = 'customDiskSize',
  UseCustomDisk = 'useCustomDisk',
  Image = 'image',
  AvailabilityZone = 'availabilityZone',
  InstanceReadyCheckPeriod = 'instanceReadyCheckPeriod',
  InstanceReadyCheckTimeout = 'instanceReadyCheckTimeout',
  ServerGroup = 'serverGroup',
  EnableConfigDrive = 'enableConfigDrive',
}

enum AvailabilityZoneState {
  Ready = 'Availability Zone',
  Loading = 'Loading...',
  Empty = 'No Availability Zones Available',
}

enum ServerGroupState {
  Ready = 'Server Group',
  Loading = 'Loading...',
  Empty = 'No Server Groups Available',
}

enum ImageState {
  Ready = 'Image',
  Loading = 'Loading...',
  Empty = 'No Images Available',
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
  standalone: false,
})
export class OpenstackBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewInit {
  private _defaultImage = '';
  private _defaultOS: OperatingSystem;
  private _images: DatacenterOperatingSystemOptions;
  private _imageDiscoveryEnabled = false;
  private readonly _instanceReadyCheckPeriodDefault = 5; // seconds
  private readonly _instanceReadyCheckTimeoutDefault = 120; // seconds
  private _initialQuotaCalculationPayload: ResourceQuotaCalculationPayload;

  @ViewChild('availabilityZoneCombobox') private readonly _availabilityZoneCombobox: FilteredComboboxComponent;

  @ViewChild('serverGroupCombobox') private readonly _serverGroupCombobox: FilteredComboboxComponent;

  @ViewChild('imageCombobox') private readonly _imageCombobox: FilteredComboboxComponent;

  readonly Controls = Controls;
  flavors: OpenstackFlavor[] = [];
  selectedFlavor = '';
  isLoadingFlavors = false;
  availabilityZones: OpenstackAvailabilityZone[] = [];
  selectedAvailabilityZone = '';
  availabilityZonesLabel = AvailabilityZoneState.Empty;
  serverGroups: OpenstackServerGroup[] = [];
  selectedServerGroup = '';
  selectedServerGroupID = '';
  serverGroupLabel = ServerGroupState.Empty;
  images: OpenstackImage[] = [];
  selectedImage = '';
  imageLabel = ImageState.Empty;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  isInWizardMode: boolean;

  private _quotaCalculationService: QuotaCalculationService;

  private get _availabilityZonesObservable(): Observable<OpenstackAvailabilityZone[]> {
    return this._nodeDataService.openstack
      .availabilityZones(this._clearAvailabilityZone.bind(this), this._onAvailabilityZoneLoading.bind(this))
      .pipe(
        map((availabilityZones: OpenstackAvailabilityZone[]) =>
          availabilityZones.sort((a, b) => (a.name < b.name ? -1 : 1))
        )
      );
  }

  private get _flavorsObservable(): Observable<OpenstackFlavor[]> {
    return this._nodeDataService.openstack
      .flavors(this._clearFlavor.bind(this), this._onFlavorLoading.bind(this))
      .pipe(map((flavors: OpenstackFlavor[]) => flavors.sort((a, b) => (a.memory < b.memory ? -1 : 1))));
  }

  private get _serverGroupsObservable(): Observable<OpenstackServerGroup[]> {
    return this._nodeDataService.openstack
      .serverGroups(this._clearServerGroup.bind(this), this._onServerGroupsLoading.bind(this))
      .pipe(map((serverGroups: OpenstackServerGroup[]) => serverGroups.sort((a, b) => (a.name < b.name ? -1 : 1))));
  }

  private _imagesObservable(os: string): Observable<OpenstackImage[]> {
    return this._nodeDataService.openstack
      .images(os, this._clearImage.bind(this), this._onImageLoading.bind(this))
      .pipe(map((images: OpenstackImage[]) => images.sort((a, b) => (a.name < b.name ? -1 : 1))));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _settingsService: SettingsService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();

    if (this.isEnterpriseEdition) {
      this._quotaCalculationService = GlobalModule.injector.get(QuotaCalculationService);
    }
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Flavor]: this._builder.control('', Validators.required),
      [Controls.UseFloatingIP]: this._builder.control(false),
      [Controls.CustomDiskSize]: this._builder.control(null),
      [Controls.UseCustomDisk]: this._builder.control(false),
      [Controls.Image]: this._builder.control('', Validators.required),
      [Controls.AvailabilityZone]: this._builder.control(''),
      [Controls.InstanceReadyCheckPeriod]: this._builder.control(this._instanceReadyCheckPeriodDefault),
      [Controls.InstanceReadyCheckTimeout]: this._builder.control(this._instanceReadyCheckTimeoutDefault),
      [Controls.ServerGroup]: this._builder.control(''),
      [Controls.EnableConfigDrive]: this._builder.control(false),
    });

    this.isInWizardMode = this._nodeDataService.isInWizardMode();

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.CustomDiskSize).valueChanges,
      this.form.get(Controls.UseCustomDisk).valueChanges,
      this.form.get(Controls.Image).valueChanges,
      this.form.get(Controls.UseFloatingIP).valueChanges,
      this.form.get(Controls.InstanceReadyCheckPeriod).valueChanges,
      this.form.get(Controls.InstanceReadyCheckTimeout).valueChanges,
      this.form.get(Controls.EnableConfigDrive).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._nodeDataService.nodeData = this._getNodeData();
      });

    merge(this._clusterSpecService.datacenterChanges, of(this._clusterSpecService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(tap(dc => (this._images = dc.spec.openstack.images)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        if (this._nodeDataService.operatingSystem) {
          this._setDefaultImage(this._nodeDataService.operatingSystem);
        }
        this._enforceFloatingIP(dc.spec.openstack.enforceFloatingIP);
        this._enforceConfigDrive(dc);
      });

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(_ => !!this._images))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultImage.bind(this));

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (settings.providerConfiguration?.openStack?.enforceCustomDisk) {
        this.form.get(Controls.UseCustomDisk).setValue(true);
        this.form.get(Controls.UseCustomDisk).disable();
        this.form.get(Controls.CustomDiskSize).setValidators(Validators.required);
        this.form.get(Controls.CustomDiskSize).updateValueAndValidity();
      } else if (this.form.get(Controls.UseCustomDisk).disabled) {
        this.form.get(Controls.UseCustomDisk).enable();
        this.form.get(Controls.CustomDiskSize).clearValidators();
        this.form.get(Controls.UseCustomDisk).setValue(false);
      }
    });
  }

  ngAfterViewInit() {
    this._flavorsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultFlavor.bind(this));
    this._serverGroupsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultServerGroup.bind(this));
    this._availabilityZonesObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setAvailabilityZone.bind(this));
    // Image discovery is gated by the admin setting
    // providerConfiguration.openStack.enableImageDiscovery (default false).
    const imageDiscoveryEnabled$ = this._settingsService.adminSettings.pipe(
      map(settings => !!settings.providerConfiguration?.openStack?.enableImageDiscovery),
      distinctUntilChanged()
    );
    const operatingSystem$ = this._nodeDataService.operatingSystemChanges.pipe(
      startWith(this._nodeDataService.operatingSystem),
      filter(os => !!os)
    );

    // When enabled, list project-scoped images filtered by the selected OS
    // (os_distro, backend-side); re-fetch on OS change. Backend falls back to the
    // datacenter preset when no image matches the os_distro.
    combineLatest([imageDiscoveryEnabled$, operatingSystem$])
      .pipe(filter(([enabled]) => enabled))
      .pipe(switchMap(([, os]) => this._imagesObservable(os)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setImages.bind(this));

    // Track the gate; when disabled show only the datacenter preset (single-value,
    // non-editable dropdown) via _setDefaultImage.
    imageDiscoveryEnabled$.pipe(takeUntil(this._unsubscribe)).subscribe(enabled => {
      this._imageDiscoveryEnabled = enabled;
      this._setDefaultImage(this._nodeDataService.operatingSystem);
    });

    this.form
      .get(Controls.Flavor)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(flavor => this.onFlavorChange(flavor));

    this.form
      .get(Controls.Flavor)
      .valueChanges.pipe(filter(_ => this.isEnterpriseEdition))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const payload = this._getQuotaCalculationPayload();
        if (payload) {
          this._quotaCalculationService.refreshQuotaCalculations(payload);
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isFloatingIPEnforced(): boolean {
    return this.form.get(Controls.UseFloatingIP).disabled;
  }

  isConfigDriveEnforced(): boolean {
    return this.form.get(Controls.EnableConfigDrive).disabled;
  }

  isDiskSizeRequired(): boolean {
    return this.form.get(Controls.CustomDiskSize).hasValidator(Validators.required);
  }

  onFlavorChange(flavor: string): void {
    this._nodeDataService.nodeData.spec.cloud.openstack.flavor = flavor;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onAvailabilityZoneChange(availabilityZone: string): void {
    this._nodeDataService.nodeData.spec.cloud.openstack.availabilityZone = availabilityZone;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onServerGroupChange(serverGroup: string): void {
    this.selectedServerGroupID = this.serverGroups.find(key => key.name === serverGroup)?.id;
    this._nodeDataService.nodeData.spec.cloud.openstack.serverGroup = this.selectedServerGroupID;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onImageChange(image: string): void {
    // km-combobox emits the selected option's string value; keep it as the
    // source of truth (the outer form control wraps it in a {select: ...} object).
    this.selectedImage = image;
    this._nodeDataService.nodeData.spec.cloud.openstack.image = image;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.openstack) {
      const instanceReadyCheckPeriod = duration(
        `PT${this._nodeDataService.nodeData.spec.cloud.openstack.instanceReadyCheckPeriod}`.toUpperCase()
      ).asSeconds();
      const instanceReadyCheckTimeout = duration(
        `PT${this._nodeDataService.nodeData.spec.cloud.openstack.instanceReadyCheckTimeout}`.toUpperCase()
      ).asSeconds();

      const diskSize = this._nodeDataService.nodeData.spec.cloud.openstack.diskSize;
      this.form.get(Controls.UseFloatingIP).setValue(this._nodeDataService.nodeData.spec.cloud.openstack.useFloatingIP);
      this.form.get(Controls.Image).setValue(this._nodeDataService.nodeData.spec.cloud.openstack.image);
      this.selectedImage = this._nodeDataService.nodeData.spec.cloud.openstack.image || '';
      this.form.get(Controls.CustomDiskSize).setValue(diskSize);
      this.form.get(Controls.UseCustomDisk).setValue(!!diskSize);
      this.form.get(Controls.InstanceReadyCheckPeriod).setValue(instanceReadyCheckPeriod);
      this.form.get(Controls.InstanceReadyCheckTimeout).setValue(instanceReadyCheckTimeout);
      this.form
        .get(Controls.EnableConfigDrive)
        .setValue(this._nodeDataService.nodeData.spec.cloud.openstack?.configDrive ?? false);

      this._defaultOS = this._nodeDataService.operatingSystem;
      this._defaultImage = this._nodeDataService.nodeData.spec.cloud.openstack.image;

      if (this._nodeDataService.nodeData.spec.cloud.openstack.serverGroup) {
        const serverGroup = this.serverGroups.find(
          key => key.id === this._nodeDataService.nodeData.spec.cloud.openstack.serverGroup
        )?.name;

        this.selectedServerGroupID = this._nodeDataService.nodeData.spec.cloud.openstack.serverGroup;
        this.form.get(Controls.ServerGroup).setValue(serverGroup);
      }

      this._cdr.detectChanges();
    }
  }

  private _clearFlavor(): void {
    this.flavors = [];
    this.selectedFlavor = '';
    this.isLoadingFlavors = false;
    this._cdr.detectChanges();
  }

  private _clearServerGroup(): void {
    this.serverGroups = [];
    this.selectedServerGroup = '';
    this.selectedServerGroupID = '';
    this.serverGroupLabel = ServerGroupState.Empty;
    this._serverGroupCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onServerGroupsLoading(): void {
    this.serverGroupLabel = ServerGroupState.Loading;
    this._cdr.detectChanges();
  }

  private _onFlavorLoading(): void {
    this.isLoadingFlavors = true;
    this._cdr.detectChanges();
  }

  private _setDefaultFlavor(flavors: OpenstackFlavor[]): void {
    this.flavors = flavors;
    this.selectedFlavor = this._nodeDataService.nodeData.spec.cloud.openstack.flavor;

    if (!this.selectedFlavor && !_.isEmpty(this.flavors)) {
      this.selectedFlavor = this.flavors[0].slug;
    }

    this.isLoadingFlavors = false;
    this._cdr.detectChanges();
  }

  private _setDefaultServerGroup(serverGroups: OpenstackServerGroup[]): void {
    this.serverGroups = serverGroups;
    this.selectedServerGroupID = this._nodeDataService.nodeData.spec.cloud.openstack.serverGroup;

    if (this.selectedServerGroupID) {
      this.selectedServerGroup = this.serverGroups.find(key => key.id === this.selectedServerGroupID)?.name;
    }

    this.serverGroupLabel = !_.isEmpty(this.serverGroups) ? ServerGroupState.Ready : ServerGroupState.Empty;
    this._cdr.detectChanges();
  }

  private _clearAvailabilityZone(): void {
    this.availabilityZones = [];
    this.availabilityZonesLabel = AvailabilityZoneState.Empty;
    this._availabilityZoneCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onAvailabilityZoneLoading(): void {
    this.availabilityZonesLabel = AvailabilityZoneState.Loading;
    this._cdr.detectChanges();
  }

  private _setAvailabilityZone(availabilityZones: OpenstackAvailabilityZone[]): void {
    this.availabilityZones = availabilityZones;
    this.selectedAvailabilityZone = this._nodeDataService.nodeData.spec.cloud.openstack.availabilityZone;
    this.availabilityZonesLabel = !_.isEmpty(this.availabilityZones)
      ? AvailabilityZoneState.Ready
      : AvailabilityZoneState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultImage(os: OperatingSystem): void {
    const dcDefaultImage = getDefaultForOS(os, this._images);

    if (_.isEmpty(this._defaultImage)) {
      this._defaultImage = dcDefaultImage;
    }

    const imageToSelect = os === this._defaultOS ? this._defaultImage : dcDefaultImage;

    this.selectedImage = imageToSelect;
    this.form.get(Controls.Image).setValue(imageToSelect);

    if (this._imageDiscoveryEnabled) {
      // Discovery on: keep the fetched list, just ensure the default is selectable.
      if (!_.isEmpty(this.images)) {
        const found = this.images.find(img => img.name === imageToSelect);
        if (!found && !_.isEmpty(imageToSelect)) {
          this.images = [...this.images, {id: '', name: imageToSelect}];
        }
      }
    } else {
      // Discovery off: single-value, non-editable dropdown with the preset image.
      this.images = _.isEmpty(imageToSelect) ? [] : [{id: '', name: imageToSelect}];
      this.imageLabel = _.isEmpty(this.images) ? ImageState.Empty : ImageState.Ready;
      this._setImageControlEnabled(false);
    }

    this._cdr.detectChanges();
  }

  private _setImageControlEnabled(enabled: boolean): void {
    const control = this.form.get(Controls.Image);
    if (enabled && control.disabled) {
      control.enable({emitEvent: false});
    } else if (!enabled && control.enabled) {
      control.disable({emitEvent: false});
    }
  }

  private _clearImage(): void {
    this.images = [];
    this.selectedImage = '';
    this.imageLabel = ImageState.Empty;
    this._imageCombobox?.reset();
    this.form.get(Controls.Image).enable({emitEvent: false});
    this._cdr.detectChanges();
  }

  private _onImageLoading(): void {
    // Disable the dropdown while images are being fetched so a stale list cannot
    // be selected before the response for the new OS arrives.
    this.imageLabel = ImageState.Loading;
    this.form.get(Controls.Image).disable({emitEvent: false});
    this._cdr.detectChanges();
  }

  private _setImages(images: OpenstackImage[]): void {
    const currentImage = this.selectedImage || this._defaultImage;

    if (!_.isEmpty(currentImage) && !images.find(img => img.name === currentImage)) {
      this.images = [...images, {id: '', name: currentImage}];
    } else {
      this.images = images;
    }

    this.selectedImage = currentImage;
    this.imageLabel = !_.isEmpty(this.images) ? ImageState.Ready : ImageState.Empty;
    // Only allow interaction when there is more than one option to choose from.
    this._setImageControlEnabled(this.images.length > 1);
    this._cdr.detectChanges();
  }

  private _enforceFloatingIP(isEnforced: boolean): void {
    if (isEnforced) {
      this.form.get(Controls.UseFloatingIP).setValue(true);
      this.form.get(Controls.UseFloatingIP).disable();
      return;
    }

    if (!this.isInWizardMode && !this._clusterSpecService.cluster.spec.cloud.openstack.floatingIPPool) {
      this.form.get(Controls.UseFloatingIP).setValue(false);
      this.form.get(Controls.UseFloatingIP).disable();
    }
  }

  private _enforceConfigDrive(dc: Datacenter): void {
    if (dc.spec.openstack.enableConfigDrive) {
      this.form.get(Controls.EnableConfigDrive).setValue(true);
      this.form.get(Controls.EnableConfigDrive).disable();
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          openstack: {
            image: this.selectedImage,
            useFloatingIP: this.form.get(Controls.UseFloatingIP).value,
            diskSize: this.form.get(Controls.UseCustomDisk).value ? this.form.get(Controls.CustomDiskSize).value : null,
            instanceReadyCheckPeriod: `${this.form.get(Controls.InstanceReadyCheckPeriod).value}s`,
            instanceReadyCheckTimeout: `${this.form.get(Controls.InstanceReadyCheckTimeout).value}s`,
            serverGroup: this.selectedServerGroupID,
            configDrive: this.form.get(Controls.EnableConfigDrive)?.value ?? false,
          } as OpenstackNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    const flavour = this._nodeDataService.nodeData.spec.cloud.openstack.flavor;
    const selectedFlavour = this.flavors.find(s => s.slug === flavour);

    if (!selectedFlavour) {
      return null;
    }

    let payload: ResourceQuotaCalculationPayload = {
      replicas: this._nodeDataService.nodeData.count,
      diskSizeGB: this.form.get(Controls.UseCustomDisk).value ? this.form.get(Controls.CustomDiskSize).value : null,
      openstackSize: {
        ...selectedFlavour,
      } as OpenstackFlavor,
    };

    if (
      !this.isInWizardMode &&
      !this._initialQuotaCalculationPayload &&
      !!this._nodeDataService.nodeData.creationTimestamp
    ) {
      this._initialQuotaCalculationPayload = {
        ...payload,
      };
    }

    if (this._initialQuotaCalculationPayload) {
      payload = {
        ...payload,
        replacedResources: this._initialQuotaCalculationPayload,
      } as ResourceQuotaCalculationPayload;
    }

    return payload;
  }
}
