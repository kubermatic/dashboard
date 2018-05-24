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
  selector: 'kubermatic-hetzner-provider-settings',
  templateUrl: './hetzner-provider-settings.component.html',
  styleUrls: ['./hetzner-provider-settings.component.scss']
})

export class HetznerProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public hetznerProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.hetznerProviderSettingsForm = new FormGroup({
      token: new FormControl('', [Validators.minLength(64), Validators.maxLength(64)]),
    });

    this.subscriptions.push(this.hetznerProviderSettingsForm.valueChanges.subscribe(data => {
      if (this.hetznerProviderSettingsForm.valid) {
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
      hetzner: {
        token: this.hetznerProviderSettingsForm.controls.token.value,
      }
    };
  }
}
