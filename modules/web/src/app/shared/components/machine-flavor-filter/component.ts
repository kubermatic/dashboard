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

import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, FormControl, Validators} from '@angular/forms';
import {MachineFlavorFilter} from '@shared/entity/datacenter';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

enum Controls {
  MinCPU = 'minCPU',
  MaxCPU = 'maxCPU',
  MinRAM = 'minRAM',
  MaxRAM = 'maxRAM',
  EnableGPU = 'enableGPU',
}

@Component({
    selector: 'km-machine-flavor-filter',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MachineFlavorFilterComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MachineFlavorFilterComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class MachineFlavorFilterComponent extends BaseFormValidator implements OnInit, OnDestroy {
  @Input() machineFlavorFilter: MachineFlavorFilter;

  @Output()
  readonly onChange = new EventEmitter<MachineFlavorFilter>();

  readonly Controls = Controls;
  private readonly _debounceTime = 500;
  private readonly minValue = 0;
  private readonly defaultValue = 0;

  constructor(private readonly _builder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.MinCPU]: new FormControl(this.machineFlavorFilter?.minCPU || this.defaultValue, [
        Validators.min(this.minValue),
      ]),
      [Controls.MaxCPU]: new FormControl(this.machineFlavorFilter?.maxCPU || this.defaultValue, [
        Validators.min(this.minValue),
      ]),
      [Controls.MinRAM]: new FormControl(this.machineFlavorFilter?.minRAM || this.defaultValue, [
        Validators.min(this.minValue),
      ]),
      [Controls.MaxRAM]: new FormControl(this.machineFlavorFilter?.maxRAM || this.defaultValue, [
        Validators.min(this.minValue),
      ]),
      [Controls.EnableGPU]: new FormControl(this.machineFlavorFilter?.enableGPU || false),
    });

    merge(
      this.form.get(Controls.MinCPU).valueChanges,
      this.form.get(Controls.MaxCPU).valueChanges,
      this.form.get(Controls.MinRAM).valueChanges,
      this.form.get(Controls.MaxRAM).valueChanges,
      this.form.get(Controls.EnableGPU).valueChanges
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.onChange.next(this._getMachineFilterFlavor()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getMachineFilterFlavor(): MachineFlavorFilter {
    return {
      minCPU: this.form.get(Controls.MinCPU).value,
      maxCPU: this.form.get(Controls.MaxCPU).value,
      minRAM: this.form.get(Controls.MinRAM).value,
      maxRAM: this.form.get(Controls.MaxRAM).value,
      enableGPU: this.form.get(Controls.EnableGPU).value,
    } as MachineFlavorFilter;
  }
}
