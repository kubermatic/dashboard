import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observable, ObservableInput } from 'rxjs/Observable';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService } from '../../../../core/services';
import { ClusterService } from '../../../../core/services/cluster/cluster.service';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { ClusterProviderSettingsData } from '../../../../shared/model/ClusterSpecChange';

@Component({
  selector: 'kubermatic-aws-provider-settings',
  templateUrl: './aws-provider-settings.component.html',
  styleUrls: ['./aws-provider-settings.component.scss']
})

export class AWSProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public awsProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];


  constructor(private api: ApiService, private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.awsProviderSettingsForm = new FormGroup({
      accessKeyId: new FormControl(this.cluster.spec.cloud.aws.accessKeyId, [Validators.required]),
      secretAccessKey: new FormControl(this.cluster.spec.cloud.aws.secretAccessKey, [Validators.required]),
    });

    this.subscriptions.push(this.awsProviderSettingsForm.valueChanges.subscribe(data => {
      if (this.awsProviderSettingsForm.valid) {
        this.clusterService.changeProviderSettingsData(this.getProviderSettingsData());
      }
    }));
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getProviderSettingsData(): ClusterProviderSettingsData {
    return {
      aws: {
        accessKeyId: this.awsProviderSettingsForm.controls.accessKeyId.value,
        secretAccessKey: this.awsProviderSettingsForm.controls.secretAccessKey.value,
        vpcId: this.cluster.spec.cloud.aws.vpcId,
        subnetId: this.cluster.spec.cloud.aws.subnetId,
        routeTableId: this.cluster.spec.cloud.aws.routeTableId,
        securityGroup: this.cluster.spec.cloud.aws.securityGroup,
      },
      valid: true
    };
  }

}
