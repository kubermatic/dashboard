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

import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
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
import {DigitaloceanSizes} from '../../shared/entity/provider/digitalocean';

@Component({
  selector: 'km-digitalocean-node-data',
  templateUrl: './digitalocean-node-data.component.html',
})
export class DigitaloceanNodeDataComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  sizes: DigitaloceanSizes = {optimized: [], standard: []};
  form: FormGroup;
  loadingSizes = false;
  filteredSizes: DigitaloceanSizes = {optimized: [], standard: []};

  private _unsubscribe = new Subject<void>();
  private _selectedCredentials: string;

  constructor(
    private readonly _api: ApiService,
    private readonly _addNodeService: NodeDataService,
    private readonly _wizardService: WizardService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      size: new FormControl(this.nodeData.spec.cloud.digitalocean.size, [
        Validators.required,
        AutocompleteFilterValidators.mustBeInObjectList(this.sizes, 'slug', true),
      ]),
    });

    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => this._addNodeService.changeNodeProviderData(this.getNodeProviderData()));

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.cloudSpec = data.cloudSpec;
      this.form.controls.size.setValue('');
      this.sizes = {optimized: [], standard: []};
      this.checkSizeState();

      if (data.cloudSpec.digitalocean.token !== '' || this._selectedCredentials) {
        this.reloadDigitaloceanSizes();
      }
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedCredentials = credentials;
    });

    this.form.controls.size.valueChanges
      .pipe(debounceTime(1000), startWith(''), takeUntil(this._unsubscribe))
      .subscribe(value => {
        if (value !== '' && !this.form.controls.size.pristine) {
          this.filteredSizes = filterObjectOptions(value, 'slug', this.sizes);
        } else {
          this.filteredSizes = this.sizes;
        }
        this.form.controls.size.setValidators([
          Validators.required,
          AutocompleteFilterValidators.mustBeInObjectList(this.sizes, 'slug', true),
        ]);
        this.form.controls.size.updateValueAndValidity();
      });

    this.checkSizeState();
    this.reloadDigitaloceanSizes();
    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  checkSizeState(): void {
    if (this.sizes.standard.length === 0 && this.sizes.optimized.length === 0) {
      this.form.controls.size.disable();
    } else {
      this.form.controls.size.enable();
    }

    this.form.controls.size.updateValueAndValidity();
  }

  getSizesFormState(): string {
    if (
      !this.loadingSizes &&
      (!this.cloudSpec.digitalocean.token || this.cloudSpec.digitalocean.token.length === 0) &&
      this.isInWizard()
    ) {
      return 'Node Size*';
    } else if (this.loadingSizes) {
      return 'Loading sizes...';
    } else if (!this.loadingSizes && this.sizes.standard.length === 0 && this.sizes.optimized.length === 0) {
      return 'No Sizes available';
    }
    return 'Node Size*';
  }

  showSizeHint(): boolean {
    return !this.loadingSizes && !this.cloudSpec.digitalocean.token && !this._selectedCredentials && this.isInWizard();
  }

  reloadDigitaloceanSizes(): void {
    if (this.cloudSpec.digitalocean.token || this._selectedCredentials || !this.isInWizard()) {
      this.loadingSizes = true;
    }

    iif(
      () => this.isInWizard(),
      this._wizardService
        .provider(NodeProvider.DIGITALOCEAN)
        .token(this.cloudSpec.digitalocean.token)
        .credential(this._selectedCredentials)
        .flavors(),
      this._api.getDigitaloceanSizes(this.projectId, this.seedDCName, this.clusterId)
    )
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        data => {
          this.sizes = data;
          if (this.nodeData.spec.cloud.digitalocean.size === '') {
            this.form.controls.size.setValue(this.sizes.standard[0].slug);
          }

          this.loadingSizes = false;
          this.checkSizeState();
        },
        () => (this.loadingSizes = false)
      );
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (
        !changes.cloudSpec.previousValue ||
        changes.cloudSpec.currentValue.digitalocean.token !== changes.cloudSpec.previousValue.digitalocean.token
      ) {
        this.reloadDigitaloceanSizes();
      }
    }
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        digitalocean: {
          size: this.form.controls.size.value,
          backups: this.nodeData.spec.cloud.digitalocean.backups,
          ipv6: this.nodeData.spec.cloud.digitalocean.ipv6,
          monitoring: this.nodeData.spec.cloud.digitalocean.monitoring,
          tags: this.nodeData.spec.cloud.digitalocean.tags,
        },
      },
      valid: this.form.valid,
    };
  }
}
