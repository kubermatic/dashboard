import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-aws-cluster-settings',
  templateUrl: './aws.component.html',
  styleUrls: ['./aws.component.scss']
})
export class AWSClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public awsSettingsForm: FormGroup;
  private awsSettingsFormSub: Subscription;

  constructor(private wizardService: WizardService) { }

  ngOnInit() {
    this.awsSettingsForm = new FormGroup({
      accessKeyId: new FormControl(this.cluster.spec.cloud.aws.accessKeyId, Validators.required),
      secretAccessKey: new FormControl(this.cluster.spec.cloud.aws.secretAccessKey, Validators.required),
      securityGroup: new FormControl(this.cluster.spec.cloud.aws.securityGroup, Validators.pattern('sg-(\\w{8}|\\w{17})')),
      vpcId: new FormControl(this.cluster.spec.cloud.aws.vpcId, Validators.pattern('vpc-(\\w{8}|\\w{17})')),
      subnetId: new FormControl(this.cluster.spec.cloud.aws.subnetId, Validators.pattern('subnet-(\\w{8}|\\w{17})')),
      routeTableId: new FormControl(this.cluster.spec.cloud.aws.routeTableId, Validators.pattern('rtb-(\\w{8}|\\w{17})')),
    });

    this.awsSettingsFormSub = this.awsSettingsForm.valueChanges.subscribe(data => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          aws: {
            accessKeyId: this.awsSettingsForm.controls.accessKeyId.value,
            secretAccessKey: this.awsSettingsForm.controls.secretAccessKey.value,
            securityGroup: this.awsSettingsForm.controls.securityGroup.value,
            vpcId: this.awsSettingsForm.controls.vpcId.value,
            subnetId: this.awsSettingsForm.controls.subnetId.value,
            routeTableId: this.awsSettingsForm.controls.routeTableId.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.awsSettingsForm.valid,
      });
    });
  }

  ngOnDestroy() {
    this.awsSettingsFormSub.unsubscribe();
  }
}
