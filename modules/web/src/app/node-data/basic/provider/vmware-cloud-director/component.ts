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
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataService} from '@core/services/node-data/service';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {Datacenter} from '@shared/entity/datacenter';
import {getDefaultNodeProviderSpec, NodeCloudSpec, NodeSpec, VMwareCloudDirectorNodeSpec} from '@shared/entity/node';
import {
  VMwareCloudDirectorCatalog,
  VMwareCloudDirectorIPAllocationMode,
  VMwareCloudDirectorStorageProfile,
  VMwareCloudDirectorTemplate,
} from '@shared/entity/provider/vmware-cloud-director';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, Observable, Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  CPUs = 'cpus',
  CPUCores = 'cpuCores',
  MemoryMB = 'memoryMB',
  DiskSizeGB = 'diskSizeGB',
  DiskIOPs = 'diskIOPs',
  IPAllocationMode = 'IPAllocationMode',
  StorageProfile = 'storageProfile',
  Catalog = 'catalog',
  Template = 'template',
}

enum StorageProfileState {
  Ready = 'Storage Profile',
  Loading = 'Loading...',
  Empty = 'No storage profiles available',
}

enum TemplateState {
  Ready = 'Template',
  Loading = 'Loading...',
  Empty = 'No templates available',
}

enum CatalogState {
  Ready = 'Catalog',
  Loading = 'Loading...',
  Empty = 'No catalogs available',
}

@Component({
  selector: 'km-vmware-cloud-director-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VMwareCloudDirectorBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VMwareCloudDirectorBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VMwareCloudDirectorBasicNodeDataComponent
  extends BaseFormValidator
  implements OnInit, AfterViewChecked, OnDestroy
{
  readonly Controls = Controls;
  readonly ipAllocationModes = [VMwareCloudDirectorIPAllocationMode.POOL, VMwareCloudDirectorIPAllocationMode.DHCP];

  @ViewChild('storageProfileCombobox')
  private readonly _storageProfileCombobox: FilteredComboboxComponent;
  @ViewChild('catalogCombobox')
  private readonly _catalogCombobox: FilteredComboboxComponent;
  @ViewChild('templateCombobox')
  private readonly _templateCombobox: FilteredComboboxComponent;

  storageProfiles: VMwareCloudDirectorStorageProfile[] = [];
  catalogs: VMwareCloudDirectorCatalog[] = [];
  templates: VMwareCloudDirectorTemplate[] = [];
  selectedStorageProfile = '';
  selectedCatalog = '';
  selectedTemplate = '';
  storageProfileLabel = StorageProfileState.Empty;
  templateLabel = TemplateState.Empty;
  catalogLabel = CatalogState.Empty;

  private _catalogChanges = new Subject<boolean>();
  private _datacenter: Datacenter;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();

    this._nodeDataService.nodeData = this._getNodeData();

    this._datacenterService
      .getDatacenter(this._clusterSpecService.datacenter)
      .pipe(take(1))
      .subscribe(datacenter => (this._datacenter = datacenter));

    merge(
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.CPUCores).valueChanges,
      this.form.get(Controls.MemoryMB).valueChanges,
      this.form.get(Controls.DiskSizeGB).valueChanges,
      this.form.get(Controls.DiskIOPs).valueChanges,
      this.form.get(Controls.IPAllocationMode).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    this._clusterSpecService.datacenterChanges
      .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterSpecService.datacenter)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: datacenter => {
          this._datacenter = datacenter;
        },
      });

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(value => !!(value && this._datacenter && this.templates?.length)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._setDefaultTemplate(this.templates));

    this._storageProfilesObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultStorageProfile.bind(this));

    this._catalogsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultCatalog.bind(this));

    this._catalogChanges
      .pipe(tap(_ => this._clearTemplate()))
      .pipe(filter(hasValue => !!hasValue))
      .pipe(switchMap(_ => this._templatesObservable))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultTemplate.bind(this));
  }

  ngAfterViewChecked(): void {
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onStorageProfileChanged(storageProfile: string): void {
    this.selectedStorageProfile = storageProfile;
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.storageProfile = storageProfile;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  onCatalogChanged(catalog: string): void {
    this.selectedCatalog = catalog;
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.catalog = catalog;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
    this._catalogChanges.next(!!catalog);
  }

  onTemplateChanged(template: string): void {
    this.selectedTemplate = template;
    this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.template = template;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  private _initForm(): void {
    const values = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector;
    const defaults = getDefaultNodeProviderSpec(NodeProvider.VMWARECLOUDDIRECTOR) as VMwareCloudDirectorNodeSpec;
    this.form = this._builder.group({
      [Controls.CPUs]: this._builder.control(values ? values.cpus : defaults.cpus, [Validators.required]),
      [Controls.CPUCores]: this._builder.control(values ? values.cpuCores : defaults.cpuCores, [Validators.required]),
      [Controls.MemoryMB]: this._builder.control(values ? values.memoryMB : defaults.memoryMB, [Validators.required]),
      [Controls.DiskSizeGB]: this._builder.control(values ? values.diskSizeGB : defaults.diskSizeGB, [
        Validators.required,
      ]),
      [Controls.DiskIOPs]: this._builder.control(values ? values.diskIOPS : defaults.diskIOPS),
      [Controls.IPAllocationMode]: this._builder.control(values ? values.ipAllocationMode : defaults.ipAllocationMode),
      [Controls.StorageProfile]: this._builder.control(values ? values.storageProfile : defaults.storageProfile, [
        Validators.required,
      ]),
      [Controls.Template]: this._builder.control(values ? values.template : defaults.template, [Validators.required]),
      [Controls.Catalog]: this._builder.control(values ? values.catalog : defaults.catalog, [Validators.required]),
    });
  }

  private get _storageProfilesObservable(): Observable<VMwareCloudDirectorStorageProfile[]> {
    return this._nodeDataService.vmwareclouddirector.storageProfiles(
      this._clearStorageProfile.bind(this),
      this._onStorageProfileLoading.bind(this)
    );
  }

  private get _catalogsObservable(): Observable<VMwareCloudDirectorCatalog[]> {
    return this._nodeDataService.vmwareclouddirector.catalogs(
      this._clearCatalog.bind(this),
      this._onCatalogLoading.bind(this)
    );
  }

  private get _templatesObservable(): Observable<VMwareCloudDirectorTemplate[]> {
    return this._nodeDataService.vmwareclouddirector.templates(
      this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.catalog,
      this._clearTemplate.bind(this),
      this._onTemplateLoading.bind(this)
    );
  }

  private _onStorageProfileLoading(): void {
    this.storageProfileLabel = StorageProfileState.Loading;
    this._cdr.detectChanges();
  }

  private _clearStorageProfile(): void {
    this.selectedStorageProfile = '';
    this.storageProfiles = [];
    this.storageProfileLabel = StorageProfileState.Empty;
    this._storageProfileCombobox.reset();
    this._cdr.detectChanges();
  }

  private _setDefaultStorageProfile(storageProfiles: VMwareCloudDirectorStorageProfile[]): void {
    this.storageProfiles = storageProfiles;
    this.selectedStorageProfile = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.storageProfile;
    const dcStorageProfile = this._datacenter?.spec.vmwareclouddirector?.storageProfile;

    if (
      this.selectedStorageProfile &&
      !storageProfiles?.find(profile => profile.name === this.selectedStorageProfile)
    ) {
      this.selectedStorageProfile = '';
    }

    if (
      !this.selectedStorageProfile &&
      dcStorageProfile &&
      this.storageProfiles?.find(profile => profile.name === dcStorageProfile)
    ) {
      this.selectedStorageProfile = dcStorageProfile;
    }

    this.storageProfileLabel = storageProfiles?.length ? StorageProfileState.Ready : StorageProfileState.Empty;
    this._cdr.detectChanges();
  }

  private _onCatalogLoading(): void {
    this.catalogLabel = CatalogState.Loading;
    this._cdr.detectChanges();
  }

  private _clearCatalog(): void {
    this.selectedCatalog = '';
    this.catalogs = [];
    this.catalogLabel = CatalogState.Empty;
    this._catalogCombobox.reset();
    this._cdr.detectChanges();
  }

  private _setDefaultCatalog(catalogs: VMwareCloudDirectorCatalog[]): void {
    this.catalogs = catalogs;
    this.selectedCatalog = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.catalog;
    const dcCatalog = this._datacenter?.spec.vmwareclouddirector?.catalog;

    if (this.selectedCatalog && !catalogs?.find(catalog => catalog.name === this.selectedCatalog)) {
      this.selectedCatalog = '';
      this._clearTemplate();
    }

    if (!this.selectedCatalog && dcCatalog && catalogs?.find(catalog => catalog.name === dcCatalog)) {
      this.selectedCatalog = dcCatalog;
    }

    this.catalogLabel = catalogs?.length ? CatalogState.Ready : CatalogState.Empty;
    this._cdr.detectChanges();
  }

  private _onTemplateLoading(): void {
    this.templateLabel = TemplateState.Loading;
    this._cdr.detectChanges();
  }

  private _clearTemplate(): void {
    this.selectedTemplate = '';
    this.templates = [];
    this.templateLabel = TemplateState.Empty;
    this._templateCombobox.reset();
    this._cdr.detectChanges();
  }

  private _setDefaultTemplate(templates: VMwareCloudDirectorTemplate[]): void {
    this.templates = templates;
    this.selectedTemplate = this._nodeDataService.nodeData.spec.cloud.vmwareclouddirector.template;
    const selectedOS = this._nodeDataService.operatingSystem;
    const dcTemplate = this._datacenter?.spec.vmwareclouddirector?.templates?.[selectedOS];

    if (dcTemplate && templates?.find(template => template.name === dcTemplate)) {
      this.selectedTemplate = dcTemplate;
    } else {
      this.selectedTemplate = '';
    }

    this.templateLabel = templates?.length ? TemplateState.Ready : TemplateState.Empty;
    this._cdr.detectChanges();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          vmwareclouddirector: {
            cpus: this.form.get(Controls.CPUs).value,
            cpuCores: this.form.get(Controls.CPUCores).value,
            memoryMB: this.form.get(Controls.MemoryMB).value,
            diskSizeGB: this.form.get(Controls.DiskSizeGB).value,
            diskIOPS: this.form.get(Controls.DiskIOPs).value,
            ipAllocationMode: this.form.get(Controls.IPAllocationMode).value,
          } as VMwareCloudDirectorNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
