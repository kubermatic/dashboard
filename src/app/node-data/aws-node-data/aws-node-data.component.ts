import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {FormControl, FormGroup, Validators} from '@angular/forms';
import {EMPTY, iif, Subject} from 'rxjs';
import {
  debounceTime,
  startWith,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators';

import {
  ApiService,
  DatacenterService,
  WizardService,
} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {AWSSize, AWSSubnet} from '../../shared/entity/provider/aws/AWS';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';
import {
  filterArrayOptions,
  filterObjectOptions,
} from '../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../shared/validators/autocomplete-filter.validator';

@Component({
  selector: 'km-aws-node-data',
  templateUrl: './aws-node-data.component.html',
})
export class AWSNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() clusterId: string;
  @Input() projectId: string;
  @Input() seedDCName: string;

  sizes: AWSSize[] = [];
  diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  form: FormGroup;
  subnetIds: AWSSubnet[] = [];
  filteredSubnets: {[type: string]: AWSSubnet[]} = {};
  filteredSizes: AWSSize[] = [];

  private _subnetMap: {[type: string]: AWSSubnet[]} = {};
  private _loadingSubnetIds = false;
  private _loadingSizes = false;
  private _noSubnets = false;
  private _unsubscribe = new Subject<void>();
  private _selectedPreset: string;

  constructor(
    private readonly _addNodeService: NodeDataService,
    private readonly _wizardService: WizardService,
    private readonly _apiService: ApiService,
    private readonly _dcService: DatacenterService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      size: new FormControl(
        {value: this.nodeData.spec.cloud.aws.instanceType, disabled: true},
        [
          Validators.required,
          AutocompleteFilterValidators.mustBeInArrayList(
            this.sizes,
            'name',
            true
          ),
        ]
      ),
      disk_size: new FormControl(
        this.nodeData.spec.cloud.aws.diskSize,
        Validators.required
      ),
      disk_type: new FormControl(
        this.nodeData.spec.cloud.aws.volumeType,
        Validators.required
      ),
      ami: new FormControl(this.nodeData.spec.cloud.aws.ami),
      subnetID: new FormControl(this.nodeData.spec.cloud.aws.subnetID, [
        Validators.required,
        AutocompleteFilterValidators.mustBeInObjectList(
          this._subnetMap,
          'id',
          true
        ),
      ]),
    });

    this._wizardService.onCustomPresetSelect
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(credentials => {
        this._selectedPreset = credentials;
      });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this.form.controls.subnetID.valueChanges
      .pipe(debounceTime(1000), takeUntil(this._unsubscribe), startWith(''))
      .subscribe(value => {
        if (value !== '' && !this.form.controls.subnetID.pristine) {
          this.filteredSubnets = filterObjectOptions(
            value,
            'id',
            this._subnetMap
          );
        } else {
          this.filteredSubnets = this._subnetMap;
        }
        this.form.controls.subnetID.setValidators([
          Validators.required,
          AutocompleteFilterValidators.mustBeInObjectList(
            this._subnetMap,
            'id',
            true
          ),
        ]);
      });

    this.form.controls.size.valueChanges
      .pipe(debounceTime(1000), takeUntil(this._unsubscribe), startWith(''))
      .subscribe(value => {
        if (value !== '' && !this.form.controls.size.pristine) {
          this.filteredSizes = filterArrayOptions(value, 'name', this.sizes);
        } else {
          this.filteredSizes = this.sizes;
        }
        this.form.controls.size.setValidators([
          Validators.required,
          AutocompleteFilterValidators.mustBeInArrayList(
            this.sizes,
            'name',
            true
          ),
        ]);
      });

    this._addNodeService.nodeProviderDataChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.nodeData.spec.cloud.aws = data.spec.aws;
        this.nodeData.valid = data.valid;
      });

    this._wizardService.clusterProviderSettingsFormChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (
          (data.cloudSpec.aws.vpcId !== '' &&
            data.cloudSpec.aws.accessKeyId !== '' &&
            data.cloudSpec.aws.secretAccessKey !== '') ||
          this._selectedPreset
        ) {
          if (
            data.cloudSpec.aws.vpcId !== this.cloudSpec.aws.vpcId ||
            data.cloudSpec.aws.accessKeyId !== this.cloudSpec.aws.accessKeyId ||
            data.cloudSpec.aws.secretAccessKey !==
              this.cloudSpec.aws.secretAccessKey
          ) {
            this.clearSubnetId();
          }
          this.cloudSpec = data.cloudSpec;
          this._loadSubnetIds();
          this.checkSubnetState();
        } else if (
          data.cloudSpec.aws.vpcId === '' ||
          data.cloudSpec.aws.accessKeyId === '' ||
          data.cloudSpec.aws.secretAccessKey === ''
        ) {
          this.clearSubnetId();
        }
        this.cloudSpec = data.cloudSpec;
      });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());

    this._reloadSizes();
    this._loadSubnetIds();
    this.checkSubnetState();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  clearSubnetId(): void {
    this.subnetIds = [];
    this._subnetMap = {};

    this.form.controls.subnetID.setValue('');
    this.checkSubnetState();
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        aws: {
          instanceType: this.form.controls.size.value,
          diskSize: this.form.controls.disk_size.value,
          ami: this.form.controls.ami.value,
          volumeType: this.form.controls.disk_type.value,
          subnetID: this.form.controls.subnetID.value,
          availabilityZone: this.getAZFromSubnet(
            this.form.controls.subnetID.value
          ),
          assignPublicIP: this.nodeData.spec.cloud.aws.assignPublicIP,
          tags: this.nodeData.spec.cloud.aws.tags,
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
    return (
      (!!this.cloudSpec.aws.accessKeyId &&
        !!this.cloudSpec.aws.secretAccessKey) ||
      !this.isInWizard()
    );
  }

  getSizeHint(): string {
    if (this.sizes.length > 0) {
      return '';
    }

    if (this._loadingSizes) {
      return 'Loading instance types...';
    } else {
      return '';
    }
  }

  private _reloadSizes(): void {
    this._loadingSizes = true;

    iif(
      () => !!this.cloudSpec.dc,
      this._dcService.getDataCenter(this.cloudSpec.dc),
      EMPTY
    )
      .pipe(
        switchMap(dc => {
          return iif(
            () => this.isInWizard(),
            this._wizardService
              .provider(NodeProvider.AWS)
              .region(dc.spec.aws.region)
              .flavors(),
            this._apiService.getAWSSizes(
              this.projectId,
              this.seedDCName,
              this.clusterId
            )
          );
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        data => {
          this._loadingSizes = false;
          this._enableSizes(data);
        },
        () => this._disableSizes()
      );
  }

  private _disableSizes(): void {
    this._loadingSizes = false;
    this.sizes = [];
    this.form.controls.size.setValue('');
    this.form.controls.size.disable();
  }

  private _enableSizes(data: AWSSize[]): void {
    this._loadingSizes = false;
    this.form.controls.size.enable();
    this.sizes = data.sort((a, b) => a.name.localeCompare(b.name));

    if (this.sizes.length > 0) {
      if (
        this.nodeData.spec.cloud.aws.instanceType !== '' &&
        this.sizes.filter(
          value => value.name === this.nodeData.spec.cloud.aws.instanceType
        ).length > 0
      ) {
        this.form.controls.size.setValue(
          this.nodeData.spec.cloud.aws.instanceType
        );
      } else {
        const cheapestInstance = this.sizes.reduce((prev, curr) =>
          prev.price < curr.price ? prev : curr
        );
        this.form.controls.size.setValue(cheapestInstance.name);
      }
    }
  }

  private _loadSubnetIds(): void {
    if (
      (!!this._hasCredentials() && !!this.cloudSpec.aws.vpcId) ||
      !!this._selectedPreset
    ) {
      this._loadingSubnetIds = true;
    }

    iif(
      () => this.isInWizard(),
      this._wizardService
        .provider(NodeProvider.AWS)
        .accessKeyID(this.cloudSpec.aws.accessKeyId)
        .secretAccessKey(this.cloudSpec.aws.secretAccessKey)
        .vpc(this.cloudSpec.aws.vpcId)
        .credential(this._selectedPreset)
        .subnets(this.cloudSpec.dc),
      this._apiService.getAWSSubnets(
        this.projectId,
        this.seedDCName,
        this.clusterId
      )
    )
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        subnets => {
          this.fillSubnetMap(subnets);

          if (this.subnetIds.length === 0) {
            this.form.controls.subnetID.setValue('');
            this._noSubnets = true;
          } else {
            if (this.nodeData.spec.cloud.aws.subnetID === '') {
              this.form.controls.subnetID.setValue(
                this._getDefaultSubnet(subnets)
              );
            }
            this._noSubnets = false;
          }

          this._loadingSubnetIds = false;
          this.checkSubnetState();
        },
        () => {
          this.clearSubnetId();
          this._loadingSubnetIds = false;
        },
        () => {
          this._loadingSubnetIds = false;
        }
      );
  }

  private _getDefaultSubnet(subnets: AWSSubnet[]): string {
    if (subnets.length < 1) {
      return '';
    }

    const defaultSubnet = subnets.find(s => s.isDefaultSubnet);
    return defaultSubnet ? defaultSubnet.id : subnets[0].id;
  }

  fillSubnetMap(subnets: AWSSubnet[]): void {
    this.sortSubnets(subnets);

    this._subnetMap = {};
    this.subnetIds.forEach(subnet => {
      this.fillSubnetsMapWithAZ(subnet);
    });
  }

  sortSubnets(subnets: AWSSubnet[]): void {
    this.subnetIds = subnets.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  fillSubnetsMapWithAZ(subnet: AWSSubnet): void {
    const find = this.subnetAZ.find(x => x === subnet.availability_zone);
    if (!find) {
      this._subnetMap[subnet.availability_zone] = [];
    }
    this.fillSubnetsMapWithSubnets(subnet);
  }

  fillSubnetsMapWithSubnets(subnet: AWSSubnet): void {
    this._subnetMap[subnet.availability_zone].push(subnet);
  }

  getAZFromSubnet(subnetId: string): string {
    const findSubnet = this.subnetIds.find(x => x.id === subnetId);
    return findSubnet ? findSubnet.availability_zone : '';
  }

  getSubnetIDHint(): string {
    return !this._loadingSubnetIds &&
      (!this._hasCredentials() || this.cloudSpec.aws.vpcId === '') &&
      !this._selectedPreset
      ? 'Please enter your credentials first.'
      : '';
  }

  get subnetAZ(): string[] {
    return Object.keys(this._subnetMap);
  }

  getSubnetToAZ(az: string): AWSSubnet[] {
    return this.form.controls.subnetID.value === ''
      ? this._subnetMap[az]
      : this.filteredSubnets[az];
  }

  getSubnetOptionName(subnet: AWSSubnet): string {
    return subnet.name !== ''
      ? subnet.name + ' (' + subnet.id + ')'
      : subnet.id;
  }

  getSubnetIDFormState(): string {
    if (
      !this._loadingSubnetIds &&
      (!this._hasCredentials() || this.cloudSpec.aws.vpcId === '')
    ) {
      return 'Subnet ID & Availability Zone*';
    } else if (this._loadingSubnetIds && !this._noSubnets) {
      return 'Loading Subnet IDs & Availability Zones...';
    } else if (
      (this.cloudSpec.aws.vpcId !== '' && this.subnetIds.length === 0) ||
      this._noSubnets
    ) {
      return 'No Subnet IDs & Availability Zones available';
    } else {
      return 'Subnet ID & Availability Zone*';
    }
  }

  checkSubnetState(): void {
    if (this.subnetIds.length === 0 && this.form.controls.subnetID.enabled) {
      this.form.controls.subnetID.disable();
    } else if (
      this.subnetIds.length > 0 &&
      this.form.controls.subnetID.disabled
    ) {
      this.form.controls.subnetID.enable();
    }
  }
}
