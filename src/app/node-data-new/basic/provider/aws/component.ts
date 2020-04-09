import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {AWSSize, AWSSubnet} from '../../../../shared/entity/provider/aws/AWS';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Size = 'size',
  DiskSize = 'diskSize',
  DiskType = 'diskType',
  SubnetID = 'subnetId',
  AMI = 'ami',
}

@Component({
  selector: 'km-aws-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AWSBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AWSBasicNodeDataComponent), multi: true}
  ]
})
export class AWSBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  sizes: AWSSize[] = [];
  diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  hideOptional = false;
  defaultSubnet = '';
  defaultSize = '';

  readonly Controls = Controls;

  get subnetAZ(): string[] {
    return Object.keys(this._subnetMap);
  }

  private _subnets: AWSSubnet[] = [];
  private _subnetMap: {[type: string]: AWSSubnet[]} = {};

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control(''),
      [Controls.DiskSize]: this._builder.control(25, Validators.required),
      [Controls.DiskType]: this._builder.control(this.diskTypes[0], Validators.required),
      [Controls.SubnetID]: this._builder.control(''),
      [Controls.AMI]: this._builder.control(''),
    });

    this._nodeDataService.nodeData = this._getNodeData();
    this._setDefaultSubnet(this._subnets);

    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));
    this._subnetIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSubnet.bind(this));

    this._presets.presetChanges.pipe(tap(_ => this._clearSubnet()))
        .pipe(switchMap(_ => this._subnetIdsObservable))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._setDefaultSubnet.bind(this));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.nodeData = this._getNodeData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getSubnetToAZ(az: string): AWSSubnet[] {
    return this._subnetMap[az];
  }

  getSubnetOptionName(subnet: AWSSubnet): string {
    return subnet.name !== '' ? subnet.name + ' (' + subnet.id + ')' : subnet.id;
  }

  isInWizard(): boolean {
    return this._nodeDataService.isInWizardMode();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.aws.instanceType = size;
  }

  onSubnetChange(subnet: string): void {
    this._nodeDataService.nodeData.spec.cloud.aws.subnetID = subnet;
  }

  private get _sizesObservable(): Observable<AWSSize[]> {
    return this._nodeDataService.aws.flavors().pipe(catchError(() => of<AWSSize[]>()));
  }

  private get _subnetIdsObservable(): Observable<AWSSubnet[]> {
    return this._nodeDataService.aws.subnets().pipe(catchError(() => of<AWSSubnet[]>()));
  }

  private _setDefaultSize(sizes: AWSSize[]): void {
    this.sizes = sizes.sort((a, b) => a.name.localeCompare(b.name));
    if (this.sizes.length > 0) {
      const cheapestInstance = this.sizes.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      this.defaultSize = cheapestInstance.name;
    }
  }

  private _clearSubnet(): void {
    this._subnets = [];
    this._subnetMap = {};
  }

  private _setDefaultSubnet(subnets: AWSSubnet[]): void {
    if (subnets.length === 0) {
      return;
    }

    this._subnets = subnets;
    this._subnetMap = {};
    const defaultSubnet = this._subnets.find(s => s.isDefaultSubnet);
    this.defaultSubnet = defaultSubnet ? defaultSubnet.id : this._subnets[0].id;
    this._initSubnetMap();
  }

  private _initSubnetMap(): void {
    this._subnets = this._subnets.sort((a, b) => a.name.localeCompare(b.name));
    this._subnets.forEach(subnet => {
      const found = this.subnetAZ.find(s => s === subnet.availability_zone);
      if (!found) {
        this._subnetMap[subnet.availability_zone] = [];
      }

      this._subnetMap[subnet.availability_zone].push(subnet);
    });
  }

  private _getAZFromSubnet(subnetID: string): string {
    const findSubnet = this._subnets.find(x => x.id === subnetID);
    return findSubnet ? findSubnet.availability_zone : '';
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          aws: {
            diskSize: this.form.get(Controls.DiskSize).value,
            ami: this.form.get(Controls.AMI).value,
            volumeType: this.form.get(Controls.DiskType).value,
            availabilityZone: this._getAZFromSubnet(this.form.get(Controls.SubnetID).value),
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
