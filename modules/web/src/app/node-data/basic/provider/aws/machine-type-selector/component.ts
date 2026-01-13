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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

export interface AWSMachineType {
  name: string;
  prettyName?: string;
  vcpus: number;
  memory: number;
  gpus?: number;
  price?: number;
  description?: string;
  architecture?: string;
}

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

  @Input() options: AWSMachineType[] = [];
  @Input() label = 'Machine Type';
  @Input() required = false;
  @Input() showGpuFilter = true;
  @Input() isLoading = false;

  @Output() selectionChange = new EventEmitter<string>();
  @Output() machineTypeSelected = new EventEmitter<AWSMachineType>();

  searchQuery = '';
  selectedTabIndex = TabIndex.CPU;
  selectedMachineType = '';

  cpuBasedMachineTypes: AWSMachineType[] = [];
  gpuBasedMachineTypes: AWSMachineType[] = [];
  filteredMachineTypes: AWSMachineType[] = [];
  hasGpuTypes = false;
  hasPriceData = false;
  displayedColumns: string[] = [];

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngOnInit(): void {
    this._categorizeOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this._categorizeOptions();
    }
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
    this._applySearchFilter();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this._applySearchFilter();
  }

  onMachineTypeSelect(machineType: AWSMachineType): void {
    this.selectedMachineType = machineType.name;
    this._onChange(machineType.name);
    this._onTouched();
    this.selectionChange.emit(machineType.name);
    this.machineTypeSelected.emit(machineType);
  }

  getDisplayName(option: AWSMachineType): string {
    return option.prettyName || option.name;
  }

  trackById(_: number, option: AWSMachineType): string {
    return option.name;
  }

  private _categorizeOptions(): void {
    this.cpuBasedMachineTypes = this.options.filter(opt => !opt.gpus || opt.gpus === 0);
    this.gpuBasedMachineTypes = this.options.filter(opt => opt.gpus && opt.gpus > 0);
    this.hasGpuTypes = this.gpuBasedMachineTypes.length > 0;
    this.hasPriceData = this.options.some(opt => opt.price !== undefined);

    this._applySearchFilter();
  }

  private _applySearchFilter(): void {
    const sourceOptions = this.selectedTabIndex === TabIndex.GPU ? this.gpuBasedMachineTypes : this.cpuBasedMachineTypes;

    if (!this.searchQuery) {
      this.filteredMachineTypes = [...sourceOptions];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredMachineTypes = sourceOptions.filter(
        option =>
          option.name.toLowerCase().includes(query) ||
          (option.prettyName && option.prettyName.toLowerCase().includes(query))
      );
    }

    this._updateDisplayedColumns();
  }

  private _updateDisplayedColumns(): void {
    const baseColumns = [Column.Select, Column.Name, Column.VCPUs, Column.MemoryGB];
    const optionalColumns = [];

    if (this.selectedTabIndex === TabIndex.GPU || this.hasGpuTypes) {
      optionalColumns.push(Column.GPUs);
    }

    if (this.hasPriceData) {
      optionalColumns.push(Column.PricePerHour);
    }

    this.displayedColumns = [...baseColumns, ...optionalColumns];
  }
}
