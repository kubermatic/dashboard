import { Component, Input } from '@angular/core';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService } from '../../../core/services';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-cluster-connect',
  templateUrl: './cluster-connect.component.html',
  styleUrls: ['./cluster-connect.component.scss']
})

export class ClusterConnectComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() project: ProjectEntity;

  constructor(private api: ApiService) {}

  public getDownloadURL(): string {
    //     return this.api.getKubeconfigURL(this.project.id, this.datacenter.metadata.name, this.cluster.id);
    return this.api.getKubeconfigURL(this.project.id, this.datacenter.metadata.name, this.cluster.id);
  }

  copy(type: string): string {
    if (type === 'exportKubeconfig') {
      return 'export KUBECONFIG=$PWD/kubeconfig-' + this.cluster.name;
    } else if (type === 'kubectlProxy') {
      return 'kubectl proxy';
    }
  }
}
