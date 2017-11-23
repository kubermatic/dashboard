import {Component, OnInit, Input, Output, EventEmitter, SimpleChanges} from '@angular/core';
import {ClusterSpec, CloudSpec} from "../../shared/entity/ClusterEntity";
import {CreateClusterModel} from "../../shared/model/CreateClusterModel";
import {CreateNodeModel} from "../../shared/model/CreateNodeModel"

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss']
})
export class SetSettingsComponent implements OnInit {

  @Input() clusterName: string;
  @Input() provider: string;
  @Input() region: string;
  @Input() cloud: CloudSpec;
  @Input() node: CreateNodeModel;
  @Input() selectedSshKeys: string[];

  @Output() syncCluster = new EventEmitter();
  @Output() syncCloud = new EventEmitter();
  @Output() syncNode = new EventEmitter();
  @Output() syncSshKeys = new EventEmitter();

  @Output() cloudValid = new EventEmitter();
  @Output() nodeValid = new EventEmitter();

  public createClusterModal: CreateClusterModel;

  public cloudSpec: CloudSpec;
  public clusterSpec: ClusterSpec;
  public sshKeys: string[] = [];

  public token: string = "";

  constructor() { }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    /* TODO: Find a better solution */
    if(!!this.cloud.digitalocean && this.cloud.digitalocean.token) {
      this.token = this.cloud.digitalocean.token;
    } else {
      this.token = "";
    }
  }

  public setCloud(spec) {
    this.cloudSpec = spec;
    this.sshKeys = this.selectedSshKeys;
    this.createSpec();
  }

  public setNode(model) {
    this.syncNode.emit(model);
  }

  public setSshKeys(keys) {
    this.sshKeys = keys;
    this.syncSshKeys.emit(keys);
    this.createSpec();
  }

  public cloudSpecValid(value) {
    this.cloudValid.emit(value);
  }

  public nodeSpecValid(value) {
    this.nodeValid.emit(value);
  }

  public createSpec() {
    if (!this.cloudSpec) {
      this.cloudSpec = this.cloud;
    }

    this.clusterSpec = new ClusterSpec(
      this.cloudSpec,
      this.clusterName,
      "",
    );

    this.createClusterModal = new CreateClusterModel(
      this.clusterSpec,
      this.sshKeys,
    );

    this.syncCluster.emit(this.createClusterModal);
    this.syncCloud.emit(this.cloudSpec);
  }
}
