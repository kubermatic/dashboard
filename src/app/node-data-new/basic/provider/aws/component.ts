import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {AWSCloudSpec} from '../../../../shared/entity/cloud/AWSCloudSpec';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {AWSSize, AWSSubnet} from '../../../../shared/entity/provider/aws/AWS';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {AutocompleteFilterValidators} from '../../../../shared/validators/autocomplete-filter.validator';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../wizard-new/service/cluster';
import {NodeDataMode} from '../../../config';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Size = 'size',
  DiskSize = 'diskSize',
  DiskType = 'diskType',
  SubnetID = 'subnetId',
  AMI = 'ami',
}

@Component({
  selector: 'kubermatic-aws-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AWSBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AWSBasicNodeDataComponent), multi: true}
  ]
})
export class AWSBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  sizes: AWSSize[] = [];
  diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  subnets: AWSSubnet[] = [];
  hideOptional = false;

  readonly Controls = Controls;

  get subnetAZ(): string[] {
    return Object.keys(this._subnetMap);
  }

  private _subnetMap: {[type: string]: AWSSubnet[]} = {};

  private get _cloudSpec(): AWSCloudSpec {
    return this._clusterService.cluster.spec.cloud.aws;
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _nodeDataService: NodeDataService, private readonly _clusterService: ClusterService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control('', Validators.required),
      [Controls.DiskSize]: this._builder.control(25, Validators.required),
      [Controls.DiskType]: this._builder.control(this.diskTypes[0], Validators.required),
      [Controls.SubnetID]: this._builder.control('', Validators.required),
      [Controls.AMI]: this._builder.control(''),
    });

    this._setDefaultSubnet(this.subnets);

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

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  isInWizard(): boolean {
    return this._nodeDataService.mode === NodeDataMode.Wizard;
  }

  getLabel(control: Controls): string {
    switch (control) {
      case Controls.SubnetID:
        return 'Subnet ID & Availability Zone';
    }

    return '';
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.SubnetID:
        return !this._cloudSpec.secretAccessKey || !this._cloudSpec.accessKeyId ?
            'Please enter your credentials first' :
            '';
    }

    return '';
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private get _sizesObservable(): Observable<AWSSize[]> {
    return this._nodeDataService.aws.flavors();
  }

  private get _subnetIdsObservable(): Observable<AWSSubnet[]> {
    return this._nodeDataService.aws.subnets();
  }

  private _setDefaultSize(sizes: AWSSize[]): void {
    this.sizes = sizes.sort((a, b) => a.name.localeCompare(b.name));
    this.form.get(Controls.Size).setValidators([
      Validators.required, AutocompleteFilterValidators.mustBeInArrayList(this.sizes, 'name', true)
    ]);

    if (this.sizes.length > 0) {
      const cheapestInstance = this.sizes.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      this.form.get(Controls.Size).setValue(cheapestInstance.name);
    }
  }

  _clearSubnet(): void {
    this._enable(false, Controls.SubnetID);
    this.form.get(Controls.SubnetID).setValue('');
  }

  private _setDefaultSubnet(subnets: AWSSubnet[]): void {
    if (subnets.length === 0) {
      return;
    }

    this.subnets = subnets;
    this._subnetMap = {};
    const defaultSubnet = this.subnets.find(s => s.isDefaultSubnet);
    this.form.get(Controls.SubnetID).setValidators([
      Validators.required, AutocompleteFilterValidators.mustBeInObjectList(this._subnetMap, 'id', true)
    ]);
    this.form.get(Controls.SubnetID).setValue(defaultSubnet ? defaultSubnet.id : this.subnets[0].id);
    this._enable(true, Controls.SubnetID);
    this._initSubnetMap();
  }

  private _initSubnetMap(): void {
    this.subnets = this.subnets.sort((a, b) => a.name.localeCompare(b.name));
    this.subnets.forEach(subnet => {
      const found = this.subnetAZ.find(s => s === subnet.availability_zone);
      if (!found) {
        this._subnetMap[subnet.availability_zone] = [];
      }

      this._subnetMap[subnet.availability_zone].push(subnet);
    });
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          aws: {
            subnetID: this.form.get(Controls.SubnetID).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
