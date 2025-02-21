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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Cluster, MachineNetwork} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

export enum Controls {
  MachineNetworks = 'machineNetworks',
}

@Component({
    selector: 'km-machine-networks',
    templateUrl: 'template.html',
    styleUrls: ['style.scss'],
    standalone: false
})
export class MachineNetworksComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Output('machineNetworks') machineNetworks$ = new EventEmitter<MachineNetwork[]>();
  @Output('valid') valid$ = new EventEmitter<boolean>();

  form: FormGroup;

  private readonly _debounceTime = 500;
  private _formArray: FormArray;
  private _unsubscribe = new Subject<void>();

  get networks(): AbstractControl[] {
    return this._formArray.controls;
  }

  constructor(private readonly _builder: FormBuilder) {}

  ngOnInit(): void {
    this._formArray = this._builder.array([this._createNetwork()]);
    this.form = new FormGroup({
      [Controls.MachineNetworks]: this._formArray,
    });

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._update());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  add(): void {
    this._formArray.push(this._createNetwork());
  }

  delete(index: number): void {
    this._formArray.removeAt(index);
    this._update();
  }

  private _update(): void {
    const machineNetworks = [];
    for (const i in this._formArray.controls) {
      if (Object.prototype.hasOwnProperty.call(this._formArray.controls, i)) {
        machineNetworks.push({
          cidr: this._formArray.value[i].cidr,
          gateway: this._formArray.value[i].gateway,
          dnsServers: this._formArray.value[i].dnsServers.toString().replace(/\s/g, '').split(','),
        });
      }
    }

    this.machineNetworks$.emit(machineNetworks);
    this.valid$.emit(this._formArray.controls.length > 0 && this._formArray.controls.every(c => c.valid));
  }

  private _createNetwork(): FormGroup {
    return this._builder.group({
      cidr: this._builder.control('', [
        Validators.required,
        Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/),
      ]),
      dnsServers: this._builder.control(
        [],
        [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*,*\s*)+)$/)]
      ),
      gateway: this._builder.control('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)]),
    });
  }
}
