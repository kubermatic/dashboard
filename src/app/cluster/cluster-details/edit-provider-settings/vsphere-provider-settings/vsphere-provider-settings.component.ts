import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-vsphere-provider-settings',
  templateUrl: './vsphere-provider-settings.component.html',
})

export class VSphereProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  vsphereProviderSettingsForm: FormGroup;

  private _unsubscribe = new Subject<void>();

  private get _infraManagementUsername(): string {
    return this.cluster.spec.cloud.vsphere.infraManagementUser ?
        this.cluster.spec.cloud.vsphere.infraManagementUser.username :
        '';
  }

  private get _infraManagementPassword(): string {
    return this.cluster.spec.cloud.vsphere.infraManagementUser ?
        this.cluster.spec.cloud.vsphere.infraManagementUser.password :
        '';
  }

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.vsphereProviderSettingsForm = new FormGroup({
      infraManagementUsername: new FormControl(this._infraManagementUsername, Validators.required),
      infraManagementPassword: new FormControl(this._infraManagementPassword, Validators.required),
      username: new FormControl(this.cluster.spec.cloud.vsphere.username),
      password: new FormControl(this.cluster.spec.cloud.vsphere.password),
      vmNetName: new FormControl(this.cluster.spec.cloud.vsphere.vmNetName),
    });

    this.vsphereProviderSettingsForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
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
        vsphere: {
          password: this.vsphereProviderSettingsForm.controls.password.value,
          username: this.vsphereProviderSettingsForm.controls.username.value,
          infraManagementUser: {
            username: this.vsphereProviderSettingsForm.controls.infraManagementUsername.value,
            password: this.vsphereProviderSettingsForm.controls.infraManagementPassword.value,
          },
        },
      },
      isValid: this.vsphereProviderSettingsForm.valid,
    };
  }
}
