import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {NotificationsService} from 'angular2-notifications';

import {ApiService} from '../../../../core/services';
import {ClusterEntity, Token} from '../../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-revoke-viewer-token',
  templateUrl: './revoke-viewer-token.component.html',
})

export class RevokeViewerTokenComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  viewerToken: Token = {token: ''};

  constructor(
      private readonly _api: ApiService, private readonly _dialogRef: MatDialogRef<RevokeViewerTokenComponent>,
      private readonly _notificationService: NotificationsService) {}

  revokeViewerToken(): void {
    this._api.editViewerToken(this.cluster, this.datacenter.metadata.name, this.projectID, this.viewerToken)
        .subscribe((res) => {
          this._notificationService.success(`Successfully revoked Viewer Token for cluster ${this.cluster.name}`);
          this._dialogRef.close(res);
        });
  }
}
