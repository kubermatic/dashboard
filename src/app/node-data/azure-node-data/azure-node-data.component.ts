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
import {EMPTY, iif, Subject} from 'rxjs';
import {debounceTime, startWith, switchMap, takeUntil} from 'rxjs/operators';

import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/cluster';
import {Datacenter} from '../../shared/entity/datacenter';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';
import {filterArrayOptions} from '../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../shared/validators/autocomplete-filter.validator';
import {AzureSizes, AzureZones} from '../../shared/entity/provider/azure';

@Component({
  selector: 'km-azure-node-data',
  templateUrl: './azure-node-data.component.html',
  styleUrls: ['./azure-node-data.component.scss'],
})
export class AzureNodeDataComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seed: string;

  sizes: AzureSizes[] = [];
  zones: string[] = [];
  form: FormGroup;
  datacenter: Datacenter;
  loadingSizes = false;
  loadingZones = false;
  filteredSizes: AzureSizes[] = [];

  private _unsubscribe = new Subject<void>();
  private _selectedPreset: string;

  constructor(
    private readonly _addNodeService: NodeDataService,
    private readonly _wizard: WizardService,
    private readonly _api: ApiService,
    private readonly _dcService: DatacenterService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      size: new FormControl(this.nodeData.spec.cloud.azure.size, [
        Validators.required,
        AutocompleteFilterValidators.mustBeInArrayList(this.sizes, 'name', true),
      ]),
      zone: new FormControl(this.nodeData.spec.cloud.azure.zone),
      imageID: new FormControl(this.nodeData.spec.cloud.azure.imageID),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.cloudSpec = data.cloudSpec;
      this.form.controls.size.setValue('');
      this.form.controls.zone.setValue('');
      this.sizes = [];
      this.zones = [];
      this.checkSizeState();
      this.checkZoneState();
      if (
        data.cloudSpec.azure.clientID !== '' ||
        data.cloudSpec.azure.clientSecret !== '' ||
        data.cloudSpec.azure.tenantID !== '' ||
        data.cloudSpec.azure.subscriptionID !== '' ||
        this._selectedPreset
      ) {
        this.reloadAzureSizes();

        if (this.form.controls.size.value !== '') {
          this.reloadAzureZones();
        }
      }
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this._selectedPreset = preset;
    });

    this.form.controls.size.valueChanges
      .pipe(debounceTime(1000), startWith(''), takeUntil(this._unsubscribe))
      .subscribe(value => {
        this.reloadAzureZones();

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

    this.loadDatacenter();
    this.checkSizeState();
    this.checkZoneState();
    this.reloadAzureSizes();
    this.reloadAzureZones();
    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  loadDatacenter(): void {
    if (this.cloudSpec.dc) {
      this._dcService
        .getDatacenter(this.cloudSpec.dc)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(data => {
          this.datacenter = data;
        });
    }
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  isMissingCredentials(): boolean {
    return (
      !this.cloudSpec.azure.clientID ||
      this.cloudSpec.azure.clientID === '' ||
      !this.cloudSpec.azure.clientSecret ||
      this.cloudSpec.azure.clientSecret === '' ||
      !this.cloudSpec.azure.tenantID ||
      this.cloudSpec.azure.tenantID === '' ||
      !this.cloudSpec.azure.subscriptionID ||
      this.cloudSpec.azure.subscriptionID === ''
    );
  }

  getSizesFormState(): string {
    if (!this.loadingSizes && this.isMissingCredentials() && this.isInWizard()) {
      return 'Node Size*';
    } else if (this.loadingSizes) {
      return 'Loading sizes...';
    } else if (!this.loadingSizes && this.sizes.length === 0) {
      return 'No Sizes available';
    }
    return 'Node Size*';
  }

  checkSizeState(): void {
    if (this.sizes.length === 0) {
      this.form.controls.size.disable();
    } else {
      this.form.controls.size.enable();
    }
  }

  showSizeHint(): boolean {
    return !this.loadingSizes && this.isMissingCredentials() && !this._selectedPreset && this.isInWizard();
  }

  reloadAzureSizes(): void {
    this.loadingSizes = !this.isMissingCredentials() || !this.isInWizard() || !!this._selectedPreset;

    iif(() => !!this.cloudSpec.dc, this._dcService.getDatacenter(this.cloudSpec.dc), EMPTY)
      .pipe(
        switchMap(dc => {
          this.datacenter = dc;

          return iif(
            () => this.isInWizard(),
            this._wizard
              .provider(NodeProvider.AZURE)
              .clientID(this.cloudSpec.azure.clientID)
              .clientSecret(this.cloudSpec.azure.clientSecret)
              .subscriptionID(this.cloudSpec.azure.subscriptionID)
              .tenantID(this.cloudSpec.azure.tenantID)
              .location(this.datacenter.spec.azure.location)
              .credential(this._selectedPreset)
              .flavors(),
            this._api.getAzureSizes(this.projectId, this.seed, this.clusterId)
          );
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        data => {
          this.sizes = data;
          if (this.nodeData.spec.cloud.azure.size === '') {
            this.form.controls.size.setValue(this.sizes[0].name);
          }

          this.loadingSizes = false;
          this.checkSizeState();
        },
        () => (this.loadingSizes = false)
      );
  }

  getZonesFormState(): string {
    if (
      !this.loadingZones &&
      this.isMissingCredentials() &&
      this.form.controls.size.value === '' &&
      this.isInWizard()
    ) {
      return 'Zone';
    } else if (this.loadingZones) {
      return 'Loading zones...';
    } else if (this.form.controls.size.value !== '' && !this.loadingZones && this.zones.length === 0) {
      return 'No Zones available';
    }
    return 'Zone';
  }

  checkZoneState(): void {
    if (this.zones.length === 0) {
      this.form.controls.zone.disable();
    } else {
      this.form.controls.zone.enable();
    }
  }

  showZoneHint(): boolean {
    return (
      !this.loadingZones &&
      (this.isMissingCredentials() || this.form.controls.size.value === '') &&
      !this._selectedPreset &&
      this.isInWizard()
    );
  }

  reloadAzureZones(): void {
    if (this.form.controls.size.value === '') {
      return;
    }

    this.loadingZones =
      (!this.isMissingCredentials() && this.form.controls.size.value !== '') ||
      !this.isInWizard() ||
      !!this._selectedPreset;

    iif(() => !!this.cloudSpec.dc, this._dcService.getDatacenter(this.cloudSpec.dc), EMPTY)
      .pipe(
        switchMap(dc => {
          this.datacenter = dc;

          return iif(
            () => this.isInWizard(),
            this._wizard
              .provider(NodeProvider.AZURE)
              .clientID(this.cloudSpec.azure.clientID)
              .clientSecret(this.cloudSpec.azure.clientSecret)
              .subscriptionID(this.cloudSpec.azure.subscriptionID)
              .tenantID(this.cloudSpec.azure.tenantID)
              .location(this.datacenter.spec.azure.location)
              .skuName(this.form.controls.size.value)
              .credential(this._selectedPreset)
              .availabilityZones(),
            this._api.getAzureAvailabilityZones(
              this.projectId,
              this.seed,
              this.clusterId,
              this.form.controls.size.value
            )
          );
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        (data: AzureZones) => {
          this.zones = data.zones.sort((a, b) => a.localeCompare(b));

          this.loadingZones = false;
          this.checkZoneState();
        },
        () => (this.loadingZones = false)
      );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (
        !changes.cloudSpec.previousValue ||
        changes.cloudSpec.currentValue.azure.clientID !== changes.cloudSpec.previousValue.azure.clientID ||
        changes.cloudSpec.currentValue.azure.clientSecret !== changes.cloudSpec.previousValue.azure.clientSecret ||
        changes.cloudSpec.currentValue.azure.subscriptionID !== changes.cloudSpec.previousValue.azure.subscriptionID ||
        changes.cloudSpec.currentValue.azure.tenantID !== changes.cloudSpec.previousValue.azure.tenantID
      ) {
        this.reloadAzureSizes();
      }
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        azure: {
          size: this.form.controls.size.value,
          assignPublicIP: this.nodeData.spec.cloud.azure.assignPublicIP,
          tags: this.nodeData.spec.cloud.azure.tags,
          imageID: this.form.controls.imageID.value,
          zone: this.form.controls.zone.value,
        },
      },
      valid: this.sizes.length > 0 && this.form.valid,
    };
  }
}
