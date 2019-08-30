import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {AWSSubnet} from '../../shared/entity/provider/aws/AWS';
import {NodeInstanceFlavor, NodeProvider} from '../../shared/model/NodeProviderConstants';
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

  instanceTypes: NodeInstanceFlavor[] = this._wizard.provider(NodeProvider.AWS).flavors();
  diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  awsNodeForm: FormGroup;
  tags: FormArray;
  hideOptional = true;
  subnetIds: AWSSubnet[] = [];

  private _subnetMap: {[type: string]: AWSSubnet[]} = {};
  private _loadingSubnetIds = false;
  private _noSubnets = false;
  private _unsubscribe = new Subject<void>();
  private _selectedPreset: string;

  constructor(
      private readonly _addNodeService: NodeDataService, private readonly _wizard: WizardService,
      private readonly _apiService: ApiService) {}

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

    this.awsNodeForm = new FormGroup({
      type: new FormControl(this.nodeData.spec.cloud.aws.instanceType, Validators.required),
      disk_size: new FormControl(this.nodeData.spec.cloud.aws.diskSize, Validators.required),
      disk_type: new FormControl(this.nodeData.spec.cloud.aws.volumeType, Validators.required),
      ami: new FormControl(this.nodeData.spec.cloud.aws.ami),
      tags: tagList,
      subnetId: new FormControl(this.nodeData.spec.cloud.aws.subnetId, Validators.required),
    });

    if (this.nodeData.spec.cloud.aws.instanceType === '') {
      this.awsNodeForm.controls.type.setValue(this.instanceTypes[0].id);
    }

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedPreset = credentials;
      if (!credentials) {
        this.clearSubnetId();
      }
    });

    this.awsNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
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
      }
      this.cloudSpec = data.cloudSpec;
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());

    this._loadSubnetIds();
    this.checkSubnetState();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  clearSubnetId(): void {
    this.subnetIds = [];
    this._subnetMap = {};
    this.awsNodeForm.controls.subnetId.setValue('');
    this.checkSubnetState();
  }

  getNodeProviderData(): NodeProviderData {
    const azFromSubnet = this.getAZFromSubnet(this.awsNodeForm.controls.subnetId.value);
    const tagMap = {};
    for (const i in this.awsNodeForm.controls.tags.value) {
      if (this.awsNodeForm.controls.tags.value[i].key !== '' && this.awsNodeForm.controls.tags.value[i].value !== '') {
        tagMap[this.awsNodeForm.controls.tags.value[i].key] = this.awsNodeForm.controls.tags.value[i].value;
      }
    }

    return {
      spec: {
        aws: {
          instanceType: this.awsNodeForm.controls.type.value,
          diskSize: this.awsNodeForm.controls.disk_size.value,
          ami: this.awsNodeForm.controls.ami.value,
          tags: tagMap,
          volumeType: this.awsNodeForm.controls.disk_type.value,
          subnetId: this.awsNodeForm.controls.subnetId.value,
          availabilityZone: azFromSubnet,
        },
      },
      valid: this.awsNodeForm.valid,
    };
  }

  getTagForm(form): any {
    return form.get('tags').controls;
  }

  addTag(): void {
    this.tags = this.awsNodeForm.get('tags') as FormArray;
    this.tags.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteTag(index: number): void {
    const arrayControl = this.awsNodeForm.get('tags') as FormArray;
    arrayControl.removeAt(index);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _hasCredentials(): boolean {
    return (!!this.cloudSpec.aws.accessKeyId && !!this.cloudSpec.aws.secretAccessKey) || !this.isInWizard();
  }

  private _loadSubnetIds(): void {
    if ((!!this._hasCredentials() && !!this.cloudSpec.aws.vpcId) || !!this._selectedPreset) {
      this._loadingSubnetIds = true;
    }

    iif(() => this.isInWizard(),
        this._wizard.provider(NodeProvider.AWS)
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
                this.awsNodeForm.controls.subnetId.setValue('');
                this._noSubnets = true;
              } else {
                this._noSubnets = false;
              }

              this._loadingSubnetIds = false;
              this.checkSubnetState();
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
    if (this.subnetIds.length === 0 && this.awsNodeForm.controls.subnetId.enabled) {
      this.awsNodeForm.controls.subnetId.disable();
    } else if (this.subnetIds.length > 0 && this.awsNodeForm.controls.subnetId.disabled) {
      this.awsNodeForm.controls.subnetId.enable();
    }
  }
}
