import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-digitalocean-cluster-settings',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public digitaloceanSettingsForm: FormGroup;
  private digitaloceanSettingsFormSub: Subscription;

  constructor(private wizardService: WizardService) { }

  ngOnInit() {
    this.digitaloceanSettingsForm = new FormGroup({
      token: new FormControl(this.cluster.spec.cloud.digitalocean.token, [Validators.required, Validators.minLength(64), Validators.maxLength(64)]),
    });

    this.digitaloceanSettingsFormSub = this.digitaloceanSettingsForm.valueChanges.subscribe(data => {
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

  ngOnDestroy() {
    this.digitaloceanSettingsFormSub.unsubscribe();
  }
}
