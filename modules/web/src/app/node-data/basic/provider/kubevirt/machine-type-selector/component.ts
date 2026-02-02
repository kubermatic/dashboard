// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  KubeVirtInstanceType,
  KubeVirtInstanceTypeCategory,
  KubeVirtInstanceTypeList,
} from '@shared/entity/provider/kubevirt';

enum Column {
  Select = 'select',
  Name = 'name',
  CPUs = 'cpus',
  Memory = 'memory',
  GPUs = 'gpus',
}

enum TabIndex {
  KubermaticCPU = 0,
  KubermaticGPU = 1,
  CustomCPU = 2,
  CustomGPU = 3,
}

interface CategorizedInstanceType extends KubeVirtInstanceType {
  _id: string;
  _cpuValue?: number;
  _memoryValue?: string;
  _gpuCount: number;
  _hasGPU: boolean;
}

@Component({
  selector: 'km-kubevirt-machine-type-selector',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeVirtMachineTypeSelectorComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class KubeVirtMachineTypeSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  readonly Column = Column;

  get hasSelection(): boolean {
    return !!this.selectedInstanceTypeId;
  }

  get hasKubermaticGpu(): boolean {
    return this.hasKubermaticGpuTypes;
  }

  get hasCustomGpu(): boolean {
    return this.hasCustomGpuTypes;
  }

  @Input() instanceTypes: KubeVirtInstanceTypeList;
  @Input() label = 'Instance Type';
  @Input() required = false;
  @Input() showGpuFilter = true;
  @Input() isLoading = false;
  @Input() selectedInstanceTypeId = '';

  activeTabIndex = 0;
  searchQuery = '';
  selectedTabIndex = TabIndex.KubermaticCPU;

  kubermaticCpuOptions: CategorizedInstanceType[] = [];
  kubermaticGpuOptions: CategorizedInstanceType[] = [];
  customCpuOptions: CategorizedInstanceType[] = [];
  customGpuOptions: CategorizedInstanceType[] = [];
  filteredOptions: CategorizedInstanceType[] = [];
  visibleTabs: TabIndex[] = [];
  displayedColumns: string[] = [];

  private hasKubermaticGpuTypes = false;
  private hasCustomGpuTypes = false;

  private readonly _instanceTypeIDSeparator = ':';
  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.instanceTypes) {
      this._categorizeOptions();
    }
    if (changes.selectedInstanceTypeId && changes.selectedInstanceTypeId.currentValue) {
      this._onChange(changes.selectedInstanceTypeId.currentValue);
    }
  }

  ngOnInit(): void {
    this._categorizeOptions();
  }

  writeValue(value: string): void {
    this.selectedInstanceTypeId = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    this.selectedTabIndex = this.visibleTabs[index] ?? TabIndex.KubermaticCPU;
    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  onSearchChange(): void {
    this._applySearchFilter();
  }

  onInstanceTypeChange(instanceTypeId: string): void {
    this.selectedInstanceTypeId = instanceTypeId;
    this._onChange(instanceTypeId);
    this._onTouched();
  }

  clearSelection(): void {
    this.selectedInstanceTypeId = '';
    this._onChange('');
    this._onTouched();
  }

  trackById(_: number, instanceType: CategorizedInstanceType): string {
    return instanceType._id;
  }

  private _categorizeOptions(): void {
    if (!this.instanceTypes?.instancetypes) {
      this._resetOptions();
      return;
    }

    this.kubermaticCpuOptions = [];
    this.kubermaticGpuOptions = [];
    this.customCpuOptions = [];
    this.customGpuOptions = [];

    this._processCategory();

    this.hasKubermaticGpuTypes = this.kubermaticGpuOptions.length > 0;
    this.hasCustomGpuTypes = this.customGpuOptions.length > 0;

    this._updateVisibleTabs();
    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  private _resetOptions(): void {
    this.kubermaticCpuOptions = [];
    this.kubermaticGpuOptions = [];
    this.customCpuOptions = [];
    this.customGpuOptions = [];
    this.hasKubermaticGpuTypes = false;
    this.hasCustomGpuTypes = false;
    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  private _processCategory(): void {
    Object.keys(this.instanceTypes.instancetypes).forEach(category => {
      const types = this.instanceTypes.instancetypes[category] || [];

      types.forEach((instanceType: KubeVirtInstanceType) => {
        const categorized = this._createCategorizedInstanceType(instanceType, category);

        switch (category) {
          case KubeVirtInstanceTypeCategory.Kubermatic:
            if (categorized._hasGPU) {
              this.kubermaticGpuOptions.push(categorized);
            } else {
              this.kubermaticCpuOptions.push(categorized);
            }
            break;
          case KubeVirtInstanceTypeCategory.Custom:
            if (categorized._hasGPU) {
              this.customGpuOptions.push(categorized);
            } else {
              this.customCpuOptions.push(categorized);
            }
            break;
        }
      });
    });
  }

  private _createCategorizedInstanceType(
    instanceType: KubeVirtInstanceType,
    category: string
  ): CategorizedInstanceType {
    const id = `${category}${this._instanceTypeIDSeparator}${instanceType.name}`;
    let cpuValue: number | undefined;
    let memoryValue: string | undefined;
    let gpuCount = 0;

    try {
      if (instanceType.spec) {
        const parsedSpec = JSON.parse(instanceType.spec);
        cpuValue = parsedSpec.cpu?.guest;
        memoryValue = parsedSpec.memory?.guest;
        if (parsedSpec.gpus && Array.isArray(parsedSpec.gpus)) {
          gpuCount = parsedSpec.gpus.length;
        }
      }
    } catch (e) {
      // If spec parsing fails, use default values
    }

    return {
      ...instanceType,
      _id: id,
      _cpuValue: cpuValue,
      _memoryValue: memoryValue,
      _gpuCount: gpuCount,
      _hasGPU: gpuCount > 0,
    };
  }

  private _applySearchFilter(): void {
    let sourceOptions: CategorizedInstanceType[] = [];

    switch (this.selectedTabIndex) {
      case TabIndex.KubermaticCPU:
        sourceOptions = this.kubermaticCpuOptions;
        break;
      case TabIndex.KubermaticGPU:
        sourceOptions = this.kubermaticGpuOptions;
        break;
      case TabIndex.CustomCPU:
        sourceOptions = this.customCpuOptions;
        break;
      case TabIndex.CustomGPU:
        sourceOptions = this.customGpuOptions;
        break;
    }

    if (!this.searchQuery) {
      this.filteredOptions = sourceOptions;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredOptions = sourceOptions.filter(option => option.name.toLowerCase().includes(query));
    }
  }

  private _updateVisibleTabs(): void {
    this.visibleTabs = [TabIndex.KubermaticCPU];

    if (this.hasKubermaticGpuTypes && this.showGpuFilter) {
      this.visibleTabs.push(TabIndex.KubermaticGPU);
    }

    this.visibleTabs.push(TabIndex.CustomCPU);

    if (this.hasCustomGpuTypes && this.showGpuFilter) {
      this.visibleTabs.push(TabIndex.CustomGPU);
    }

    this._syncTabIndices();
  }

  private _syncTabIndices(): void {
    if (!this.visibleTabs.includes(this.selectedTabIndex)) {
      this.selectedTabIndex = TabIndex.KubermaticCPU;
      this.activeTabIndex = 0;
    } else {
      this.activeTabIndex = this.visibleTabs.indexOf(this.selectedTabIndex);
    }
  }

  private _updateDisplayedColumns(): void {
    const baseColumns = [Column.Select, Column.Name, Column.CPUs, Column.Memory];

    if (this.selectedTabIndex === TabIndex.KubermaticGPU || this.selectedTabIndex === TabIndex.CustomGPU) {
      this.displayedColumns = [...baseColumns, Column.GPUs];
    } else {
      this.displayedColumns = baseColumns;
    }
  }
}
