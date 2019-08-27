import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {first, take, takeUntil} from 'rxjs/operators';

import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {AWSAvailabilityZone, AWSSize} from '../../shared/entity/provider/aws/AWS';
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

  instanceTypes: AWSSize[] = [];
  diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  zones: AWSAvailabilityZone[] = [];
  awsNodeForm: FormGroup;
  tags: FormArray;
  hideOptional = true;

  private _unsubscribe = new Subject<void>();
  private _loadingZones = false;
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
      availability_zone: new FormControl(this.nodeData.spec.cloud.aws.availabilityZone),
    });

    if (this.nodeData.spec.cloud.aws.instanceType === '') {
      this.awsNodeForm.controls.type.setValue(this.instanceTypes[0].id);
    }

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedPreset = credentials;
      this._reloadZones();
    });

    this.awsNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.cloudSpec.aws.subnetId !== '' && data.cloudSpec.aws.subnetId !== this.cloudSpec.aws.subnetId) {
        this.loadSubnetsAndSetAZ(data.cloudSpec.aws.subnetId);
        this.cloudSpec = data.cloudSpec;
      } else if (
          data.cloudSpec.aws.accessKeyId !== this.cloudSpec.aws.accessKeyId ||
          data.cloudSpec.aws.secretAccessKey !== this.cloudSpec.aws.secretAccessKey) {
        if (data.cloudSpec.aws.subnetId !== '') {
          this.loadSubnetsAndSetAZ(data.cloudSpec.aws.subnetId);
          this.cloudSpec = data.cloudSpec;
        } else {
          this.cloudSpec = data.cloudSpec;
          this._disableZones();
          this._reloadZones();
        }
      }
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());

    this._reloadZones();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getNodeProviderData(): NodeProviderData {
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
          availabilityZone: this.awsNodeForm.controls.availability_zone.value,
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
    return (!!this.cloudSpec.aws.accessKeyId && !!this.cloudSpec.aws.secretAccessKey) || !!this._selectedPreset ||
        !this.isInWizard();
  }

  private _reloadZones(): void {
    if (!this._hasCredentials) {
      this.zones = [];
      this.awsNodeForm.controls.availability_zone.setValue('');
      return;
    }

    this._loadingZones = true;
    iif(() => this.isInWizard(),
        this._wizard.provider(NodeProvider.AWS)
            .accessKeyID(this.cloudSpec.aws.accessKeyId)
            .secretAccessKey(this.cloudSpec.aws.secretAccessKey)
            .credential(this._selectedPreset)
            .zones(this.cloudSpec.dc),
        this._apiService.getAWSZones(this.projectId, this.seedDCName, this.clusterId))
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => {
          this._loadingZones = false;
          this._enableZones(data);
        }, () => this._disableZones());
  }

  private _enableZones(data: AWSAvailabilityZone[]): void {
    this._loadingZones = false;
    this.awsNodeForm.controls.availability_zone.enable();
    this.zones = data;
    if (this.zones.length > 0) {
      if (this.nodeData.spec.cloud.aws.availabilityZone !== '' &&
          this.zones.filter(value => value.name === this.nodeData.spec.cloud.aws.availabilityZone).length > 0) {
        this.awsNodeForm.controls.availability_zone.setValue(this.nodeData.spec.cloud.aws.availabilityZone);
      } else {
        this.awsNodeForm.controls.availability_zone.setValue(this.zones[0].name);
      }
    }
  }

  private _disableZones(): void {
    this._loadingZones = false;
    this.zones = [];
    this.awsNodeForm.controls.availability_zone.setValue('');
    this.awsNodeForm.controls.availability_zone.disable();
  }

  getAvailabilityZoneFormState(): string {
    if (this.isInWizard() && !this._loadingZones &&
        !((this.cloudSpec.aws.accessKeyId && this.cloudSpec.aws.secretAccessKey) || this._selectedPreset)) {
      return 'Availability Zone*';
    } else if (this._loadingZones) {
      return 'Loading Availability Zones...';
    } else if (this.zones.length === 0) {
      return 'No Availability Zones available';
    } else {
      return 'Availability Zone*';
    }
  }

  getZoneHint(): string {
    if (this.zones.length > 0 && this.cloudSpec.aws.subnetId !== '') {
      return 'Note: Availability Zone was set corresponding to the chosen Subnet ID';
    } else if (
        this.isInWizard() && !this._loadingZones &&
        !((this.cloudSpec.aws.accessKeyId && this.cloudSpec.aws.secretAccessKey) || this._selectedPreset)) {
      return 'Please enter valid credentials first.';
    } else {
      return '';
    }
  }

  loadSubnetsAndSetAZ(subnetId: string): void {
    this._wizard.provider(NodeProvider.AWS)
        .accessKeyID(this.cloudSpec.aws.accessKeyId)
        .secretAccessKey(this.cloudSpec.aws.secretAccessKey)
        .vpc(this.cloudSpec.aws.vpcId)
        .subnets(this.cloudSpec.dc)
        .pipe(take(1))
        .subscribe((subnets) => {
          const findSubnet = subnets.find(x => x.id === subnetId);
          this.awsNodeForm.controls.availability_zone.setValue(findSubnet.availability_zone);
          this.awsNodeForm.controls.availability_zone.disable();
        });
  }
}
