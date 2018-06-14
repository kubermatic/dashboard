import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-vsphere-cluster-settings',
  templateUrl: './vsphere.component.html',
  styleUrls: ['./vsphere.component.scss']
})
export class VSphereClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public vsphereSettingsForm: FormGroup;
  private vsphereSettingsFormSub: Subscription;

  constructor(private wizardService: WizardService) {
  }

  ngOnInit() {
    this.vsphereSettingsForm = new FormGroup({
      username: new FormControl(this.cluster.spec.cloud.vsphere.username, Validators.required),
      password: new FormControl(this.cluster.spec.cloud.vsphere.password, Validators.required),
    });

    this.vsphereSettingsFormSub = this.vsphereSettingsForm.valueChanges.debounceTime(1000).subscribe(data => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          vsphere: {
            username: this.vsphereSettingsForm.controls.username.value,
            password: this.vsphereSettingsForm.controls.password.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.vsphereSettingsForm.valid,
      });
    });
  }

  ngOnDestroy() {
    this.vsphereSettingsFormSub.unsubscribe();
  }
}
