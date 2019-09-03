import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {EMPTY, merge, Observable, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, debounceTime, map, switchMap, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../../core/services';
import {AWSVPC} from '../../../../../shared/entity/provider/aws/AWS';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';
import {StepBase} from '../../../base';

enum Controls {
  AccessKeyID = 'accessKeyId',
  SecretAccessKey = 'secretAccessKey',
  VPCID = 'vpcId',
  SecurityGroup = 'securityGroup',
  RouteTableID = 'routeTableId',
  InstanceProfileName = 'instanceProfileName',
  RoleARN = 'roleARN',
}

@Component({
  selector: 'kubermatic-wizard-aws-provider',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AWSProviderComponent extends StepBase implements OnInit, OnDestroy {
  hideOptional = false;
  vpcIds: AWSVPC[] = [];

  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _builder: FormBuilder, private readonly _presets: PresetsService) {
    super(Controls);
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AccessKeyID]: new FormControl('', Validators.required),
      [Controls.SecretAccessKey]: new FormControl('', Validators.required),
      [Controls.VPCID]: new FormControl('', Validators.pattern('vpc-(\\w{8}|\\w{17})')),
      [Controls.SecurityGroup]: new FormControl('', Validators.pattern('sg-(\\w{8}|\\w{17})')),
      [Controls.RouteTableID]: new FormControl('', Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      [Controls.InstanceProfileName]: new FormControl(''),
      [Controls.RoleARN]: new FormControl(''),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._wizard.enablePresets(this.areControlsEmpty()));

    this._wizard.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this.enable(!preset, control)));

    merge(this.control(Controls.AccessKeyID).valueChanges, this.control(Controls.SecretAccessKey).valueChanges)
        .pipe(debounceTime(this._debounceTime))
        .pipe(switchMap(value => {
          this._clearVPC();
          return this._vpcListObservable();
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((vpcs: AWSVPC[]) => {
          this.vpcIds = vpcs;
          const defaultVPC = vpcs.find(vpc => vpc.isDefault);
          this.control(Controls.VPCID).setValue(defaultVPC ? defaultVPC.vpcId : undefined);
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _vpcListObservable(): Observable<AWSVPC[]> {
    return this._presets.provider(NodeProvider.AWS)
        .accessKeyID(this.form.controls.accessKeyId.value)
        .secretAccessKey(this.form.controls.secretAccessKey.value)
        .vpcs(this._wizard.datacenter)
        .pipe(map(vpcs => vpcs.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }

  private _clearVPC(): void {
    this.vpcIds = [];
    this.control(Controls.VPCID).setValue(undefined);
  }
}
