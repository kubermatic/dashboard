import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../../core/services/wizard/wizard.service';
import {ClusterEntity} from '../../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';

@Component({
  selector: 'kubermatic-gcp-provider-options',
  templateUrl: './gcp-provider-options.component.html',
})
export class GCPProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;

  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      network: new FormControl(this.cluster.spec.cloud.gcp.network),
      subnetwork: new FormControl(this.cluster.spec.cloud.gcp.subnetwork),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm());
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _clusterProviderSettingsForm(): ClusterProviderSettingsForm {
    const isValid: boolean = this.cluster.spec.cloud.gcp.serviceAccount !== '';

    return {
      cloudSpec: {
        gcp: {
          serviceAccount: this.cluster.spec.cloud.gcp.serviceAccount,
          network: this.form.controls.network.value,
          subnetwork: this.form.controls.subnetwork.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid: isValid,
    };
  }
}
