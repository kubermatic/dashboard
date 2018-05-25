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
  selector: 'kubermatic-digitalocean-provider-settings',
  templateUrl: './digitalocean-provider-settings.component.html',
  styleUrls: ['./digitalocean-provider-settings.component.scss']
})

export class DigitaloceanProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public digitaloceanProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.digitaloceanProviderSettingsForm = new FormGroup({
      token: new FormControl('', [Validators.required, Validators.minLength(64), Validators.maxLength(64)]),
    });

    this.subscriptions.push(this.digitaloceanProviderSettingsForm.valueChanges.subscribe(data => {
      if (this.digitaloceanProviderSettingsForm.valid) {
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
      digitalocean: {
        token: this.digitaloceanProviderSettingsForm.controls.token.value,
      },
      valid: true
    };
  }
}
