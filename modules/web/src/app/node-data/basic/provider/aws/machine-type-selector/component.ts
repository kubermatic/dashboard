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
import {AWSSize} from '@shared/entity/provider/aws';

enum Column {
  Select = 'select',
  Name = 'name',
  VCPUs = 'vcpus',
  MemoryGB = 'memoryGB',
  GPUs = 'gpus',
  PricePerHour = 'pricePerHour',
}

enum TabIndex {
  CPU = 0,
  GPU = 1,
}

@Component({
  selector: 'km-aws-machine-type-selector',
  templateUrl: './template.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AWSMachineTypeSelectorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AWSMachineTypeSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  readonly Column = Column;

  @Input() options: AWSSize[] = [];
  @Input() label = 'Machine Type';
  @Input() required = false;
  @Input() showGpuFilter = true;
  @Input() isLoading = false;
  @Input() selectedMachineType = '';

  searchQuery = '';
  selectedTabIndex = TabIndex.CPU;

  cpuOptions: AWSSize[] = [];
  gpuOptions: AWSSize[] = [];
  filteredOptions: AWSSize[] = [];
  hasGpuTypes = false;
  hasPriceData = false;
  displayedColumns: string[] = [];

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this._categorizeOptions();
    }
  }

  ngOnInit(): void {
    this._categorizeOptions();
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

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this._applySearchFilter();
  }

  onMachineTypeSelect(machineType: AWSSize): void {
    this.selectedMachineType = machineType.name;
    this._onChange(machineType.name);
    this._onTouched();
  }

  getDisplayName(option: AWSSize): string {
    return option.pretty_name || option.name;
  }

  trackById(_: number, option: AWSSize): string {
    return option.name;
  }

  private _categorizeOptions(): void {
    const cpuTypes: AWSSize[] = [];
    const gpuTypes: AWSSize[] = [];
    let hasPricing = false;

    for (const option of this.options) {
      if (option.gpus && option.gpus > 0) {
        gpuTypes.push(option);
      } else {
        cpuTypes.push(option);
      }
      if (!hasPricing && option.price !== undefined) {
        hasPricing = true;
      }
    }

    this.cpuOptions = cpuTypes;
    this.gpuOptions = gpuTypes;
    this.hasGpuTypes = gpuTypes.length > 0;
    this.hasPriceData = hasPricing;

    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  private _applySearchFilter(): void {
    const sourceOptions = this.selectedTabIndex === TabIndex.GPU ? this.gpuOptions : this.cpuOptions;

    if (!this.searchQuery) {
      this.filteredOptions = [...sourceOptions];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredOptions = sourceOptions.filter(
        option =>
          option.name.toLowerCase().includes(query) ||
          (option.pretty_name && option.pretty_name.toLowerCase().includes(query))
      );
    }
  }

  private _updateDisplayedColumns(): void {
    const baseColumns = [Column.Select, Column.Name, Column.VCPUs, Column.MemoryGB];
    const optionalColumns = [];

    if (this.selectedTabIndex === TabIndex.GPU) {
      optionalColumns.push(Column.GPUs);
    }

    if (this.hasPriceData) {
      optionalColumns.push(Column.PricePerHour);
    }

    this.displayedColumns = [...baseColumns, ...optionalColumns];
  }
}
