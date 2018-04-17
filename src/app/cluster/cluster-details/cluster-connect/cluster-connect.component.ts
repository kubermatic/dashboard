import { Component, Input, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-connect',
  templateUrl: './cluster-connect.component.html',
  styleUrls: ['./cluster-connect.component.scss']
})
export class ClusterConnectComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  constructor() {
  }

  ngOnInit() {
  }

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem('token');
    return `${environment.restRootV3}/dc/${this.datacenter.metadata.name}/cluster/${this.cluster.metadata.name}/kubeconfig?token=${authorization_token}`;
  }

  copy(type: string): string {
    if (type === 'exportKubeconfig') {
      return 'export KUBECONFIG=$PWD/kubeconfig-' + this.cluster.metadata.name;
    } else if (type === 'kubectlProxy') {
      return 'kubectl proxy';
    }
  }
}
