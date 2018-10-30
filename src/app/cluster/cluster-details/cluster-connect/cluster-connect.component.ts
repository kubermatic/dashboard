import { Component, Input } from '@angular/core';
import { ApiService } from '../../../core/services';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-cluster-connect',
  templateUrl: './cluster-connect.component.html',
  styleUrls: ['./cluster-connect.component.scss']
})

export class ClusterConnectComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  constructor(private api: ApiService) {}

  public getDownloadURL(): string {
    return this.api.getKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id);
  }

  copy(type: string): string {
    if (type === 'exportKubeconfig') {
      return 'export KUBECONFIG=$PWD/kubeconfig-' + this.cluster.id;
    } else if (type === 'kubectlProxy') {
      return 'kubectl proxy';
    }
  }
}
