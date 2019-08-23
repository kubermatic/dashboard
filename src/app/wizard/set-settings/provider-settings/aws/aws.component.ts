import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-aws-cluster-settings',
  templateUrl: './aws.component.html',
})
export class AWSClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  awsSettingsForm: FormGroup;
  hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    this.awsSettingsForm = new FormGroup({
      accessKeyId: new FormControl(this.cluster.spec.cloud.aws.accessKeyId, Validators.required),
      secretAccessKey: new FormControl(this.cluster.spec.cloud.aws.secretAccessKey, Validators.required),
      securityGroup:
          new FormControl(this.cluster.spec.cloud.aws.securityGroup, Validators.pattern('sg-(\\w{8}|\\w{17})')),
      vpcId: new FormControl(this.cluster.spec.cloud.aws.vpcId, Validators.pattern('vpc-(\\w{8}|\\w{17})')),
      subnetId: new FormControl(this.cluster.spec.cloud.aws.subnetId, Validators.pattern('subnet-(\\w{8}|\\w{17})')),
      routeTableId:
          new FormControl(this.cluster.spec.cloud.aws.routeTableId, Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      instanceProfileName: new FormControl(this.cluster.spec.cloud.aws.instanceProfileName),
      roleName: new FormControl(this.cluster.spec.cloud.aws.roleName),
    });

    this.subscriptions.push(
        this.awsSettingsForm.controls.instanceProfileName.valueChanges.pipe(debounceTime(1000)).subscribe(() => {
          if (this.awsSettingsForm.controls.instanceProfileName.value !== '') {
            this.awsSettingsForm.controls.roleName.setValidators(Validators.required);
          } else {
            this.awsSettingsForm.controls.roleName.setValidators(null);
          }
          this.awsSettingsForm.controls.roleName.updateValueAndValidity();
        }));

    this.subscriptions.push(this.awsSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe((data) => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          aws: {
            accessKeyId: this.awsSettingsForm.controls.accessKeyId.value,
            secretAccessKey: this.awsSettingsForm.controls.secretAccessKey.value,
            securityGroup: this.awsSettingsForm.controls.securityGroup.value,
            vpcId: this.awsSettingsForm.controls.vpcId.value,
            subnetId: this.awsSettingsForm.controls.subnetId.value,
            routeTableId: this.awsSettingsForm.controls.routeTableId.value,
            instanceProfileName: this.awsSettingsForm.controls.instanceProfileName.value,
            roleName: this.awsSettingsForm.controls.roleName.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.awsSettingsForm.valid,
      });
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe((data) => {
      this.hideOptional = data.hideOptional;
    }));
  }

  getRolePlaceholder(): string {
    return this.awsSettingsForm.controls.instanceProfileName.value !== '' ? 'Role Name*' : 'Role Name';
  }

  getRoleHint(): string {
    return this.awsSettingsForm.controls.instanceProfileName.value !== '' ?
        'Instance Profile is specified. Please set a Role Name.' :
        '';
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
