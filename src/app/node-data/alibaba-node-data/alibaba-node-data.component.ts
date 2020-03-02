import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {FormControl, FormGroup, Validators} from '@angular/forms';
import {EMPTY, iif, Subject} from 'rxjs';
import {debounceTime, startWith, switchMap, takeUntil} from 'rxjs/operators';

import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {AlibabaInstanceType} from '../../shared/entity/provider/alibaba/Alibaba';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';
import {filterArrayOptions} from '../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../shared/validators/autocomplete-filter.validator';

@Component({
  selector: 'kubermatic-alibaba-node-data',
  templateUrl: './alibaba-node-data.component.html',
})

export class AlibabaNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;
  @Input() projectId: string;
  @Input() seedDCName: string;

  instanceTypes: AlibabaInstanceType[] = [];
  diskTypes: string[] = ['cloud', 'cloud_efficiency', 'cloud_ssd', 'cloud_essd', 'san_ssd', 'san_efficiency'];
  form: FormGroup;
  filteredInstanceTypes: AlibabaInstanceType[] = [];

  private _loadingInstanceTypes = false;
  private _unsubscribe = new Subject<void>();
  private _selectedPreset: string;

  constructor(
      private readonly _addNodeService: NodeDataService, private readonly _wizardService: WizardService,
      private readonly _apiService: ApiService, private readonly _dcService: DatacenterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      instanceType: new FormControl(
          {value: this.nodeData.spec.cloud.alibaba.instanceType, disabled: true},
          [Validators.required, AutocompleteFilterValidators.mustBeInArrayList(this.instanceTypes, 'id', true)]),
      diskSize: new FormControl(this.nodeData.spec.cloud.alibaba.diskSize, Validators.required),
      diskType: new FormControl(this.nodeData.spec.cloud.alibaba.diskType, Validators.required),
      internetMaxBandwidthOut:
          new FormControl(this.nodeData.spec.cloud.alibaba.internetMaxBandwidthOut, Validators.required),
      vSwitchID: new FormControl(this.nodeData.spec.cloud.alibaba.vSwitchID, Validators.required),
      zoneID: new FormControl(this.nodeData.spec.cloud.alibaba.zoneID, Validators.required),
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedPreset = credentials;
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this.form.controls.instanceType.valueChanges.pipe(debounceTime(1000), takeUntil(this._unsubscribe), startWith(''))
        .subscribe(value => {
          if (value !== '' && !this.form.controls.instanceType.pristine) {
            this.filteredInstanceTypes = filterArrayOptions(value, 'id', this.instanceTypes);
          } else {
            this.filteredInstanceTypes = this.instanceTypes;
          }
          this.form.controls.instanceType.setValidators(
              [Validators.required, AutocompleteFilterValidators.mustBeInArrayList(this.instanceTypes, 'id', true)]);
        });

    this._addNodeService.nodeProviderDataChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.nodeData.spec.cloud.alibaba = data.spec.alibaba;
      this.nodeData.valid = data.valid;
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cloudSpec = data.cloudSpec;
      if (!!this._hasCredentials()) {
        this._loadInstanceTypes();
      } else {
        this._clearInstanceTypes();
      }
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    this._loadInstanceTypes();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        alibaba: {
          instanceType: this.form.controls.instanceType.value,
          diskSize: this.form.controls.diskSize.value,
          diskType: this.form.controls.diskType.value,
          internetMaxBandwidthOut: this.form.controls.internetMaxBandwidthOut.value,
          vSwitchID: this.form.controls.vSwitchID.value,
          zoneID: this.form.controls.zoneID.value,
          labels: this.nodeData.spec.cloud.alibaba.labels,
        },
      },
      valid: this.form.valid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _hasCredentials(): boolean {
    return (!!this.cloudSpec.alibaba.accessKeyID && !!this.cloudSpec.alibaba.accessKeySecret) ||
        !!this._selectedPreset || !this.isInWizard();
  }

  getInstanceTypeHint(): string {
    if (this.instanceTypes.length > 0) {
      return '';
    }

    if (this.isInWizard() && !this._loadingInstanceTypes && !(this._hasCredentials() || this._selectedPreset)) {
      return 'Please enter valid credentials first.';
    } else if (this._loadingInstanceTypes) {
      return `Loading Instance Types...`;
    } else {
      return '';
    }
  }

  private _loadInstanceTypes(): void {
    this._loadingInstanceTypes = true;

    iif(() => !!this.cloudSpec.dc, this._dcService.getDataCenter(this.cloudSpec.dc), EMPTY)
        .pipe(switchMap(dc => {
          return iif(
              () => this.isInWizard(),
              this._wizardService.provider(NodeProvider.ALIBABA)
                  .accessKeyID(this.cloudSpec.alibaba.accessKeyID)
                  .accessKeySecret(this.cloudSpec.alibaba.accessKeySecret)
                  .region(dc.spec.alibaba.region)
                  .credential(this._selectedPreset)
                  .instanceTypes(),
              this._apiService.getAlibabaInstanceTypes(
                  this.projectId, this.seedDCName, this.clusterId, dc.spec.alibaba.region));
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            (instanceTypes) => {
              this.instanceTypes = instanceTypes.sort((a, b) => a.id.localeCompare(b.id));

              if (this.instanceTypes.length === 0) {
                this.form.controls.instanceType.setValue('');
              } else {
                if (this.nodeData.spec.cloud.alibaba.instanceType === '') {
                  this.form.controls.instanceType.setValue(instanceTypes[0].id);
                }
              }

              this._loadingInstanceTypes = false;
              this._checkInstanceTypeState();
            },
            () => {
              this._clearInstanceTypes();
              this._loadingInstanceTypes = false;
            },
            () => {
              this._loadingInstanceTypes = false;
            });
  }

  private _checkInstanceTypeState(): void {
    if (this.instanceTypes.length === 0 && this.form.controls.instanceType.enabled) {
      this.form.controls.instanceType.disable();
    } else if (this.instanceTypes.length > 0 && this.form.controls.instanceType.disabled) {
      this.form.controls.instanceType.enable();
    }
  }

  private _clearInstanceTypes(): void {
    this.instanceTypes = [];
    this.form.controls.instanceType.setValue('');
    this._checkInstanceTypeState();
  }
}
