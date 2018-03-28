import { WizardActions } from './../redux/actions/wizard.actions';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'app/core/services/api/api.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { MatDialog } from '@angular/material';
import { CloudSpec } from '../shared/entity/ClusterEntity';
import { CreateClusterModel } from '../shared/model/CreateClusterModel';
import * as testing from 'selenium-webdriver/testing';
import { CreateNodeModel } from '../shared/model/CreateNodeModel';
import { DigitaloceanCloudSpec } from '../shared/entity/cloud/DigitialoceanCloudSpec';
import { HetznerCloudSpec } from '../shared/entity/cloud/HetznerCloudSpec';
import { CreateNodesService } from '../core/services';
import { NodeCreateSpec, NodeCloudSpec, OperatingSystemSpec, UbuntuSpec, NodeVersionInfo, NodeContainerRuntimeInfo } from '../shared/entity/NodeEntity';
import { OpenstackNodeSpec } from '../shared/entity/node/OpenstackNodeSpec';
import { AWSNodeSpecV2 } from '../shared/entity/node/AWSNodeSpec';
import { HetznerNodeSpec } from '../shared/entity/node/HetznerNodeSpec';
import { DigitaloceanNodeSpecV2 } from '../shared/entity/node/DigitialoceanNodeSpec';
import { AWSCloudSpec } from '../shared/entity/cloud/AWSCloudSpec';
import { OpenstackCloudSpec } from '../shared/entity/cloud/OpenstackCloudSpec';
import { NotificationActions } from 'app/redux/actions/notification.actions';
import { select, NgRedux } from '@angular-redux/store';
import { Subscription } from 'rxjs/Subscription';
import { BringYourOwnCloudSpec } from 'app/shared/entity/cloud/BringYourOwnCloudSpec';

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

  public resetCachedCredentials() {
    WizardActions.setCloudSpec(
      new CloudSpec(
        '',
        new DigitaloceanCloudSpec(''),
        new AWSCloudSpec('', '', '', '', '', ''),
        new BringYourOwnCloudSpec(),
        new OpenstackCloudSpec('', '', '', 'Default', '', '', ''),
        null,
        new HetznerCloudSpec('')
      )
    );

    WizardActions.setNodeModel(
      new CreateNodeModel(
        new NodeCreateSpec(
          new NodeCloudSpec(
            new DigitaloceanNodeSpecV2('', null, null, null, null),
            new AWSNodeSpecV2('t2.medium', 20, '', '', null),
            new OpenstackNodeSpec('m1.medium', ''),
            new HetznerNodeSpec('')
          ),
          new OperatingSystemSpec(
            new UbuntuSpec(false),
            null
          ),
          new NodeVersionInfo(
            null,
            new NodeContainerRuntimeInfo(null, null)
          )
        )
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
    const nodeCount = (this.selectedProvider !== 'bringyourown') ? wizard.nodeForm.node_count : null;
    const clusterModel = wizard.clusterModel;
    const datacenter = wizard.setDatacenterForm.datacenter.spec.seed;
    console.log('Create cluster mode: \n' + JSON.stringify(clusterModel));

    this.api.createCluster(clusterModel, datacenter).subscribe(cluster => {
        NotificationActions.success('Success', `Cluster successfully created`);
        this.router.navigate(['/clusters/' + datacenter + '/' + cluster.metadata.name]);

        if (this.selectedProvider !== 'bringyourown') {
          this.createNodesService.createInitialClusterNodes(nodeCount, cluster, nodeModel, datacenter);
        }
      },
      error => {
        NotificationActions.error('Error', `${error.status} ${error.statusText}`);
        WizardActions.goToStep(4);
      });
  }

  public ngOnDestroy(): void {
    WizardActions.clearStore();

    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
