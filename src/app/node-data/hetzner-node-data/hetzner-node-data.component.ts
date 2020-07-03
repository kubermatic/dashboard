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
import {CloudSpec} from '../../shared/entity/cluster';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';
import {filterObjectOptions} from '../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../shared/validators/autocomplete-filter.validator';
import {HetznerTypes} from '../../shared/entity/provider/hetzner';

@Component({
  selector: 'km-hetzner-node-data',
  templateUrl: './hetzner-node-data.component.html',
})
export class HetznerNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  types: HetznerTypes = {dedicated: [], standard: []};
  form: FormGroup;
  loadingTypes = false;
  filteredTypes: HetznerTypes = {dedicated: [], standard: []};

  private _unsubscribe = new Subject<void>();
  private _selectedCredentials: string;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _addNodeService: NodeDataService,
    private readonly _wizardService: WizardService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      type: new FormControl(this.nodeData.spec.cloud.hetzner.type, [
        Validators.required,
        AutocompleteFilterValidators.mustBeInObjectList(this.types, 'name', true),
      ]),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.cloudSpec = data.cloudSpec;
      this.form.controls.type.setValue('');
      this.types = {dedicated: [], standard: []};
      this.checkTypeState();

      if (data.cloudSpec.hetzner.token !== '' || this._selectedCredentials) {
        this.reloadHetznerTypes();
      }
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedCredentials = credentials;
    });

    this.form.controls.type.valueChanges
      .pipe(debounceTime(1000), startWith(''), takeUntil(this._unsubscribe))
      .subscribe(value => {
        if (value !== '' && !this.form.controls.type.pristine) {
          this.filteredTypes = filterObjectOptions(value, 'name', this.types);
        } else {
          this.filteredTypes = this.types;
        }
        this.form.controls.type.setValidators([
          AutocompleteFilterValidators.mustBeInObjectList(this.types, 'name', true),
        ]);
        this.form.controls.type.updateValueAndValidity();
      });

    this.checkTypeState();
    this.reloadHetznerTypes();
    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  checkTypeState(): void {
    if (this.types.standard.length === 0 && this.types.dedicated.length === 0) {
      this.form.controls.type.disable();
    } else {
      this.form.controls.type.enable();
    }
  }

  getTypesFormState(): string {
    if (
      !this.loadingTypes &&
      (!this.cloudSpec.hetzner.token || this.cloudSpec.hetzner.token.length === 0) &&
      this.isInWizard()
    ) {
      return 'Node Type*';
    } else if (this.loadingTypes) {
      return 'Loading node types...';
    } else if (!this.loadingTypes && this.types.standard.length === 0 && this.types.dedicated.length === 0) {
      return 'No Node Types available';
    }
    return 'Node Type*';
  }

  showSizeHint(): boolean {
    return !this.loadingTypes && !this.cloudSpec.hetzner.token && !this._selectedCredentials && this.isInWizard();
  }

  reloadHetznerTypes(): void {
    if (this.cloudSpec.hetzner.token || this._selectedCredentials || !this.isInWizard()) {
      this.loadingTypes = true;
    }

    iif(
      () => this.isInWizard(),
      this._wizardService
        .provider(NodeProvider.HETZNER)
        .token(this.cloudSpec.hetzner.token)
        .credential(this._selectedCredentials)
        .flavors(),
      this._apiService.getHetznerTypes(this.projectId, this.seedDCName, this.clusterId)
    )
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        data => {
          this.types = data;
          if (this.nodeData.spec.cloud.hetzner.type === '') {
            this.form.controls.type.setValue(this.types.standard[0].name);
          }

          this.loadingTypes = false;
          this.checkTypeState();
        },
        () => (this.loadingTypes = false)
      );
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        hetzner: {
          type: this.form.controls.type.value,
        },
      },
      valid: this.form.valid,
    };
  }
}
