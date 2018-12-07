import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-digitalocean-cluster-settings',
  templateUrl: './digitalocean.component.html',
})
export class DigitaloceanClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  digitaloceanSettingsForm: FormGroup;
  private digitaloceanSettingsFormSub: Subscription;

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    this.digitaloceanSettingsForm = new FormGroup({
      token: new FormControl(
          this.cluster.spec.cloud.digitalocean.token,
          [Validators.required, Validators.minLength(64), Validators.maxLength(64)]),
    });

    this.digitaloceanSettingsFormSub =
        this.digitaloceanSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe((data) => {
          this.wizardService.changeClusterProviderSettings({
            cloudSpec: {
              digitalocean: {
                token: this.digitaloceanSettingsForm.controls.token.value,
              },
              dc: this.cluster.spec.cloud.dc,
            },
            valid: this.digitaloceanSettingsForm.valid,
          });
        });
  }

  ngOnDestroy(): void {
    this.digitaloceanSettingsFormSub.unsubscribe();
  }
}
