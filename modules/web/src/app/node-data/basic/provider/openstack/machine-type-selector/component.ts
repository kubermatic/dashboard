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
import {OpenstackFlavor} from '@shared/entity/provider/openstack';

const MEMORY_CONVERSION_FACTOR = 1024; // Convert MB to GB

enum Column {
  Select = 'select',
  Name = 'name',
  VCPUs = 'vcpus',
  MemoryGB = 'memoryGB',
  Disk = 'disk',
}

@Component({
  selector: 'km-openstack-machine-type-selector',
  templateUrl: './template.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackMachineTypeSelectorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class OpenstackMachineTypeSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  readonly Column = Column;
  readonly MemoryConversionFactor = MEMORY_CONVERSION_FACTOR;

  @Input() options: OpenstackFlavor[] = [];
  @Input() label = 'Flavor';
  @Input() required = false;
  @Input() isLoading = false;
  @Input() selectedMachineType = '';

  searchQuery = '';

  filteredOptions: OpenstackFlavor[] = [];
  displayedColumns: string[] = [];

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this._categorizeOptions();
    }
    if (changes.selectedMachineType && changes.selectedMachineType.currentValue) {
      this._onChange(changes.selectedMachineType.currentValue);
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

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this._applySearchFilter();
  }

  onMachineTypeSelect(machineType: OpenstackFlavor): void {
    this.selectedMachineType = machineType.slug;
    this._onChange(machineType.slug);
    this._onTouched();
  }

  getDisplayName(option: OpenstackFlavor): string {
    const memoryGB = option.memory / MEMORY_CONVERSION_FACTOR;
    const cpuLabel = option.vcpus !== 1 ? 'CPUs' : 'CPU';
    return `${option.slug} - ${memoryGB} GB RAM, ${option.vcpus} ${cpuLabel}, ${option.disk} GB Disk`;
  }

  trackById(_: number, option: OpenstackFlavor): string {
    return option.slug;
  }

  private _categorizeOptions(): void {
    this.filteredOptions = [...this.options];
    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  private _applySearchFilter(): void {
    if (!this.searchQuery) {
      this.filteredOptions = [...this.options];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredOptions = this.options.filter(option => option.slug.toLowerCase().includes(query));
    }
  }

  private _updateDisplayedColumns(): void {
    this.displayedColumns = [Column.Select, Column.Name, Column.VCPUs, Column.MemoryGB, Column.Disk];
  }
}
