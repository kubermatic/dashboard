import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

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
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.awsProviderSettingsForm = new FormGroup({
      accessKeyId: new FormControl(this.cluster.spec.cloud.aws.accessKeyId, [Validators.required]),
      secretAccessKey: new FormControl(this.cluster.spec.cloud.aws.secretAccessKey, [Validators.required]),
    });

    this.awsProviderSettingsForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
