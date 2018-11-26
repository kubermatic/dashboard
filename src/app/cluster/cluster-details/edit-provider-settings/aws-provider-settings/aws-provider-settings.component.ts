import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-aws-provider-settings',
  templateUrl: './aws-provider-settings.component.html',
})

export class AWSProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  awsProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.awsProviderSettingsForm = new FormGroup({
      accessKeyId: new FormControl(this.cluster.spec.cloud.aws.accessKeyId, [Validators.required]),
      secretAccessKey: new FormControl(this.cluster.spec.cloud.aws.secretAccessKey, [Validators.required]),
    });

    this.subscriptions.push(this.awsProviderSettingsForm.valueChanges.subscribe(() => {
      this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
    }));
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        aws: {
          accessKeyId: this.awsProviderSettingsForm.controls.accessKeyId.value,
          secretAccessKey: this.awsProviderSettingsForm.controls.secretAccessKey.value,
        },
      },
      isValid: this.awsProviderSettingsForm.valid,
    };
  }
}
