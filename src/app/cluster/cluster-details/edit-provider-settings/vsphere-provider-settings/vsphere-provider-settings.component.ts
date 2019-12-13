import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'kubermatic-vsphere-provider-settings',
  templateUrl: './vsphere-provider-settings.component.html',
})

export class VSphereProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;

  private _formData = {infraManagementUsername: '', infraManagementPassword: '', username: '', password: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      infraManagementUsername: new FormControl(''),
      infraManagementPassword: new FormControl(''),
      username: new FormControl(''),
      password: new FormControl(''),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.infraManagementUsername !== this._formData.infraManagementUsername ||
          data.infraManagementPassword !== this._formData.infraManagementPassword ||
          data.username !== this._formData.username || data.password !== this._formData.password) {
        this._formData = data;
        this.setValidators();
        this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
      }
    });
  }

  get infraManagementUsername(): AbstractControl {
    return this.form.controls.infraManagementUsername;
  }

  get infraManagementPassword(): AbstractControl {
    return this.form.controls.infraManagementPassword;
  }

  setValidators(): void {
    if (!this.infraManagementUsername.value && !this.infraManagementPassword.value) {
      this.infraManagementUsername.clearValidators();
      this.infraManagementPassword.clearValidators();
    } else {
      this.infraManagementUsername.setValidators([Validators.required]);
      this.infraManagementPassword.setValidators([Validators.required]);
    }

    this.infraManagementUsername.updateValueAndValidity();
    this.infraManagementPassword.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.infraManagementUsername.value && !this.infraManagementPassword.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        vsphere: {
          password: this.form.controls.password.value,
          username: this.form.controls.username.value,
          infraManagementUser: {
            username: this.form.controls.infraManagementUsername.value,
            password: this.form.controls.infraManagementPassword.value,
          },
        },
      },
      isValid: this.form.valid,
    };
  }
}
