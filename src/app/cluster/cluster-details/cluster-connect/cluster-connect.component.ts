import { Component, Input } from '@angular/core';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService } from '../../../core/services';

@Component({
  selector: 'kubermatic-cluster-connect',
  templateUrl: './cluster-connect.component.html',
  styleUrls: ['./cluster-connect.component.scss']
})
export class ClusterConnectComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  constructor(private api: ApiService) {}

  public getDownloadURL(): string {
    return this.api.getKubeconfigURL(this.datacenter.metadata.name, this.cluster.metadata.name);
  }

  copy(type: string): string {
    if (type === 'exportKubeconfig') {
      return 'export KUBECONFIG=$PWD/kubeconfig-' + this.cluster.metadata.name;
    } else if (type === 'kubectlProxy') {
      return 'kubectl proxy';
    }
  }
}
