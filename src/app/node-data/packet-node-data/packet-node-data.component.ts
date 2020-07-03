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
import {iif, Subject} from 'rxjs';
import {debounceTime, first, startWith, takeUntil} from 'rxjs/operators';

import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';
import {filterArrayOptions} from '../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../shared/validators/autocomplete-filter.validator';
import {CloudSpec} from '../../shared/entity/cluster';
import {PacketSize} from '../../shared/entity/provider/packet';

@Component({
  selector: 'km-packet-node-data',
  templateUrl: './packet-node-data.component.html',
})
export class PacketNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  sizes: PacketSize[] = [];
  form: FormGroup;
  loadingSizes = false;
  filteredSizes: PacketSize[] = [];

  private _unsubscribe: Subject<any> = new Subject();
  private _selectedCredentials: string;

  constructor(
    private readonly _addNodeService: NodeDataService,
    private readonly _wizard: WizardService,
    private readonly _api: ApiService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      size: new FormControl(this.nodeData.spec.cloud.packet.instanceType, [
        Validators.required,
        AutocompleteFilterValidators.mustBeInArrayList(this.sizes, 'name', true),
      ]),
    });

    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this._addNodeService.changeNodeProviderData(this._getNodeProviderData()));

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.cloudSpec = data.cloudSpec;
      this.form.controls.size.setValue('');
      this.sizes = [];
      this._checkSizeState();

      if (this._canLoadSizes()) {
        this._reloadPacketSizes();
      }
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedCredentials = credentials;
    });

    this.form.controls.size.valueChanges
      .pipe(debounceTime(1000), startWith(''), takeUntil(this._unsubscribe))
      .subscribe(value => {
        if (value !== '' && !this.form.controls.size.pristine) {
          this.filteredSizes = filterArrayOptions(value, 'name', this.sizes);
        } else {
          this.filteredSizes = this.sizes;
        }
        this.form.controls.size.setValidators([
          Validators.required,
          AutocompleteFilterValidators.mustBeInArrayList(this.sizes, 'name', true),
        ]);
      });

    this._checkSizeState();
    this._reloadPacketSizes();
    this._addNodeService.changeNodeProviderData(this._getNodeProviderData());
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getSizesFormState(): string {
    if (
      !this.loadingSizes &&
      (!this.cloudSpec.packet.apiKey || !this.cloudSpec.packet.projectID) &&
      this.isInWizard()
    ) {
      return 'Plan*';
    } else if (this.loadingSizes) {
      return 'Loading Plans...';
    } else if (!this.loadingSizes && this.sizes.length === 0) {
      return 'No Plans available';
    }
    return 'Plan*';
  }

  getPlanDetails(size: PacketSize): string {
    let description = '';
    size.drives = size.drives ? size.drives : [];
    size.cpus = size.cpus ? size.cpus : [];

    for (const cpu of size.cpus) {
      description += `${cpu.count} CPU(s) ${cpu.type}`;
    }

    if (size.memory && size.memory !== 'N/A') {
      description += `, ${size.memory} RAM`;
    }

    for (const drive of size.drives) {
      description += `, ${drive.count}x${drive.size} ${drive.type}`;
    }

    return description ? `(${description})` : '';
  }

  showSizeHint(): boolean {
    return !this._canLoadSizes() && this.isInWizard();
  }

  private _getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        packet: {
          instanceType: this.form.controls.size.value,
          tags: this.nodeData.spec.cloud.packet.tags,
        },
      },
      valid: this.form.valid,
    };
  }

  private _reloadPacketSizes(): void {
    if (this._canLoadSizes() || !this.isInWizard()) {
      this.loadingSizes = true;
    }

    iif(
      () => this.isInWizard(),
      this._wizard
        .provider(NodeProvider.PACKET)
        .apiKey(this.cloudSpec.packet.apiKey)
        .projectID(this.cloudSpec.packet.projectID)
        .credential(this._selectedCredentials)
        .flavors(),
      this._api.getPacketSizes(this.projectId, this.seedDCName, this.clusterId)
    )
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        (sizes: PacketSize[]) => {
          sizes.forEach(size => {
            if (size.memory !== 'N/A') {
              this.sizes.push(size);
            }
          });
          if (this.nodeData.spec.cloud.packet.instanceType === '' && this.sizes.length) {
            this.form.controls.size.setValue(this.sizes[0].name);
          }

          this.loadingSizes = false;
          this._checkSizeState();
        },
        () => (this.loadingSizes = false)
      );
  }

  private _checkSizeState(): void {
    if (this.sizes.length === 0) {
      this.form.controls.size.disable();
    } else {
      this.form.controls.size.enable();
    }
  }

  private _canLoadSizes(): boolean {
    return (!!this.cloudSpec.packet.apiKey && !!this.cloudSpec.packet.projectID) || !!this._selectedCredentials;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
