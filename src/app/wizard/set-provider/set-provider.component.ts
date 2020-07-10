// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService, WizardService} from '../../core/services';
import {Cluster, getClusterProvider} from '../../shared/entity/cluster';
import {getDatacenterProvider} from '../../shared/entity/datacenter';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';

@Component({
  selector: 'km-set-provider',
  templateUrl: 'set-provider.component.html',
  styleUrls: ['set-provider.component.scss'],
})
export class SetProviderComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  setProviderForm: FormGroup;
  providers: NodeProvider[] = [];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _dcService: DatacenterService, private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.setProviderForm = new FormGroup({
      provider: new FormControl(getClusterProvider(this.cluster), [Validators.required]),
    });

    this.setProviderForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.changeClusterProvider();
    });

    this._dcService.datacenters.pipe(takeUntil(this._unsubscribe)).subscribe(datacenters => {
      const providers: NodeProvider[] = [];
      for (const datacenter of datacenters) {
        const provider = getDatacenterProvider(datacenter);
        if (!providers.includes(provider)) {
          providers.push(provider);
        }
      }
      this.providers = providers;
    });
  }

  changeClusterProvider(): void {
    if (getClusterProvider(this.cluster) !== this.setProviderForm.controls.provider.value) {
      this._wizard.selectCustomPreset(undefined);
    }

    this._wizard.changeClusterProvider({
      provider: this.setProviderForm.controls.provider.value,
      valid: this.setProviderForm.valid,
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
