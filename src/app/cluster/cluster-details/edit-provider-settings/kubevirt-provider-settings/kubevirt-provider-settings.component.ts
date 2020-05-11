import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'km-kubevirt-provider-settings',
  templateUrl: './kubevirt-provider-settings.component.html',
})
export class KubevirtProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private _formData = {kubeconfig: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      kubeconfig: new FormControl(''),
    });

    this.form.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (data.kubeconfig !== this._formData.kubeconfig) {
          this._formData = data;
          this.setValidators();
          this.clusterService.changeProviderSettingsPatch(
            this.getProviderSettingsPatch()
          );
        }
      });
  }

  get kubeconfig(): AbstractControl {
    return this.form.controls.kubeconfig;
  }

  setValidators(): void {
    if (!this.kubeconfig.value) {
      this.kubeconfig.clearValidators();
    } else {
      this.kubeconfig.setValidators([Validators.required]);
    }

    this.kubeconfig.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.kubeconfig.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        kubevirt: {
          kubeconfig: this.form.controls.kubeconfig.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
