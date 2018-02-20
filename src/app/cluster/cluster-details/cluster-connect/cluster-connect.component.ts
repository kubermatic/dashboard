import {Component, Input, OnInit} from '@angular/core';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'kubermatic-cluster-connect',
  templateUrl: './cluster-connect.component.html',
  styleUrls: ['./cluster-connect.component.scss']
})
export class ClusterConnectComponent implements OnInit {

  constructor() { }

  @Input() clusterName: string;

  private restRoot: string = environment.restRoot;

  ngOnInit() {}

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem('token');
    return `${this.restRoot}/cluster/${this.clusterName}/kubeconfig?token=${authorization_token}`;
  }


}
