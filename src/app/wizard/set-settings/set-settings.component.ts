import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NodeProvider} from "../../api/model/NodeProviderConstants";
import {ClusterSpec, CloudSpec} from "../../api/entitiy/ClusterEntity";
import {CreateClusterModel} from "../../api/model/CreateClusterModel";
import {SshKeys} from "../../api/model/SshKeysModel";
import {DataCenterEntity} from "../../api/entitiy/DatacenterEntity";


@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss']
})
export class SetSettingsComponent implements OnInit {

  @Input() clusterName: string;
  @Input() provider: string;
  @Input() region: string;

  @Output() syncCluster = new EventEmitter();
  @Output() syncNode = new EventEmitter();
  @Output() syncSshKeys = new EventEmitter();

  public clusterModal: CreateClusterModel;
  // varies between AWSCloudSpec, DigitalOceanCloudSpec, OpenstackCloudSpec
  public getCloudSpec: any;
  public clusterSpec: ClusterSpec;
  public getSshKeys: string[] = [];

  public sshKeysFormField: SshKeys[] = [{
    aws :[],
    digitalocean : [],
    baremetal : [],
    openstack : []
  }];

  constructor() { }

  ngOnInit() { }

  public setCloud(spec) {
    this.getCloudSpec = spec;
    this.createSpec();
  }

  public setNode(model) {
    this.syncNode.emit(model);
  }

  public setSshKeys() {
    this.getSshKeys = this.sshKeysFormField[0][this.provider];
    this.syncSshKeys.emit(this.sshKeysFormField[0][this.provider]);
    this.createSpec();
  }

  public createSpec() {
    if (this.provider === NodeProvider.AWS) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.region,
          null,
          this.getCloudSpec,
          null,
          null,
          null,
        ),
        this.clusterName,
        "",
      );

    } else if (this.provider === NodeProvider.DIGITALOCEAN) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.region,
          this.getCloudSpec,
          null,
          null,
          null,
          null,
        ),
        this.clusterName,
        "",
      );
    } else if (this.provider === NodeProvider.OPENSTACK) {
      this.clusterSpec = new ClusterSpec(
        new CloudSpec(
          this.region,
          null,
          null,
          null,
          this.getCloudSpec,
          null,
        ),
        this.clusterName,
        "",
      );
    }

    this.clusterModal = new CreateClusterModel(
      this.clusterSpec,
      this.getSshKeys,
    );

    this.syncCluster.emit(this.clusterModal);
  }
}
