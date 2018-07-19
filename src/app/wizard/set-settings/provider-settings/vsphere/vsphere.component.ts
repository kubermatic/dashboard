import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { Subscription } from 'rxjs/Subscription';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'kubermatic-vsphere-cluster-settings',
  templateUrl: './vsphere.component.html',
  styleUrls: ['./vsphere.component.scss']
})
export class VSphereClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public vsphereSettingsForm: FormGroup;
  public hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private wizardService: WizardService) {
  }

  ngOnInit() {
    this.vsphereSettingsForm = new FormGroup({
      username: new FormControl(this.cluster.spec.cloud.vsphere.username, Validators.required),
      password: new FormControl(this.cluster.spec.cloud.vsphere.password, Validators.required),
      vmNetName: new FormControl(this.cluster.spec.cloud.vsphere.vmNetName),
    });

    this.subscriptions.push(this.vsphereSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe(data => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          vsphere: {
            username: this.vsphereSettingsForm.controls.username.value,
            password: this.vsphereSettingsForm.controls.password.value,
            vmNetName: this.vsphereSettingsForm.controls.vmNetName.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.vsphereSettingsForm.valid,
      });
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe(data => {
      this.hideOptional = data.hideOptional;
    }));
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
