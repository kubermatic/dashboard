import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {EMPTY, iif, Subject} from 'rxjs';
import {first, switchMap, take, takeUntil} from 'rxjs/operators';

import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
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

  sizes: AWSSize[] = [];
  diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  zones: AWSAvailabilityZone[] = [];
  form: FormGroup;
  tags: FormArray;
  hideOptional = true;
  datacenter: DataCenterEntity;

  private _loadingSizes = false;
  private _unsubscribe = new Subject<void>();
  private _loadingZones = false;
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
      tags: tagList,
      availability_zone: new FormControl(this.nodeData.spec.cloud.aws.availabilityZone),
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedPreset = credentials;
      this._reloadZones();
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
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
          this._disableSizes();
          this._reloadSizes();
        }
      }
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());

    this.loadDatacenter();
    this._reloadZones();
    this._reloadSizes();
  }

  loadDatacenter(): void {
    if (this.cloudSpec.dc) {
      this._dcService.getDataCenter(this.cloudSpec.dc).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
        this.datacenter = data;
      });
    }
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getNodeProviderData(): NodeProviderData {
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
          availabilityZone: this.form.controls.availability_zone.value,
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
    return (!!this.cloudSpec.aws.accessKeyId && !!this.cloudSpec.aws.secretAccessKey) || !!this._selectedPreset ||
        !this.isInWizard();
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
          this.datacenter = dc;

          return iif(
              () => this.isInWizard(),
              this._wizardService.provider(NodeProvider.AWS).region(this.datacenter.spec.aws.region).flavors(),
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
    this.sizes = data;
    if (this.sizes.length > 0) {
      if (this.nodeData.spec.cloud.aws.instanceType !== '' &&
          this.sizes.filter(value => value.name === this.nodeData.spec.cloud.aws.instanceType).length > 0) {
        this.form.controls.size.setValue(this.nodeData.spec.cloud.aws.instanceType);
      } else {
        this.form.controls.size.setValue(this.sizes[0].name);
      }
    }
  }

  private _reloadZones(): void {
    if (!this._hasCredentials) {
      this.zones = [];
      this.form.controls.availability_zone.setValue('');
      return;
    }

    this._loadingZones = true;
    iif(() => this.isInWizard(),
        this._wizardService.provider(NodeProvider.AWS)
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
    this.form.controls.availability_zone.enable();
    this.zones = data;
    if (this.zones.length > 0) {
      if (this.nodeData.spec.cloud.aws.availabilityZone !== '' &&
          this.zones.filter(value => value.name === this.nodeData.spec.cloud.aws.availabilityZone).length > 0) {
        this.form.controls.availability_zone.setValue(this.nodeData.spec.cloud.aws.availabilityZone);
      } else {
        this.form.controls.availability_zone.setValue(this.zones[0].name);
      }
    }
  }

  private _disableZones(): void {
    this._loadingZones = false;
    this.zones = [];
    this.form.controls.availability_zone.setValue('');
    this.form.controls.availability_zone.disable();
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
    this._wizardService.provider(NodeProvider.AWS)
        .accessKeyID(this.cloudSpec.aws.accessKeyId)
        .secretAccessKey(this.cloudSpec.aws.secretAccessKey)
        .vpc(this.cloudSpec.aws.vpcId)
        .subnets(this.cloudSpec.dc)
        .pipe(take(1))
        .subscribe((subnets) => {
          const findSubnet = subnets.find(x => x.id === subnetId);
          this.form.controls.availability_zone.setValue(findSubnet.availability_zone);
          this.form.controls.availability_zone.disable();
        });
  }
}
