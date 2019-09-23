import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {EMPTY, iif, Subject} from 'rxjs';
import {switchMap, take, takeUntil} from 'rxjs/operators';

import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {AWSSize, AWSSubnet} from '../../shared/entity/provider/aws/AWS';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-aws-node-data',
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
  tags: FormArray;
  hideOptional = true;
  subnetIds: AWSSubnet[] = [];

  private _subnetMap: {[type: string]: AWSSubnet[]} = {};
  private _loadingSubnetIds = false;
  private _loadingSizes = false;
  private _noSubnets = false;
  private _unsubscribe = new Subject<void>();
  private _selectedPreset: string;

  constructor(
      private readonly _addNodeService: NodeDataService, private readonly _wizardService: WizardService,
      private readonly _apiService: ApiService, private readonly _dcService: DatacenterService) {}

  ngOnInit(): void {
    const tagList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.aws.tags) {
      if (this.nodeData.spec.cloud.aws.tags.hasOwnProperty(i)) {
        tagList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.aws.tags[i]),
        }));
      }
    }
    this.form = new FormGroup({
      size: new FormControl({value: this.nodeData.spec.cloud.aws.instanceType, disabled: true}, Validators.required),
      disk_size: new FormControl(this.nodeData.spec.cloud.aws.diskSize, Validators.required),
      disk_type: new FormControl(this.nodeData.spec.cloud.aws.volumeType, Validators.required),
      ami: new FormControl(this.nodeData.spec.cloud.aws.ami),
      assignPublicIP: new FormControl(this.nodeData.spec.cloud.aws.assignPublicIP),
      tags: tagList,
      subnetId: new FormControl(this.nodeData.spec.cloud.aws.subnetId, Validators.required),
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedPreset = credentials;
      if (!credentials) {
        this.clearSubnetId();
      }
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if ((data.cloudSpec.aws.vpcId !== '' && data.cloudSpec.aws.accessKeyId !== '' &&
           data.cloudSpec.aws.secretAccessKey !== '') ||
          this._selectedPreset) {
        if (data.cloudSpec.aws.vpcId !== this.cloudSpec.aws.vpcId ||
            data.cloudSpec.aws.accessKeyId !== this.cloudSpec.aws.accessKeyId ||
            data.cloudSpec.aws.secretAccessKey !== this.cloudSpec.aws.secretAccessKey) {
          this.clearSubnetId();
        }
        this.cloudSpec = data.cloudSpec;
        this._loadSubnetIds();
        this.checkSubnetState();
      } else if (
          data.cloudSpec.aws.vpcId === '' || data.cloudSpec.aws.accessKeyId === '' ||
          data.cloudSpec.aws.secretAccessKey === '') {
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
    this.form.controls.subnetId.setValue('');
    this.checkSubnetState();
  }

  getNodeProviderData(): NodeProviderData {
    const azFromSubnet = this.getAZFromSubnet(this.form.controls.subnetId.value);
    const tagMap = {};
    for (const i in this.form.controls.tags.value) {
      if (this.form.controls.tags.value[i].key !== '' && this.form.controls.tags.value[i].value !== '') {
        tagMap[this.form.controls.tags.value[i].key] = this.form.controls.tags.value[i].value;
      }
    }

    return {
      spec: {
        aws: {
          instanceType: this.form.controls.size.value,
          diskSize: this.form.controls.disk_size.value,
          ami: this.form.controls.ami.value,
          tags: tagMap,
          volumeType: this.form.controls.disk_type.value,
          subnetId: this.form.controls.subnetId.value,
          availabilityZone: azFromSubnet,
          assignPublicIP: this.form.controls.assignPublicIP.value,
        },
      },
      valid: this.form.valid,
    };
  }

  getTagForm(form): any {
    return form.get('tags').controls;
  }

  addTag(): void {
    this.tags = this.form.get('tags') as FormArray;
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteTag(index: number): void {
    const arrayControl = this.form.get('tags') as FormArray;
    arrayControl.removeAt(index);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _hasCredentials(): boolean {
    return (!!this.cloudSpec.aws.accessKeyId && !!this.cloudSpec.aws.secretAccessKey) || !this.isInWizard();
  }

  getSizeHint(): string {
    if (this.sizes.length > 0) {
      return '';
    }

    if (this._loadingSizes) {
      return `Loading instance types...`;
    } else {
      return '';
    }
  }

  private _reloadSizes(): void {
    this._loadingSizes = true;

    iif(() => !!this.cloudSpec.dc, this._dcService.getDataCenter(this.cloudSpec.dc), EMPTY)
        .pipe(switchMap(dc => {
          return iif(
              () => this.isInWizard(),
              this._wizardService.provider(NodeProvider.AWS).region(dc.spec.aws.region).flavors(),
              this._apiService.getAWSSizes(this.projectId, this.seedDCName, this.clusterId));
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => {
          this._loadingSizes = false;
          this._enableSizes(data);
        }, () => this._disableSizes());
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
      if (this.nodeData.spec.cloud.aws.instanceType !== '' &&
          this.sizes.filter(value => value.name === this.nodeData.spec.cloud.aws.instanceType).length > 0) {
        this.form.controls.size.setValue(this.nodeData.spec.cloud.aws.instanceType);
      } else {
        const cheapestInstance = this.sizes.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
        this.form.controls.size.setValue(cheapestInstance.name);
      }
    }
  }

  private _loadSubnetIds(): void {
    if ((!!this._hasCredentials() && !!this.cloudSpec.aws.vpcId) || !!this._selectedPreset) {
      this._loadingSubnetIds = true;
    }

    iif(() => this.isInWizard(),
        this._wizardService.provider(NodeProvider.AWS)
            .accessKeyID(this.cloudSpec.aws.accessKeyId)
            .secretAccessKey(this.cloudSpec.aws.secretAccessKey)
            .vpc(this.cloudSpec.aws.vpcId)
            .credential(this._selectedPreset)
            .subnets(this.cloudSpec.dc),
        this._apiService.getAWSSubnets(this.projectId, this.seedDCName, this.clusterId))
        .pipe(take(1))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            (subnets) => {
              this.subnetIds = subnets.sort((a, b) => {
                return a.name.localeCompare(b.name);
              });

              this._subnetMap = {};
              this.subnetIds.forEach(subnet => {
                const find = this.subnetAZ.find(x => x === subnet.availability_zone);
                if (!find) {
                  this._subnetMap[subnet.availability_zone] = [];
                }
                this._subnetMap[subnet.availability_zone].push(subnet);
              });

              if (this.subnetIds.length === 0) {
                this.form.controls.subnetId.setValue('');
                this._noSubnets = true;
              } else {
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
            });
  }

  getAZFromSubnet(subnetId: string): string {
    const findSubnet = this.subnetIds.find(x => x.id === subnetId);
    return findSubnet ? findSubnet.availability_zone : '';
  }

  getSubnetIDHint(): string {
    return (!this._loadingSubnetIds && (!this._hasCredentials() || this.cloudSpec.aws.vpcId === '') &&
            !this._selectedPreset) ?
        'Please enter your credentials first.' :
        '';
  }

  get subnetAZ(): string[] {
    return Object.keys(this._subnetMap);
  }

  getSubnetToAZ(az: string): AWSSubnet[] {
    return this._subnetMap[az];
  }

  getSubnetOptionName(subnet: AWSSubnet): string {
    return subnet.name !== '' ? subnet.name + ' (' + subnet.id + ')' : subnet.id;
  }

  getSubnetIDFormState(): string {
    if (!this._loadingSubnetIds && (!this._hasCredentials() || this.cloudSpec.aws.vpcId === '')) {
      return 'Subnet ID*';
    } else if (this._loadingSubnetIds && !this._noSubnets) {
      return 'Loading Subnet IDs...';
    } else if (this.cloudSpec.aws.vpcId !== '' && this.subnetIds.length === 0 || this._noSubnets) {
      return 'No Subnet IDs available';
    } else {
      return 'Subnet ID*';
    }
  }

  checkSubnetState(): void {
    if (this.subnetIds.length === 0 && this.form.controls.subnetId.enabled) {
      this.form.controls.subnetId.disable();
    } else if (this.subnetIds.length > 0 && this.form.controls.subnetId.disabled) {
      this.form.controls.subnetId.enable();
    }
  }
}
