import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observable, ObservableInput } from 'rxjs/Observable';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService } from '../../../../core/services';
import { ClusterService } from '../../../../core/services/cluster/cluster.service';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { ClusterProviderSettingsData } from '../../../../shared/model/ClusterSpecChange';

@Component({
  selector: 'kubermatic-vsphere-provider-settings',
  templateUrl: './vsphere-provider-settings.component.html',
  styleUrls: ['./vsphere-provider-settings.component.scss']
})

export class VSphereProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public vsphereProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.vsphereProviderSettingsForm = new FormGroup({
      username: new FormControl(this.cluster.spec.cloud.vsphere.username, Validators.required),
      password: new FormControl(this.cluster.spec.cloud.vsphere.password, Validators.required),
    });

    this.subscriptions.push(this.vsphereProviderSettingsForm.valueChanges.subscribe(data => {
      if (this.vsphereProviderSettingsForm.valid) {
        this.clusterService.changeProviderSettingsData(this.getProviderSettingsData());
      }
    }));
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getProviderSettingsData(): ClusterProviderSettingsData {
    return {
      vsphere: {
        password: this.vsphereProviderSettingsForm.controls.password.value,
        username: this.vsphereProviderSettingsForm.controls.username.value,
      }
    };
  }
}
