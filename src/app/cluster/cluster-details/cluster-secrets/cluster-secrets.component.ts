import { Component,  OnInit, Input, Inject} from '@angular/core';
import { ClusterEntity, Health } from '../../../shared/entity/ClusterEntity';


@Component({
  selector: 'kubermatic-cluster-secrets',
  templateUrl: './cluster-secrets.component.html',
  styleUrls: ['./cluster-secrets.component.scss']
})
export class ClusterSecretsComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() health: Health;
  public expand: boolean = false;

  constructor() { }

  ngOnInit() {  }

  isExpand(expand: boolean) {
    this.expand = expand;
  }

  public decode(type: string): void {
    let data;
    let name;

    switch (type) {
      case 'root-ca-certificate':
        name = 'ca.crt';
        data = this.cluster.status.rootCA.cert;
        break;
      case 'apiserver-cert-certificate':
        data = this.cluster.status.apiserverCert.cert;
        name = 'apiserver.crt';
        break;
      case 'apiserver-kubelet-client-certificate':
        data = this.cluster.status.kubeletCert.cert;
        name = 'kubelet-client.crt';
        break;
      case 'ssh-apiserver-rsa-public':
        data = this.cluster.status.apiserverSshKey.publicKey;
        name = 'apiserver_id-rsa.pub';
        break;
      default:
        break;
    }

    if (data && name) {
      const blob = new Blob([atob(data)], {type: 'text/plain'});
      const a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      return;
    }
  }

  public getIcon(name: string): string {
    if (this.health) {
      switch (name) {
        case 'apiserver': return this.getIconClass(this.health.apiserver);
        case 'controller': return this.getIconClass(this.health.controller);
        case 'etcd': return this.getIconClass(this.health.etcd);
        case 'scheduler': return this.getIconClass(this.health.scheduler);
        case 'nodeController': return this.getIconClass(this.health.nodeController);
        default: return '';
      }
    } else {
      return 'fa fa-spin fa-circle-o-notch';
    }
  }

  public getIconClass(isHealthy: boolean): string {
    if (isHealthy) {
      return 'iconRunning';
    } else if (!(isHealthy)) {
      if (this.cluster.status.phase === 'Failed') {
        return 'iconFailed';
      } else {
        return 'fa fa-spin fa-circle-o-notch';
      }
    } else {
      return '';
    }
  }

  public getStatus(name: string): string {
    if (this.health) {
      switch (name) {
        case 'apiserver': return this.getHealthStatus(this.health.apiserver);
        case 'controller': return this.getHealthStatus(this.health.controller);
        case 'etcd': return this.getHealthStatus(this.health.etcd);
        case 'scheduler': return this.getHealthStatus(this.health.scheduler);
        case 'nodeController': return this.getHealthStatus(this.health.nodeController);
        default: return '';
      }
    } else {
      return 'Pending';
    }
  }

  public getHealthStatus(isHealthy: boolean): string {
    if (isHealthy) {
      return 'Running';
    } else if (!isHealthy) {
      if (this.cluster.status.phase === 'Failed') {
        return 'Failed';
      } else {
        return 'Pending';
      }
    } else {
      return '';
    }
  }

}
