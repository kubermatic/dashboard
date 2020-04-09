import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'km-hetzner-provider-settings',
  templateUrl: './hetzner-provider-settings.component.html',
})

export class HetznerProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private _formData = {token: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      token: new FormControl(''),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.token !== this._formData.token) {
        this._formData = data;
        this.setValidators();
        this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
      }
    });
  }

  get token(): AbstractControl {
    return this.form.controls.token;
  }

  setValidators(): void {
    if (!this.token.value) {
      this.token.clearValidators();
    } else {
      this.token.setValidators([Validators.required, Validators.minLength(64), Validators.maxLength(64)]);
    }

    this.token.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.token.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        hetzner: {
          token: this.form.controls.token.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
