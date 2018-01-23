import { WizardActions } from './../redux/actions/wizard.actions';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ApiService } from 'app/core/services/api/api.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { MatDialog } from '@angular/material';
import { CloudSpec } from '../shared/entity/ClusterEntity';
import { CreateClusterModel } from '../shared/model/CreateClusterModel';
import * as testing from 'selenium-webdriver/testing';
import { CreateNodeModel } from '../shared/model/CreateNodeModel';
import { DigitaloceanCloudSpec } from '../shared/entity/cloud/DigitialoceanCloudSpec';
import { CreateNodesService } from '../core/services';
import { NodeCreateSpec } from '../shared/entity/NodeEntity';
import { OpenstackNodeSpec } from '../shared/entity/node/OpenstackNodeSpec';
import { AWSNodeSpec } from '../shared/entity/node/AWSNodeSpec';
import { DigitaloceanNodeSpec } from '../shared/entity/node/DigitialoceanNodeSpec';
import { AWSCloudSpec } from '../shared/entity/cloud/AWSCloudSpec';
import { OpenstackCloudSpec } from '../shared/entity/cloud/OpenstackCloudSpec';
import { NotificationActions } from 'app/redux/actions/notification.actions';
import { select, NgRedux } from '@angular-redux/store';
import { Subscription } from 'rxjs/Subscription';
import { BringYourOwnCloudSpec } from 'app/shared/entity/cloud/BringYourOwnCloudSpec';
import { SetClusterNameComponent } from './set-cluster-name/set-cluster-name.component';
import { SetDatacenterComponent } from './set-datacenter/set-datacenter.component';
import { SetProviderComponent } from './set-provider/set-provider.component';
import { SetSettingsComponent } from './set-settings/set-settings.component';

@Component({
  selector: 'kubermatic-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss']
})

export class WizardComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];

  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public selectedProvider: string;

  @ViewChild(SetClusterNameComponent)
  private setClusterNameComponent: SetClusterNameComponent;
  @ViewChild(SetDatacenterComponent)
  private setDatacenterComponent: SetDatacenterComponent;
  @ViewChild(SetProviderComponent)
  private setProviderComponent: SetProviderComponent;
  @ViewChild(SetSettingsComponent)
  private setSettingsComponent: SetSettingsComponent;

  constructor(
    private api: ApiService,
    private router: Router,
    public dialog: MatDialog,
    private createNodesService: CreateNodesService,
    private ngRedux: NgRedux<any>
  ) {}

  public ngOnInit(): void {
    this.resetCachedCredentials();

    const sub = this.step$.combineLatest(this.provider$)
      .subscribe((data: [number, string]) => {
        const step = data[0];
        const provider = data[1];

        if (this.step !== step && step === 5) {
          this.createClusterAndNode();
        }
        this.step = step;

        provider && this.setProvider(provider);
      });

    this.subscriptions.push(sub);
  }

  getFormCluster(event: any) {
    const methodName = event.methodName;
    const formName = event.formName;

    switch (formName) {
      case 'clusterNameForm':
        return this.setClusterNameComponent[methodName](event);
      case 'setProviderForm':
        return this.setProviderComponent[methodName](event);
      case 'setDatacenterForm':
        return this.setDatacenterComponent[methodName](event);
      case 'setSettings':
        return this.setSettingsComponent[methodName](event);
      default:
        return;
    }
  }

  public resetCachedCredentials() {
    WizardActions.setCloudSpec(
      new CloudSpec(
        '',
        new DigitaloceanCloudSpec(''),
        new AWSCloudSpec('', '', '', '', '', ''),
        new BringYourOwnCloudSpec(),
        new OpenstackCloudSpec('', '', '', 'Default', '', '', ''),
        null
      )
    );

    WizardActions.setNodeModel(
      new CreateNodeModel(
        3,
        new NodeCreateSpec(
          new DigitaloceanNodeSpec(''),
          new AWSNodeSpec('t2.medium', 20, '', ''),
          new OpenstackNodeSpec('m1.medium', ''), null)
      )
    );
  }

  public setProvider(cloud: string) {
    if (this.selectedProvider !== cloud) {
      this.resetCachedCredentials();
    }

    this.selectedProvider = cloud;
  }

  public createClusterAndNode() {
    const reduxStore = this.ngRedux.getState();
    const wizard = reduxStore.wizard;
    const nodeModel = wizard.nodeModel;
    const clusterModel = wizard.clusterModel;

    console.log('Create cluster mode: \n' + JSON.stringify(clusterModel));
    this.api.createCluster(clusterModel).subscribe(cluster => {
        NotificationActions.success('Success', `Cluster successfully created`);
        this.router.navigate(['/clusters/' + cluster.metadata.name]);

        if (this.selectedProvider !== 'bringyourown') {
          this.createNodesService.createInitialClusterNodes(cluster, nodeModel);
        }
      },
      error => {
        NotificationActions.error('Error', `${error.status} ${error.statusText}`);
      });
  }

  public ngOnDestroy(): void {
    WizardActions.clearStore();

    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
