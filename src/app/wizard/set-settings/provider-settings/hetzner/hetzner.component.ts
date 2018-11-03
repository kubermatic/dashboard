import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-hetzner-cluster-settings',
  templateUrl: './hetzner.component.html',
  styleUrls: ['./hetzner.component.scss'],
})
export class HetznerClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public hetznerSettingsForm: FormGroup;
  private hetznerSettingsFormSub: Subscription;

  constructor(private wizardService: WizardService) { }

  ngOnInit(): void {
    this.hetznerSettingsForm = new FormGroup({
      token: new FormControl(this.cluster.spec.cloud.hetzner.token, [Validators.required, Validators.minLength(64), Validators.maxLength(64)]),
    });

    this.hetznerSettingsFormSub = this.hetznerSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe((data) => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          hetzner: {
            token: this.hetznerSettingsForm.controls.token.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.hetznerSettingsForm.valid,
      });
    });
  }

  ngOnDestroy(): void {
    this.hetznerSettingsFormSub.unsubscribe();
  }
}
