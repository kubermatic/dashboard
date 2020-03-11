import {Component, ElementRef, forwardRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {AWSSize, AWSSubnet} from '../../../../shared/entity/provider/aws/AWS';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {AutocompleteFilterValidators} from '../../../../shared/validators/autocomplete-filter.validator';
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
  hideOptional = false;
  filterBySizeInput = {name: ''};
  filterBySubnetInput = {id: ''};

  @ViewChild('sizeInput', {static: true}) private readonly sizeInputEl_: ElementRef;
  @ViewChild('subnetInput', {static: true}) private readonly subnetInputEl_: ElementRef;

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
      [Controls.Size]: this._builder.control('', Validators.required),
      [Controls.DiskSize]: this._builder.control(25, Validators.required),
      [Controls.DiskType]: this._builder.control(this.diskTypes[0], Validators.required),
      [Controls.SubnetID]: this._builder.control('', Validators.required),
      [Controls.AMI]: this._builder.control(''),
    });

    this._nodeDataService.nodeData = this._getNodeData();
    this._setDefaultValues();
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

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  isInWizard(): boolean {
    return this._nodeDataService.isInWizardMode();
  }

  onSizeOpen(opened: boolean): void {
    if (opened) {
      this.focusInput_(this.sizeInputEl_);
    } else {
      this.sizeInputEl_.nativeElement.value = '';
      this.filterBySizeInput.name = '';
    }
  }

  onSubnetOpen(opened: boolean): void {
    if (opened) {
      this.focusInput_(this.subnetInputEl_);
    } else {
      this.subnetInputEl_.nativeElement.value = '';
      this.filterBySubnetInput.id = '';
    }
  }

  private focusInput_(element: ElementRef): void {
    // Wrap in a timeout to make sure that element is rendered before looking for it.
    setTimeout(() => {
      element.nativeElement.focus();
    }, 150);
  }

  private get _sizesObservable(): Observable<AWSSize[]> {
    return this._nodeDataService.aws.flavors().pipe(catchError(() => of<AWSSize[]>()));
  }

  private get _subnetIdsObservable(): Observable<AWSSubnet[]> {
    return this._nodeDataService.aws.subnets().pipe(catchError(() => of<AWSSubnet[]>()));
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
    this._subnets = [];
    this._subnetMap = {};
    this.form.setValidators(Validators.required);
    this.form.get(Controls.SubnetID).setValue('');
  }

  private _setDefaultSubnet(subnets: AWSSubnet[]): void {
    if (subnets.length === 0) {
      return;
    }

    this._subnets = subnets;
    this._subnetMap = {};
    const defaultSubnet = this._subnets.find(s => s.isDefaultSubnet);
    this.form.get(Controls.SubnetID).setValidators([
      Validators.required, AutocompleteFilterValidators.mustBeInObjectList(this._subnetMap, 'id', true)
    ]);
    this.form.get(Controls.SubnetID).setValue(defaultSubnet ? defaultSubnet.id : this._subnets[0].id);
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

  _setDefaultValues(): void {
    if (this._nodeDataService.isInWizardMode()) {
      this._nodeDataService.nodeData.spec.cloud.aws.assignPublicIP = true;
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          aws: {
            subnetID: this.form.get(Controls.SubnetID).value,
            diskSize: this.form.get(Controls.DiskSize).value,
            ami: this.form.get(Controls.AMI).value,
            instanceType: this.form.get(Controls.Size).value,
            volumeType: this.form.get(Controls.DiskType).value,
            availabilityZone: this._getAZFromSubnet(this.form.get(Controls.SubnetID).value),
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
