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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {NodeDataService} from '@core/services/node-data/service';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {MachineNetwork} from '../../entity/cluster';
import {BaseFormValidator} from '../../validators/base-form.validator';

enum Controls {
  CIDR = 'cidr',
  DNSServers = 'dnsServers',
  Gateway = 'gateway',
  MachineNetworks = 'machineNetworks',
}

class MachineNetworkSpec {
  cidr: string;
  dnsServers: string;
  gateway: string;

  constructor(spec: MachineNetworkSpec) {
    this.cidr = spec.cidr;
    this.dnsServers = spec.dnsServers;
    this.gateway = spec.gateway;
  }

  toMachineNetwork(): MachineNetwork {
    return {
      cidr: this.cidr,
      gateway: this.gateway,
      dnsServers: this.dnsServers.replace(/\s/g, '').split(','),
    } as MachineNetwork;
  }
}

@Component({
  selector: 'km-machine-networks-new',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MachineNetworkComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MachineNetworkComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class MachineNetworkComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly controls = Controls;

  private readonly _debounceTime = 250;

  get networkControls(): AbstractControl[] {
    return this._networkArray.controls;
  }

  get _networkArray(): FormArray {
    return this.form.get(Controls.MachineNetworks) as FormArray;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.MachineNetworks]: this._builder.array([]),
    });

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setMachineNetworks.bind(this));
  }

  add(): void {
    this._networkArray.push(this._builder.group(this._newEmptyMachineNetwork()));
  }

  delete(index: number): void {
    this._networkArray.removeAt(index);
  }

  isInWizardMode(): boolean {
    return this._nodeDataService.isInWizardMode();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _setMachineNetworks(): void {
    this._clusterSpecService.cluster.spec.machineNetworks = (this._networkArray.value as MachineNetworkSpec[]).map(
      spec => new MachineNetworkSpec(spec).toMachineNetwork()
    );
  }

  private _newEmptyMachineNetwork(): object {
    return {
      [Controls.CIDR]: this._builder.control('', [
        Validators.required,
        Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/),
      ]),
      [Controls.DNSServers]: this._builder.control('', [
        Validators.required,
        Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*,*\s*)+)$/),
      ]),
      [Controls.Gateway]: this._builder.control('', [
        Validators.required,
        Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/),
      ]),
    };
  }
}
