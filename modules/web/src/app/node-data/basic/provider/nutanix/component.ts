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
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import _ from 'lodash';
import {merge, Observable, of, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {GlobalModule} from '@core/services/global/module';
import {DynamicModule} from '@app/dynamic/module-registry';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataService} from '@core/services/node-data/service';
import {ComboboxControls} from '@shared/components/combobox/component';
import {DatacenterOperatingSystemOptions} from '@shared/entity/datacenter';
import {getDefaultNodeProviderSpec, NodeCloudSpec, NodeSpec, NutanixNodeSpec} from '@shared/entity/node';
import {NutanixCategory, NutanixCategoryValue, NutanixSubnet} from '@shared/entity/provider/nutanix';
import {NodeProvider, OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {ResourceQuotaCalculationPayload} from '@shared/entity/quota';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {DialogModeService} from '@app/core/services/dialog-mode';

enum Controls {
  ImageName = 'imageName',
  SubnetName = 'subnetName',
  CPUs = 'cpus',
  CPUCores = 'cpuCores',
  CPUPassthrough = 'cpuPassthrough',
  MemoryMB = 'memoryMB',
  DiskSize = 'diskSize',
  Categories = 'categories',
  Category = 'category',
  CategoryValue = 'categoryValue',
}

enum SubnetState {
  Ready = 'Subnet',
  Loading = 'Loading...',
  Empty = 'No Subnets Available',
}

enum CategoryState {
  Ready = 'Category',
  Loading = 'Loading...',
  Empty = 'No Categories Available',
}

enum CategoryValueState {
  Ready = 'Value',
  Loading = 'Loading...',
  Empty = 'No Values Available',
}

interface Category {
  category: string;
  categoryValue: string;
}

@Component({
  selector: 'km-nutanix-basic-node-data',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NutanixBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NutanixBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutanixBasicNodeDataComponent extends BaseFormValidator implements OnInit, AfterViewChecked, OnDestroy {
  readonly Controls = Controls;
  readonly CategoryValueState = CategoryValueState;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  private _images: DatacenterOperatingSystemOptions;
  private _defaultImage = '';
  private _defaultOS: OperatingSystem;
  private _subnets: NutanixSubnet[] = [];
  private _quotaCalculationService: QuotaCalculationService;
  private _initialQuotaCalculationPayload: ResourceQuotaCalculationPayload;
  selectedSubnet = '';
  subnetLabel = SubnetState.Empty;
  categories: NutanixCategory[] = [];
  initialSelectedCategories: Category[];
  removedCategories: Category[] = [];
  filteredCategories: Record<string, NutanixCategory[]> = {};
  categoryLabel = CategoryState.Empty;
  categoryValues: Record<string, NutanixCategoryValue[]> = {};
  categoryValuesLabel: Record<string, CategoryValueState> = {};
  categoryValuesSubscription: Record<string, Subscription> = {};

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _cdr: ChangeDetectorRef,
    private _dialogModeService: DialogModeService
  ) {
    super();

    if (this.isEnterpriseEdition) {
      this._quotaCalculationService = GlobalModule.injector.get(QuotaCalculationService);
    }
  }

  ngOnInit(): void {
    const values = this._nodeDataService.nodeData.spec.cloud.nutanix;
    const defaults = getDefaultNodeProviderSpec(NodeProvider.NUTANIX) as NutanixNodeSpec;
    this.form = this._builder.group({
      [Controls.ImageName]: this._builder.control(values ? values.imageName : defaults.imageName, [
        Validators.required,
      ]),
      [Controls.SubnetName]: this._builder.control(values ? values.subnetName : defaults.subnetName, [
        Validators.required,
      ]),
      [Controls.CPUs]: this._builder.control(values ? values.cpus : defaults.cpus, [Validators.required]),
      [Controls.CPUCores]: this._builder.control(values ? values.cpuCores : defaults.cpuCores, [Validators.required]),
      [Controls.CPUPassthrough]: this._builder.control(values ? values.cpuPassthrough : defaults.cpuPassthrough),
      [Controls.MemoryMB]: this._builder.control(values ? values.memoryMB : defaults.memoryMB, [Validators.required]),
      [Controls.DiskSize]: this._builder.control(values ? values.diskSize : defaults.diskSize, [Validators.required]),
      [Controls.Categories]: this._builder.array([]),
    });

    if (values?.categories) {
      Object.keys(values.categories).forEach(category => {
        this.addCategory(category, values.categories[category]);
      });
      this._updateFilteredCategories();
    }

    this._nodeDataService.nodeData = this._getNodeData();

    this._subnetsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSubnet.bind(this));
    this._categoriesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setCategories.bind(this));

    this._defaultOS = this._nodeDataService.operatingSystem;
    this._defaultImage = this._nodeDataService.nodeData.spec.cloud.nutanix.imageName;

    merge(this._clusterSpecService.datacenterChanges, of(this._clusterSpecService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(tap(dc => (this._images = dc.spec?.nutanix?.images)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._setDefaultImage(OperatingSystem.Ubuntu));

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(_ => !!this._images))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultImage.bind(this));

    merge(
      this.form.get(Controls.ImageName).valueChanges,
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.CPUCores).valueChanges,
      this.form.get(Controls.CPUPassthrough).valueChanges,
      this.form.get(Controls.MemoryMB).valueChanges,
      this.form.get(Controls.DiskSize).valueChanges,
      this.form.get(Controls.SubnetName).valueChanges,
      this.form.get(Controls.Categories).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._nodeDataService.nodeData = this._getNodeData();
        if (this.isEnterpriseEdition) {
          const payload = this._getQuotaCalculationPayload();
          this._quotaCalculationService.refreshQuotaCalculations(payload);
        }
      });

    this.form
      .get(Controls.Categories)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._nodeDataService.nodeData.spec.cloud.nutanix.categories = this._getCategories();
      });

    this.initialSelectedCategories = this.form.get(Controls.Categories).value;

    this.form
      .get(Controls.Categories)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(
        values =>
          (this.removedCategories = this.removedCategories?.filter(
            category => !values?.some(value => category?.category === value?.category?.select)
          ))
      );
  }

  ngAfterViewChecked(): void {
    this.form.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getSubnets(): NutanixSubnet[] {
    return this._subnets;
  }

  subnetsDisplayName(subnetName: string): string {
    const subnet = this._subnets.find(size => size.name === subnetName);
    if (!subnet) {
      return subnetName;
    }

    return `${subnet.name} (${subnet.type})`;
  }

  onSubnetChange(subnet: string): void {
    this._nodeDataService.nodeData.spec.cloud.nutanix.subnetName = subnet;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  get categoriesFormArray(): FormArray {
    return this.form.get(Controls.Categories) as FormArray;
  }

  getSelectedCategory(control: AbstractControl): string {
    return control.get(Controls.Category).value[ComboboxControls.Select];
  }

  getCategoryLabel(control: AbstractControl): string {
    return this.categoryLabel === CategoryState.Loading
      ? CategoryState.Loading
      : this.filteredCategories[this.getSelectedCategory(control) || '']?.length === 0
        ? CategoryState.Empty
        : this.categoryLabel;
  }

  addCategory(category = '', value = ''): void {
    const categoryControl = this._builder.control('', Validators.required);
    this.categoriesFormArray.push(
      this._builder.group({
        [Controls.Category]: categoryControl,
        [Controls.CategoryValue]: this._builder.control(value, Validators.required),
      })
    );
    this.categoryValuesLabel[category] = CategoryValueState.Ready;

    categoryControl.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .pipe(map(data => data[ComboboxControls.Select]))
      .pipe(distinctUntilChanged())
      .subscribe(() => {
        const selectedCategory = categoryControl.value?.[ComboboxControls.Select];
        this._loadCategoryValues(selectedCategory);
        this._updateFilteredCategories();
      });

    if (category) {
      categoryControl.setValue(category);
    }
  }

  removeCategory(index: number): void {
    if (this._dialogModeService.isEditDialog) {
      this.removedCategories?.push({
        category: this.categoriesFormArray.value[index].category.select,
        categoryValue: this.categoriesFormArray.value[index].categoryValue.select,
      });
    }

    const selectedCategory = this.categoriesFormArray.at(index).get(Controls.Category).value[ComboboxControls.Select];
    this.categoriesFormArray.removeAt(index);
    if (selectedCategory) {
      this.categoryValuesSubscription[selectedCategory].unsubscribe();
      delete this.categoryValuesSubscription[selectedCategory];
    }
    this._updateFilteredCategories();
  }

  isCategoryChanged(index: number): boolean {
    const category = this.categoriesFormArray.value[index].category.select;
    const categoryValue = this.categoriesFormArray.value[index].categoryValue.select;
    if (category) {
      return (
        (category !== this.initialSelectedCategories[index]?.category ||
          categoryValue !== this.initialSelectedCategories[index]?.categoryValue) &&
        this._dialogModeService.isEditDialog
      );
    }
    return false;
  }

  private get _subnetsObservable(): Observable<NutanixSubnet[]> {
    return this._nodeDataService.nutanix.subnets(this._clearSubnet.bind(this), this._onSubnetLoading.bind(this));
  }

  private _onSubnetLoading(): void {
    this._clearSubnet();
    this.subnetLabel = SubnetState.Loading;
    this._cdr.detectChanges();
  }

  private _clearSubnet(): void {
    this.selectedSubnet = '';
    this._subnets = [];
    this.subnetLabel = SubnetState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSubnet(subnets: NutanixSubnet[]): void {
    this._subnets = subnets;
    this.selectedSubnet = this._nodeDataService.nodeData.spec.cloud.nutanix
      ? this._nodeDataService.nodeData.spec.cloud.nutanix.subnetName
      : '';

    if (!this.selectedSubnet && this._subnets && !_.isEmpty(this._subnets)) {
      this.selectedSubnet = this._subnets[0].name;
    }

    this.subnetLabel = this.selectedSubnet ? SubnetState.Ready : SubnetState.Empty;
    this._cdr.detectChanges();
  }

  private get _categoriesObservable(): Observable<NutanixCategory[]> {
    return this._nodeDataService.nutanix.categories(this._clearCategory.bind(this), this._onCategoryLoading.bind(this));
  }

  private _onCategoryLoading(): void {
    this._clearCategory();
    this.categoryLabel = CategoryState.Loading;
    this._cdr.detectChanges();
  }

  private _clearCategory(): void {
    this.categories = [];
    this._updateFilteredCategories();
    this.categoryLabel = CategoryState.Empty;
    this._cdr.detectChanges();
  }

  private _setCategories(categories: NutanixCategory[]): void {
    this.categories = categories;
    this._updateFilteredCategories();
    this.categoryLabel = this.categories?.length ? CategoryState.Ready : CategoryState.Empty;
    this._cdr.detectChanges();
  }

  private _updateFilteredCategories(): void {
    const selectedCategories = this.categoriesFormArray.controls
      .map(control => control.get(Controls.Category).value[ComboboxControls.Select])
      .filter(Boolean);
    selectedCategories.push('');
    this.filteredCategories = {};
    selectedCategories.forEach(selectedCategory => {
      this.filteredCategories[selectedCategory] = this.categories?.filter(
        category => category.name === selectedCategory || !selectedCategories.includes(category.name)
      );
    });
  }

  private _loadCategoryValues(categoryName: string): void {
    if (categoryName && !this.categoryValuesSubscription[categoryName]) {
      this.categoryValuesSubscription[categoryName] = this._nodeDataService.nutanix
        .categoryValues(
          categoryName,
          this._clearCategoryValue.bind(this, categoryName),
          this._onCategoryValueLoading.bind(this, categoryName)
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._setCategoryValues.bind(this, categoryName));
    }
  }

  private _onCategoryValueLoading(categoryName: string): void {
    this._clearCategoryValue(categoryName);
    this.categoryValuesLabel[categoryName] = CategoryValueState.Loading;
    this._cdr.detectChanges();
  }

  private _clearCategoryValue(categoryName: string): void {
    this.categoryValues[categoryName] = [];
    this.categoryValuesLabel[categoryName] = CategoryValueState.Empty;
    this._cdr.detectChanges();
  }

  private _setCategoryValues(categoryName: string, values: NutanixCategoryValue[]): void {
    this.categoryValues[categoryName] = values;
    const categoryControls = this.categoriesFormArray.controls.find(
      control => this.getSelectedCategory(control) === categoryName
    );
    if (categoryControls) {
      const categoryValueControl = categoryControls.get(Controls.CategoryValue);
      if (!values.find(item => item.value === categoryValueControl.value[ComboboxControls.Select])) {
        categoryValueControl.setValue(null);
      }
    }

    this.categoryValuesLabel[categoryName] = values?.length ? CategoryValueState.Ready : CategoryValueState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultImage(os: OperatingSystem): void {
    let defaultImage = this._getDefaultImage(os);

    if (_.isEmpty(this._defaultImage)) {
      this._defaultImage = defaultImage;
    }

    if (os === this._defaultOS) {
      defaultImage = this._defaultImage;
    }

    this.form.get(Controls.ImageName).setValue(defaultImage);
    this._cdr.detectChanges();
  }

  private _getDefaultImage(os: OperatingSystem): string {
    switch (os) {
      case OperatingSystem.CentOS:
        return this._images?.centos;
      case OperatingSystem.Ubuntu:
        return this._images?.ubuntu;
      case OperatingSystem.RHEL:
        return this._images?.rhel;
      case OperatingSystem.Flatcar:
        return this._images?.flatcar;
      case OperatingSystem.RockyLinux:
        return this._images?.rockylinux;
      default:
        return this._images?.ubuntu;
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          nutanix: {
            imageName: this.form.get(Controls.ImageName).value,
            cpus: this.form.get(Controls.CPUs).value,
            cpuCores: this.form.get(Controls.CPUCores).value,
            cpuPassthrough: !!this.form.get(Controls.CPUPassthrough).value,
            memoryMB: this.form.get(Controls.MemoryMB).value,
            diskSize: this.form.get(Controls.DiskSize).value,
          } as NutanixNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  private _getCategories(): Record<string, string> {
    if (!this.categoriesFormArray.controls.length) {
      return null;
    }
    const categories = {};
    this.categoriesFormArray.controls.forEach(control => {
      const category = control.get(Controls.Category).value?.[ComboboxControls.Select];
      const value = control.get(Controls.CategoryValue).value?.[ComboboxControls.Select];
      if (category && value) {
        categories[category] = value;
      }
    });
    return categories;
  }

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    let payload: ResourceQuotaCalculationPayload = {
      replicas: this._nodeDataService.nodeData.count,
      nutanixNodeSpec: {
        [Controls.SubnetName]: this.form.get(Controls.SubnetName).value?.[ComboboxControls.Select],
        [Controls.ImageName]: this.form.get(Controls.ImageName).value,
        [Controls.Categories]: this._getCategories(),
        [Controls.CPUs]: this.form.get(Controls.CPUs).value,
        [Controls.CPUCores]: this.form.get(Controls.CPUCores).value,
        [Controls.CPUPassthrough]: this.form.get(Controls.CPUPassthrough).value,
        [Controls.MemoryMB]: this.form.get(Controls.MemoryMB).value,
        [Controls.DiskSize]: this.form.get(Controls.DiskSize).value,
      } as NutanixNodeSpec,
    };

    if (
      !this._nodeDataService.isInWizardMode() &&
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
