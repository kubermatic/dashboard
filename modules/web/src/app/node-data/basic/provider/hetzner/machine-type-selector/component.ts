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
import {HetznerTypes, Type} from '@shared/entity/provider/hetzner';

enum Column {
  Select = 'select',
  Name = 'name',
  VCPUs = 'vcpus',
  MemoryGB = 'memoryGB',
  Disk = 'disk',
}

enum TabIndex {
  Standard = 0,
  Dedicated = 1,
}

@Component({
  selector: 'km-hetzner-machine-type-selector',
  templateUrl: './template.html',
  styleUrls: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HetznerMachineTypeSelectorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HetznerMachineTypeSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  readonly Column = Column;

  @Input() options: HetznerTypes = HetznerTypes.newHetznerTypes();
  @Input() label = 'Instance Type';
  @Input() required = false;
  @Input() isLoading = false;
  @Input() selectedMachineType = '';

  searchQuery = '';
  selectedTabIndex = TabIndex.Standard;

  standardOptions: Type[] = [];
  dedicatedOptions: Type[] = [];
  filteredOptions: Type[] = [];
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

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
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

  getDisplayName(option: Type): string {
    return option.name;
  }

  trackById(_: number, option: Type): string {
    return option.name;
  }

  private _categorizeOptions(): void {
    this.standardOptions = this.options.standard || [];
    this.dedicatedOptions = this.options.dedicated || [];

    this._updateDisplayedColumns();
    this._applySearchFilter();
  }

  private _applySearchFilter(): void {
    const sourceOptions = this.selectedTabIndex === TabIndex.Dedicated ? this.dedicatedOptions : this.standardOptions;

    if (!this.searchQuery) {
      this.filteredOptions = [...sourceOptions];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredOptions = sourceOptions.filter(
        option => option.name.toLowerCase().includes(query) || option.description.toLowerCase().includes(query)
      );
    }
  }

  private _updateDisplayedColumns(): void {
    this.displayedColumns = [Column.Select, Column.Name, Column.VCPUs, Column.MemoryGB, Column.Disk];
  }
}
