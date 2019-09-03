import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
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

  constructor(private readonly _builder: FormBuilder) {
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
  }

  hasError(control: Controls, errorName: string): boolean {
    return this.control(control).hasError(errorName);
  }

  ngOnDestroy(): void {}
}
