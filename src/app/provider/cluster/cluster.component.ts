import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {CloudSpec, ClusterSpec} from "../../api/entitiy/ClusterEntity";
import {NodeProvider} from "../../api/model/NodeProviderConstants";

@Component({
  selector: 'kubermatic-provider-cluster',
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.scss']
})
export class ProviderClusterComponent implements OnInit {

  constructor() { }

  public cloudSpec: CloudSpec;

  @Input() provider: string;
  @Input() region: string;
  @Input() cloud: CloudSpec;
  @Output() syncCloudSpec = new EventEmitter();
  @Output() syncCloudSpecValid = new EventEmitter();

  ngOnInit() { }

  public setCloud(providerCloudSpec) {

    if (this.provider === NodeProvider.AWS) {

      this.cloudSpec = new CloudSpec(
        this.region,
        null,
        providerCloudSpec,
        null,
        null,
        null,
      )

    } else if (this.provider === NodeProvider.DIGITALOCEAN) {

      this.cloudSpec = new CloudSpec(
        this.region,
        providerCloudSpec,
        null,
        null,
        null,
        null,
      )
    } else if (this.provider === NodeProvider.OPENSTACK) {
      this.cloudSpec = new CloudSpec(
        this.region,
        null,
        null,
        null,
        providerCloudSpec,
        null,
      )
    }

    this.syncCloudSpec.emit(this.cloudSpec);
  }

  public valid(value) {
    this.syncCloudSpecValid.emit(value);
  }

}
