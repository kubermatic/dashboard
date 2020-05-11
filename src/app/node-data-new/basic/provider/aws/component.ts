import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import {merge, Observable} from 'rxjs';
import {map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {FilteredComboboxComponent} from '../../../../shared/components/combobox/component';
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

enum SizeState {
  Ready = 'Node Size',
  Loading = 'Loading...',
  Empty = 'No Node Sizes Available',
}

enum SubnetState {
  Ready = 'Subnet ID & Availability Zone',
  Loading = 'Loading...',
  Empty = 'No Subnet IDs & Availability Zones Available',
}

@Component({
  selector: 'km-aws-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AWSBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AWSBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AWSBasicNodeDataComponent extends BaseFormValidator
  implements OnInit, AfterViewChecked, OnDestroy {
  private _diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  private _subnets: AWSSubnet[] = [];
  private _subnetMap: {[type: string]: AWSSubnet[]} = {};

  readonly Controls = Controls;

  sizes: AWSSize[] = [];
  selectedSize = '';
  sizeLabel = SizeState.Empty;
  selectedSubnet = '';
  subnetLabel = SubnetState.Empty;
  diskTypes = this._diskTypes.map(type => ({name: type}));
  selectedDiskType = '';

  @ViewChild('sizeCombobox')
  private readonly _sizeCombobox: FilteredComboboxComponent;
  @ViewChild('subnetCombobox')
  private readonly _subnetCombobox: FilteredComboboxComponent;

  get subnetAZ(): string[] {
    return Object.keys(this._subnetMap);
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control(''),
      [Controls.DiskSize]: this._builder.control(25, Validators.required),
      [Controls.DiskType]: this._builder.control('', Validators.required),
      [Controls.SubnetID]: this._builder.control(''),
      [Controls.AMI]: this._builder.control(''),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._sizesObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultSize.bind(this));
    this._subnetIdsObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultSubnet.bind(this));

    this._presets.presetChanges
      .pipe(tap(_ => this._clearSubnet()))
      .pipe(switchMap(_ => this._subnetIdsObservable))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultSubnet.bind(this));

    merge(
      this.form.get(Controls.AMI).valueChanges,
      this.form.get(Controls.DiskSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewChecked(): void {
    // If disk types will be loaded from the backend, this can be moved to ngOnInit
    this._setDefaultDiskType();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getSubnetToAZ(az: string): AWSSubnet[] {
    return this._subnetMap[az];
  }

  getSubnetOptionName(subnet: AWSSubnet): string {
    return subnet.name !== ''
      ? subnet.name + ' (' + subnet.id + ')'
      : subnet.id;
  }

  isInWizard(): boolean {
    return this._nodeDataService.isInWizardMode();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.aws.instanceType = size;
  }

  onSubnetChange(subnet: string): void {
    this._nodeDataService.nodeData.spec.cloud.aws.subnetID = subnet;
    this._nodeDataService.nodeData.spec.cloud.aws.availabilityZone = this._getAZFromSubnet(
      subnet
    );
  }

  onDiskTypeChange(diskType: string): void {
    this._nodeDataService.nodeData.spec.cloud.aws.volumeType = diskType;
  }

  private get _sizesObservable(): Observable<AWSSize[]> {
    return this._nodeDataService.aws
      .flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this))
      .pipe(map(sizes => sizes.sort((a, b) => a.name.localeCompare(b.name))));
  }

  private get _subnetIdsObservable(): Observable<AWSSubnet[]> {
    return this._nodeDataService.aws.subnets(
      this._clearSubnet.bind(this),
      this._onSubnetLoading.bind(this)
    );
  }

  private _setDefaultDiskType(): void {
    this.selectedDiskType = this._diskTypes[0];
    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: AWSSize[]): void {
    this.sizes = sizes;
    if (this.sizes.length > 0) {
      const cheapestInstance = this.sizes.reduce((prev, curr) =>
        prev.price < curr.price ? prev : curr
      );
      this.selectedSize = cheapestInstance.name;
      this.sizeLabel = SizeState.Ready;
      this._cdr.detectChanges();
    }
  }

  private _setDefaultSubnet(subnets: AWSSubnet[]): void {
    if (subnets.length === 0) {
      return;
    }

    this._subnets = subnets;
    this._subnetMap = {};
    const defaultSubnet = this._subnets.find(s => s.isDefaultSubnet);
    this.selectedSubnet = defaultSubnet
      ? defaultSubnet.id
      : this._subnets[0].id;
    this.subnetLabel = this._subnets.length
      ? SubnetState.Ready
      : SubnetState.Empty;
    this._cdr.detectChanges();
    this._initSubnetMap();
  }

  private _clearSize(): void {
    this.sizes = [];
    this.selectedSize = '';
    this.sizeLabel = SizeState.Empty;
    this._sizeCombobox.reset();
    this._cdr.detectChanges();
  }

  private _clearSubnet(): void {
    this._subnets = [];
    this._subnetMap = {};
    this.subnetLabel = SubnetState.Empty;
    this.selectedSubnet = '';
    this._subnetCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onSizeLoading(): void {
    this._clearSize();
    this.sizeLabel = SizeState.Loading;
    this._cdr.detectChanges();
  }

  private _onSubnetLoading(): void {
    this._clearSubnet();
    this.subnetLabel = SubnetState.Loading;
    this._cdr.detectChanges();
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
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
