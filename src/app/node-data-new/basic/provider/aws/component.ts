import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {AWSSize, AWSSubnet} from '../../../../shared/entity/provider/aws/AWS';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';

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
  sizes: AWSSize[];
  diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  subnets: AWSSubnet[] = [];
  hideOptional = false;

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _presets: PresetsService) {
    super();
  }

  get subnetAZ(): string[] {
    return [];
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control('', Validators.required),
      [Controls.DiskSize]: this._builder.control(25, Validators.required),
      [Controls.DiskType]: this._builder.control(this.diskTypes[0], Validators.required),
      [Controls.SubnetID]: this._builder.control('', Validators.required),
      [Controls.AMI]: this._builder.control(''),
    });


    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));
    this._subnetIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSubnet.bind(this));

    this._presets.presetChanges
        .pipe(switchMap(_ => {
          this._enable(true, Controls.SubnetID);
          return this._subnetIdsObservable;
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._setDefaultSubnet.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getSubnetIDFormState(): string {
    return '';
  }

  getSubnetToAZ(az: string): AWSSubnet[] {
    return [];
  }

  getSubnetOptionName(subnet: AWSSubnet): string {
    return '';
  }

  addTag(): void {}

  deleteTag(formNr: number): void {}

  getTagForm(form: FormGroup): any {
    return undefined;
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  isInWizard(): boolean {
    return true;
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
    return of([] as AWSSize[]);
    // switch (this.mode) {
    //   case NodeDataMode.Wizard:
    //     return this._newWizard.datacenterChanges
    //         .pipe(switchMap(datacenterName => this._datacenter.getDataCenter(datacenterName)))
    //         .pipe(switchMap(dc => this._preset.provider(NodeProvider.AWS).region(dc.spec.aws.region).flavors()));
    //   case NodeDataMode.Dialog:
    //     return this._project.selectedProject.pipe(
    //         switchMap(project => this._api.getAWSSizes(project.id, this.seedDatacenterName, this.clusterID)));
    // }
  }

  private get _subnetIdsObservable(): Observable<AWSSubnet[]> {
    return of([] as AWSSubnet[]);
    // switch (this.mode) {
    //   case NodeDataMode.Wizard:
    //     return this._newWizard.clusterChanges.pipe(switchMap(
    //         cluster => this._preset.provider(NodeProvider.AWS)
    //                               .accessKeyID(cluster.spec.cloud.aws.accessKeyId)
    //                               .secretAccessKey(cluster.spec.cloud.aws.secretAccessKey)
    //                               .vpc(cluster.spec.cloud.aws.vpcId)
    //                               .credential(this._newWizard.preset)
    //                               .subnets(cluster.spec.cloud.dc)));
    //   case NodeDataMode.Dialog:
    //     return this._project.selectedProject.pipe(
    //         switchMap(project => this._api.getAWSSubnets(project.id, this.seedDatacenterName, this.clusterID)));
    // }
  }

  private _setDefaultSize(sizes: AWSSize[]): void {
    this.sizes = sizes;

    if (sizes.length > 0) {
      this.form.get(Controls.Size).setValue(sizes[0].name);
    }
  }

  private _setDefaultSubnet(subnets: AWSSubnet[]): void {
    this.subnets = subnets;

    if (subnets.length === 0) {
      this._enable(false, Controls.SubnetID);
    }
  }
}
