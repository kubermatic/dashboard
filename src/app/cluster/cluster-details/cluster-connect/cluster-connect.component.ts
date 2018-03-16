import {Component, Input, OnInit} from '@angular/core';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'kubermatic-cluster-connect',
  templateUrl: './cluster-connect.component.html',
  styleUrls: ['./cluster-connect.component.scss']
})
export class ClusterConnectComponent implements OnInit {
  @Input() clusterName: string;
  @Input() datacenter: string;
  private restRootV3: string = environment.restRootV3;

  constructor() { }

  ngOnInit() {}

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem('token');
    return `${this.restRootV3}/dc/${this.datacenter}/cluster/${this.clusterName}/kubeconfig?token=${authorization_token}`;
  }
}
