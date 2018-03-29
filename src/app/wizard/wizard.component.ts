import { WizardActions } from './../redux/actions/wizard.actions';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { MatDialog } from '@angular/material';
import { ApiService, InitialNodeDataService } from '../core/services';
import { NgRedux, select } from '@angular-redux/store';
import { Subscription } from 'rxjs/Subscription';
import { NotificationActions } from '../redux/actions/notification.actions';
import { DigitaloceanNodeSpec } from '../shared/entity/node/DigitialoceanNodeSpec';
import { OpenstackNodeSpec } from '../shared/entity/node/OpenstackNodeSpec';
import {
  NodeCloudSpec,
  NodeContainerRuntimeInfo,
  NodeSpec,
  NodeVersionInfo,
  OperatingSystemSpec,
  UbuntuSpec
} from '../shared/entity/NodeEntity';
import { AWSNodeSpec } from '../shared/entity/node/AWSNodeSpec';
import { HetznerNodeSpec } from '../shared/entity/node/HetznerNodeSpec';

@Component({
  selector: 'kubermatic-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss']
})

export class WizardComponent implements OnInit, OnDestroy {

  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;
  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public selectedProvider: string;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private router: Router,
              public dialog: MatDialog,
              private initialNodeDataService: InitialNodeDataService,
              private ngRedux: NgRedux<any>) {}

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
    WizardActions.setCloudSpec({
      dc: ''
    });

    WizardActions.setNodeModel({
      metadata: {},
      spec: new NodeSpec(
        new NodeCloudSpec(
          new DigitaloceanNodeSpec('', null, null, null, null),
          new AWSNodeSpec('t2.medium', 20, '', '', null),
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
    });
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
    const node = wizard.nodeModel;
    const nodeCount = (this.selectedProvider !== 'bringyourown') ? wizard.nodeForm.node_count : null;
    const clusterModel = wizard.clusterModel;
    const datacenter = wizard.setDatacenterForm.datacenter.spec.seed;

    this.api.createCluster(clusterModel, datacenter).subscribe(cluster => {
        NotificationActions.success('Success', `Cluster successfully created`);
        this.router.navigate(['/clusters/' + datacenter + '/' + cluster.metadata.name]);

        if (this.selectedProvider !== 'bringyourown') {
          this.initialNodeDataService.storeInitialNodeData(nodeCount, cluster, node);
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
