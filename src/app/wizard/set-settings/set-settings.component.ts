import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import {ClusterSpec, CloudSpec} from "../../shared/entity/ClusterEntity";
import {CreateClusterModel} from "../../shared/model/CreateClusterModel";
import {CreateNodeModel} from "../../shared/model/CreateNodeModel";
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { WizardActions } from 'app/redux/actions/wizard.actions';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss']
})
export class SetSettingsComponent implements OnInit, OnChanges {

  @Input() cloud: CloudSpec;
  @Input() node: CreateNodeModel;
  
  @Output() syncCluster = new EventEmitter();
  @Output() syncCloud = new EventEmitter();
  @Output() syncNode = new EventEmitter();
  
  @select(['wizard', 'clusterNameForm', 'name']) clusterName$: Observable<string>;
  public clusterName: string;

  @select(['wizard', 'sshKeyForm', 'ssh_keys']) sshKeys$: Observable<string[]>;  
  public sshKeys: string[] = [];

  public createClusterModal: CreateClusterModel;

  public cloudSpec: CloudSpec;
  public clusterSpec: ClusterSpec;

  public token: string = "";

  constructor() { }

  ngOnInit() {
    this.clusterName$.subscribe(clusterName => {
        clusterName && (this.clusterName = clusterName);      
      });

    this.sshKeys$.subscribe(sshKeys => {
      sshKeys && (this.sshKeys = sshKeys);
      this.createSpec();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    /* TODO: Find a better solution */
    if (!!this.cloud.digitalocean && this.cloud.digitalocean.token) {
      this.token = this.cloud.digitalocean.token;
    } else {
      this.token = "";
    }
  }

  public setCloud(spec) {
    this.cloudSpec = spec;
    this.createSpec();
  }

  public setNode(model) {
    this.syncNode.emit(model);
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

    WizardActions.setClusterModel(this.createClusterModal);

    this.syncCluster.emit(this.createClusterModal);
    this.syncCloud.emit(this.cloudSpec);
  }
}
