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
      case 'root-ca-key':
        data = this.cluster.status.rootCA.key;
        name = 'ca.key';
        break;
      case 'apiserver-cert-certificate':
        data = this.cluster.status.apiserverCert.cert;
        name = 'apiserver.crt';
        break;
      case 'apiserver-cert-key':
        data = this.cluster.status.apiserverCert.key;
        name = 'apiserver.key';
        break;
      case 'apiserver-kubelet-client-certificate':
        data = this.cluster.status.kubeletCert.cert;
        name = 'kubelet-client.crt';
        break;
      case 'apiserver-kubelet-client-key':
        data = this.cluster.status.kubeletCert.key;
        name = 'kubelet-client.key';
        break;
      case 'serviceaccount-key':
        data = this.cluster.status.serviceAccountKey;
        name = 'service-account.key';
        break;
      case 'ssh-apiserver-rsa':
        data = this.cluster.status.apiserverSshKey.privateKey;
        name = 'apiserver_id-rsa.key';
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
}
