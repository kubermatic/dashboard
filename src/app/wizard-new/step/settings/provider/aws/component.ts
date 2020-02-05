import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {EMPTY, merge, Observable, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, debounceTime, map, switchMap, takeUntil} from 'rxjs/operators';

import {NewWizardService, PresetsService} from '../../../../../core/services';
import {AWSVPC} from '../../../../../shared/entity/provider/aws/AWS';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';

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
export class AWSProviderComponent implements OnInit, OnDestroy {
  form: FormGroup;
  hideOptional = false;
  vpcIds: AWSVPC[] = [];

  readonly controls = Controls;

  private readonly _unsubscribe = new Subject<void>();
  protected readonly _debounceTime = 250;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _wizard: NewWizardService) {}

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
        .subscribe(
            _ => this._wizard.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value)));

    this._wizard.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    merge(this.form.get(Controls.AccessKeyID).valueChanges, this.form.get(Controls.SecretAccessKey).valueChanges)
        .pipe(debounceTime(this._debounceTime))
        .pipe(switchMap(value => {
          this._clearVPC();
          return this._vpcListObservable();
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((vpcs: AWSVPC[]) => {
          this.vpcIds = vpcs;
          const defaultVPC = vpcs.find(vpc => vpc.isDefault);
          this.form.get(Controls.VPCID).setValue(defaultVPC ? defaultVPC.vpcId : undefined);
        });
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
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
    this.form.get(Controls.VPCID).setValue(undefined);
  }
}
