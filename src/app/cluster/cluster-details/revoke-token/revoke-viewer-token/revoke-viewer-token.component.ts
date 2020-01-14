import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {ApiService} from '../../../../core/services';
import {NotificationActions} from '../../../../redux/actions/notification.actions';
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

  constructor(private api: ApiService, private dialogRef: MatDialogRef<RevokeViewerTokenComponent>) {}

  revokeViewerToken(): void {
    this.api.editViewerToken(this.cluster, this.datacenter.metadata.name, this.projectID, this.viewerToken)
        .subscribe((res) => {
          NotificationActions.success(`Successfully revoked Viewer Token for cluster ${this.cluster.name}`);
          this.dialogRef.close(res);
        });
  }
}
