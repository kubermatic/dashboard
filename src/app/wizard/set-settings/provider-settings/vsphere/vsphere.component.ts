import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { VSphereNetwork } from '../../../../shared/entity/provider/vsphere/VSphereEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardService, ApiService } from '../../../../core/services';
import { Subscription } from 'rxjs';
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
  public loadingNetworks = false;
  public networks: VSphereNetwork[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private wizardService: WizardService, private api: ApiService) { }

  ngOnInit() {
    this.vsphereSettingsForm = new FormGroup({
      username: new FormControl(this.cluster.spec.cloud.vsphere.username, Validators.required),
      password: new FormControl(this.cluster.spec.cloud.vsphere.password, Validators.required),
      vmNetName: new FormControl(this.cluster.spec.cloud.vsphere.vmNetName),
    });

    this.subscriptions.push(this.vsphereSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe(data => {
      this.loadNetworks();

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

  public loadNetworks() {
    if (
      this.vsphereSettingsForm.controls.username.value === '' ||
      this.vsphereSettingsForm.controls.password.value === '' ||
      this.networks.length > 0) {
        return;
    }

    this.loadingNetworks = true;
    this.subscriptions.push(this.api.getVSphereNetworks(this.vsphereSettingsForm.controls.username.value, this.vsphereSettingsForm.controls.password.value, this.cluster.spec.cloud.dc).subscribe(networks => {
        if (networks.length > 0) {
          const sortedNetworks = networks.sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          this.networks = sortedNetworks;
          if (sortedNetworks.length > 0 && this.vsphereSettingsForm.controls.vmNetName.value !== '0') {
            this.vsphereSettingsForm.controls.vmNetName.setValue(this.cluster.spec.cloud.vsphere.vmNetName);
          }
        } else {
          this.networks = [];
        }
    }));
  }

}
