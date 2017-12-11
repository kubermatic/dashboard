import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClusterSpec, CloudSpec } from "../../shared/entity/ClusterEntity";
import { CreateClusterModel } from "../../shared/model/CreateClusterModel";
import { select, NgRedux } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss']
})
export class SetSettingsComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  
  @select(['wizard', 'clusterNameForm', 'name']) clusterName$: Observable<string>;
  public clusterName: string;

  @select(['wizard', 'sshKeyForm', 'ssh_keys']) sshKeys$: Observable<string[]>;  
  public sshKeys: string[] = [];

  @select(['wizard', 'cloudSpec']) cloudSpec$: Observable<CloudSpec>;  
  public cloudSpec: CloudSpec;

  public createClusterModal: CreateClusterModel;
  public clusterSpec: ClusterSpec;

  constructor(private ngRedux: NgRedux<any>) { }

  public ngOnInit(): void {
    let sub = this.clusterName$.subscribe(clusterName => {
        clusterName && (this.clusterName = clusterName);      
      });
    this.subscriptions.push(sub);

    let sub2 = this.sshKeys$.subscribe(sshKeys => {
      if (!Array.isArray(sshKeys) || !sshKeys.length || this.sshKeys === sshKeys) { return; }

      this.sshKeys = sshKeys;
      this.createSpec();
    });
    this.subscriptions.push(sub2);    
    
    let sub3 = this.cloudSpec$.subscribe(cloudSpec => {
      if (!cloudSpec || this.cloudSpec === cloudSpec) { return; }

      this.cloudSpec = cloudSpec;
      this.createSpec();
    });
    this.subscriptions.push(sub3);
  }

  public createSpec(): void {
    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    this.clusterSpec = new ClusterSpec(
      this.cloudSpec,
      this.clusterName,
      '',
      region
    );

    this.createClusterModal = new CreateClusterModel(
      this.clusterSpec,
      this.sshKeys,
    );

    WizardActions.setClusterModel(this.createClusterModal);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
