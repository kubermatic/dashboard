import { Component, Input, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService } from '../../../core/services';

@Component({
  selector: 'kubermatic-cluster-connect',
  templateUrl: './cluster-connect.component.html',
  styleUrls: ['./cluster-connect.component.scss']
})
export class ClusterConnectComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  constructor(private api: ApiService) {
  }

  ngOnInit() {
  }

  public downloadKubeconfig() {
    const authorization_token = localStorage.getItem('token');
    this.api.getKubeconfig(this.datacenter.metadata.name, this.cluster.metadata.name, authorization_token).subscribe(res => {
      const data = res;
      const blob = new Blob([data], { type: 'text/plain' });
      const a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = 'kubeconfig';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  copy(type: string): string {
    if (type === 'exportKubeconfig') {
      return 'export KUBECONFIG=$PWD/kubeconfig-' + this.cluster.metadata.name;
    } else if (type === 'kubectlProxy') {
      return 'kubectl proxy';
    }
  }
}
