import { Component, Input } from '@angular/core';
import { ApiService } from '../../../core/services';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-share-kubeconfig',
  templateUrl: './share-kubeconfig.component.html',
  styleUrls: ['./share-kubeconfig.component.scss'],
})

export class ShareKubeconfigComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  constructor(private api: ApiService) {}

  shareKubeconfig(): string {
    return this.api.getShareKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id);
  }
}
