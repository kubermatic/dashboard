import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'km-gcp-provider-settings',
  templateUrl: './gcp-provider-settings.component.html',
})

export class GCPProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private _formData = {serviceAccount: ''};
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      serviceAccount: new FormControl(''),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.serviceAccount !== this._formData.serviceAccount) {
        this._formData = data;
        this.setValidators();
        this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
      }
    });
  }

  get serviceAccount(): AbstractControl {
    return this.form.controls.serviceAccount;
  }

  setValidators(): void {
    if (!this.serviceAccount.value) {
      this.serviceAccount.clearValidators();
    } else {
      this.serviceAccount.setValidators([Validators.required]);
    }

    this.serviceAccount.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.serviceAccount.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        gcp: {
          serviceAccount: this.form.controls.serviceAccount.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
