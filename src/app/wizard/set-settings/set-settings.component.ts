import { Component, OnDestroy, OnInit } from '@angular/core';
import { CloudSpec, ClusterSpec } from '../../shared/entity/ClusterEntity';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';
import { NgRedux, select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { WizardActions } from '../../redux/actions/wizard.actions';

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

  constructor(private ngRedux: NgRedux<any>) {
  }

  public ngOnInit(): void {
    const sub = this.clusterName$.subscribe(clusterName => {
      clusterName && (this.clusterName = clusterName);
    });
    this.subscriptions.push(sub);

    const sub2 = this.sshKeys$.subscribe(sshKeys => {
      if (!Array.isArray(sshKeys) || !sshKeys.length || this.sshKeys === sshKeys) {
        return;
      }

      this.sshKeys = sshKeys;
      this.createSpec();
    });
    this.subscriptions.push(sub2);

    const sub3 = this.cloudSpec$.subscribe(cloudSpec => {
      if (!cloudSpec || this.cloudSpec === cloudSpec) {
        return;
      }

      this.cloudSpec = cloudSpec;
      this.createSpec();
    });
    this.subscriptions.push(sub3);
  }

  public createSpec(): void {
    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    this.clusterSpec = {
      cloud: this.cloudSpec,
      humanReadableName: this.clusterName,
    };

    this.createClusterModal = new CreateClusterModel(
      this.clusterSpec,
      this.sshKeys
    );

    WizardActions.setClusterModel(this.createClusterModal);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
