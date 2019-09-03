import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {ApiService, DatacenterService, NewWizardService, ProjectService, WizardService} from '../../../core/services';
import {AWSSize, AWSSubnet} from '../../../shared/entity/provider/aws/AWS';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {NodeDataProviderBase} from '../base';

enum Controls {
  Size = 'size',
  DiskSize = 'diskSize',
  DiskType = 'diskType',
  AMI = 'ami',
  Tags = 'tags',
  SubnetID = 'subnetId',
}

export enum NodeDataProviderMode {
  Wizard = 'wizard',
  Dialog = 'dialog',
}

@Component({
  selector: 'kubermatic-aws-node-data',
  templateUrl: './template.html',
})

export class AWSNodeDataComponent extends NodeDataProviderBase implements OnInit, OnDestroy {
  @Input() mode = NodeDataProviderMode.Wizard;
  @Input() seedDatacenterName: string;
  @Input() clusterID: string;

  sizes: AWSSize[];
  diskTypes: string[] = ['standard', 'gp2', 'io1', 'sc1', 'st1'];
  subnets: AWSSubnet[] = [];
  hideOptional = false;

  readonly Controls = Controls;

  private readonly _unsubscribe = new Subject<void>();

  constructor(
      private readonly _builder: FormBuilder, private readonly _newWizard: NewWizardService,
      private readonly _wizard: WizardService, private readonly _api: ApiService,
      private readonly _project: ProjectService, private readonly _datacenter: DatacenterService) {
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
      [Controls.AMI]: this._builder.control(''),
      [Controls.Tags]: this._builder.control(''),
      [Controls.SubnetID]: this._builder.control('', Validators.required),
    });

    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));

    this._newWizard.presetChanges
        .pipe(switchMap(_ => {
          this.enable(true, Controls.SubnetID);
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

  private get _sizesObservable(): Observable<AWSSize[]> {
    switch (this.mode) {
      case NodeDataProviderMode.Wizard:
        return this._newWizard.datacenterChanges
            .pipe(switchMap(datacenterName => this._datacenter.getDataCenter(datacenterName)))
            .pipe(switchMap(dc => this._wizard.provider(NodeProvider.AWS).region(dc.spec.aws.region).flavors()));
      case NodeDataProviderMode.Dialog:
        return this._project.selectedProject.pipe(
            switchMap(project => this._api.getAWSSizes(project.id, this.seedDatacenterName, this.clusterID)));
    }
  }

  private get _subnetIdsObservable(): Observable<AWSSubnet[]> {
    switch (this.mode) {
      case NodeDataProviderMode.Wizard:
        return this._newWizard.datacenterChanges.pipe(switchMap(
            datacenterName => this._wizard.provider(NodeProvider.AWS)
                                  .accessKeyID(this.controlValue('accessKeyId'))
                                  .secretAccessKey(this.controlValue('secretAccessKey'))
                                  .vpc(this.controlValue('vpcId'))
                                  .credential(this._newWizard.preset)
                                  .subnets(datacenterName)));
      case NodeDataProviderMode.Dialog:
        return this._project.selectedProject.pipe(
            switchMap(project => this._api.getAWSSubnets(project.id, this.seedDatacenterName, this.clusterID)));
    }
  }

  private _setDefaultSize(sizes: AWSSize[]): void {
    this.sizes = sizes;

    if (sizes.length > 0) {
      this.control(Controls.Size).setValue(sizes[0].name);
    }
  }

  private _setDefaultSubnet(subnets: AWSSubnet[]): void {
    this.subnets = subnets;

    if (subnets.length === 0) {
      this.enable(false, Controls.SubnetID);
    }
  }
}
