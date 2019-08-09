import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material';

import {ClusterService} from '../../../core/services';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-configure-pod-security',
  templateUrl: './configure-pod-security.component.html',
})
export class ConfigurePodSecurityComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  confirmation = '';
  expectedConfirmation = 'i know what i am doing';

  constructor(
      private readonly _clusterService: ClusterService,
      private readonly _dialogRef: MatDialogRef<ConfigurePodSecurityComponent>) {}

  isPodSecurityPolicyActive(): boolean {
    return this.cluster.spec.usePodSecurityPolicyAdmissionPlugin;
  }

  inputConfirmationMatches(): boolean {
    return this.confirmation === this.expectedConfirmation;
  }

  onChange(event: any): void {
    this.confirmation = event.target.value;
  }

  activatePodSecurity(): void {
    if (!this.inputConfirmationMatches()) {
      return;
    } else {
      const clusterPatch: ClusterEntityPatch = {
        spec: {usePodSecurityPolicyAdmissionPlugin: true},
      };

      this._clusterService.patch(this.projectID, this.cluster.id, this.datacenter.metadata.name, clusterPatch)
          .subscribe(() => {
            NotificationActions.success(`PodSecurityPolicy for cluster ${this.cluster.name} is activated`);
          });
      this._dialogRef.close(true);
    }
  }

  deactivatePodSecurity(): void {
    const clusterPatch: ClusterEntityPatch = {spec: {usePodSecurityPolicyAdmissionPlugin: false}};
    this._clusterService.patch(this.projectID, this.cluster.id, this.datacenter.metadata.name, clusterPatch)
        .subscribe(() => {
          NotificationActions.success(`PodSecurityPolicy for cluster ${this.cluster.name} is deactivated`);
        });
    this._dialogRef.close(true);
  }
}
