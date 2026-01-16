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
import {GCPMachineSize} from '@shared/entity/provider/gcp';

enum Column {
  Select = 'select',
  Name = 'name',
  VCPUs = 'vcpus',
  MemoryGB = 'memoryGB',
}

@Component({
  selector: 'km-gcp-machine-type-selector',
  templateUrl: './template.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GCPMachineTypeSelectorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GCPMachineTypeSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  readonly Column = Column;

  @Input() options: GCPMachineSize[] = [];
  @Input() label = 'Machine Type';
  @Input() required = false;
  @Input() isLoading = false;
  @Input() selectedMachineType = '';

  searchQuery = '';
  filteredOptions: GCPMachineSize[] = [];
  displayedColumns: string[] = [];

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this._setOptions();
    }
    if (changes.selectedMachineType && changes.selectedMachineType.currentValue) {
      this._onChange(changes.selectedMachineType.currentValue);
    }
  }

  ngOnInit(): void {
    this._setOptions();
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

  onMachineTypeSelect(machineType: GCPMachineSize): void {
    this.selectedMachineType = machineType.name;
    this._onChange(machineType.name);
    this._onTouched();
  }

  getDisplayName(option: GCPMachineSize): string {
    return option.name;
  }

  trackById(_: number, option: GCPMachineSize): string {
    return option.name;
  }

  private _setOptions(): void {
    this.filteredOptions = [...this.options];
    this.displayedColumns = [Column.Select, Column.Name, Column.VCPUs, Column.MemoryGB];
    this._applySearchFilter();
  }

  private _applySearchFilter(): void {
    if (!this.searchQuery) {
      this.filteredOptions = [...this.options];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredOptions = this.options.filter(
        option =>
          option.name.toLowerCase().includes(query) ||
          option.description.toLowerCase().includes(query)
      );
    }
  }
}