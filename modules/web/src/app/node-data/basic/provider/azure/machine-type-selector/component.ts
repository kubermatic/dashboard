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

import {ChangeDetectionStrategy, Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {AzureSizes} from '@shared/entity/provider/azure';
import {SizeState} from '../component';

enum Column {
  Select = 'select',
  Name = 'name',
  VCPUs = 'vcpus',
  MemoryGB = 'memoryGB',
  GPUs = 'gpus',
}

enum TabIndex {
  Standard = 0,
  GPU = 1,
}

@Component({
  selector: 'km-azure-machine-type-selector',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AzureMachineTypeSelectorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AzureMachineTypeSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() options: AzureSizes[] = [];
  @Input() label = SizeState.Ready;
  @Input() required = false;
  @Input() showGpuFilter = true;
  @Input() isLoading = false;
  @Input() selectedMachineType = '';

  searchQuery = '';
  selectedTabIndex = TabIndex.Standard;
  sizeState = SizeState;

  standardOptions: AzureSizes[] = [];
  gpuOptions: AzureSizes[] = [];
  filteredOptions: AzureSizes[] = [];
  hasGpuTypes = false;
  displayedColumns: string[] = [];

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this._categorizeOptions();
    }
    if (changes.selectedMachineType?.currentValue) {
      this._onChange(changes.selectedMachineType.currentValue);
    }
  }

  ngOnInit(): void {
    this._categorizeOptions();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  writeValue(value: string): void {
    this.selectedMachineType = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this._applySearchFilter();
  }

  onMachineTypeChange(machineTypeName: string): void {
    this.selectedMachineType = machineTypeName;
    this._onChange(machineTypeName);
    this._onTouched();
  }

  trackById(_: number, option: AzureSizes): string {
    return option.name;
  }

  private _categorizeOptions(): void {
    const standard: AzureSizes[] = [];
    const gpu: AzureSizes[] = [];

    for (const option of this.options) {
      if (option.numberOfGPUs > 0) {
        gpu.push(option);
      } else {
        standard.push(option);
      }
    }

    this.standardOptions = standard;
    this.gpuOptions = gpu;
    this.hasGpuTypes = gpu.length > 0;

    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  private _applySearchFilter(): void {
    const sourceOptions = this.selectedTabIndex === TabIndex.GPU ? this.gpuOptions : this.standardOptions;

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      this.filteredOptions = sourceOptions.filter(size => size.name.toLowerCase().includes(query));
    } else {
      this.filteredOptions = [...sourceOptions];
    }
  }

  private _updateDisplayedColumns(): void {
    const baseColumns = [Column.Select, Column.Name, Column.VCPUs, Column.MemoryGB];
    const optionalColumns = this.selectedTabIndex === TabIndex.GPU ? [Column.GPUs] : [];
    this.displayedColumns = [...baseColumns, ...optionalColumns];
  }
}
