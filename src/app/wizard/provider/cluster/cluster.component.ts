import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { Observable } from 'rxjs/Rx';
import { select } from '@angular-redux/store';
import { FormGroup } from '@angular/forms';
import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {CloudSpec, ClusterSpec} from "../../../shared/entity/ClusterEntity";
import {NodeProvider} from "../../../shared/model/NodeProviderConstants";

@Component({
  selector: 'kubermatic-provider-cluster',
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.scss']
})
export class ProviderClusterComponent implements OnInit {
  @Input() cloud: CloudSpec;
  @Output() syncCloudSpec = new EventEmitter();

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  @select(['wizard', 'setDatacenterForm', 'datacenter']) region$: Observable<DataCenterEntity>;
  public region: string;

  constructor() { }

  public cloudSpec: CloudSpec;

  ngOnInit() { 
    this.provider$.combineLatest(this.region$)
      .subscribe((data: [string, DataCenterEntity]) => {
        const provider = data[0];
        const region = data[1];

        provider && (this.provider = provider);
        region && (this.region = region.metadata.name);
      });
  }

  public setCloud(providerCloudSpec) {

    if (this.provider === NodeProvider.AWS) {
      this.cloudSpec = new CloudSpec(
        this.region,
        null,
        providerCloudSpec,
        null,
        null,
        null,
      );
    } else if (this.provider === NodeProvider.DIGITALOCEAN) {
      this.cloudSpec = new CloudSpec(
        this.region,
        providerCloudSpec,
        null,
        null,
        null,
        null,
      );
    } else if (this.provider === NodeProvider.OPENSTACK) {
      this.cloudSpec = new CloudSpec(
        this.region,
        null,
        null,
        null,
        providerCloudSpec,
        null,
      );
    }

    this.syncCloudSpec.emit(this.cloudSpec);
  }
}
