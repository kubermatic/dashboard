import { Component, OnInit } from '@angular/core';
import { ClusterSpec, CloudSpec } from "../../shared/entity/ClusterEntity";
import { CreateClusterModel } from "../../shared/model/CreateClusterModel";
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { WizardActions } from 'app/redux/actions/wizard.actions';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss']
})
export class SetSettingsComponent implements OnInit {
  
  @select(['wizard', 'clusterNameForm', 'name']) clusterName$: Observable<string>;
  public clusterName: string;

  @select(['wizard', 'sshKeyForm', 'ssh_keys']) sshKeys$: Observable<string[]>;  
  public sshKeys: string[] = [];

  @select(['wizard', 'cloudSpec']) cloudSpec$: Observable<CloudSpec>;  
  public cloudSpec: CloudSpec;

  public createClusterModal: CreateClusterModel;
  public clusterSpec: ClusterSpec;

  constructor() { }

  ngOnInit() {
    this.clusterName$.subscribe(clusterName => {
        clusterName && (this.clusterName = clusterName);      
      });

    this.sshKeys$.subscribe(sshKeys => {
      if (!Array.isArray(sshKeys) || !sshKeys.length) { return; }

      this.sshKeys = sshKeys;
      this.createSpec();
    });
    
    this.cloudSpec$.subscribe(cloudSpec => {
      if (!cloudSpec) { return; }

      this.cloudSpec = cloudSpec;
      this.createSpec();
    });
  }

  public createSpec() {

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
  }
}
