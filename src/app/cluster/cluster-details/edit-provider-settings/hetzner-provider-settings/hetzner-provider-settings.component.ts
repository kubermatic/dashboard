import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-hetzner-provider-settings',
  templateUrl: './hetzner-provider-settings.component.html',
})

export class HetznerProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  hetznerProviderSettingsForm: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.hetznerProviderSettingsForm = new FormGroup({
      token: new FormControl(
          this.cluster.spec.cloud.hetzner.token,
          [Validators.required, Validators.minLength(64), Validators.maxLength(64)]),
    });

    this.hetznerProviderSettingsForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
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
        hetzner: {
          token: this.hetznerProviderSettingsForm.controls.token.value,
        },
      },
      isValid: this.hetznerProviderSettingsForm.valid,
    };
  }
}
