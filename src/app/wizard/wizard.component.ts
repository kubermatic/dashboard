import { WizardActions } from './../redux/actions/wizard.actions';
import { Component, OnInit, OnDestroy } from "@angular/core";
import { ApiService } from "app/core/services/api/api.service";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { MdDialog } from "@angular/material";
import { CloudSpec } from "../shared/entity/ClusterEntity";
import { CreateClusterModel } from "../shared/model/CreateClusterModel";
import * as testing from "selenium-webdriver/testing";
import { CreateNodeModel } from "../shared/model/CreateNodeModel";
import { DigitaloceanCloudSpec } from "../shared/entity/cloud/DigitialoceanCloudSpec";
import { CreateNodesService } from '../core/services';
import { NodeCreateSpec } from "../shared/entity/NodeEntity";
import { OpenstackNodeSpec } from "../shared/entity/node/OpenstackNodeSpec";
import { AWSNodeSpec } from "../shared/entity/node/AWSNodeSpec";
import { DigitaloceanNodeSpec } from "../shared/entity/node/DigitialoceanNodeSpec";
import { AWSCloudSpec } from "../shared/entity/cloud/AWSCloudSpec";
import { OpenstackCloudSpec } from "../shared/entity/cloud/OpenstackCloudSpec";
import { NotificationActions } from "app/redux/actions/notification.actions";
import { select, NgRedux } from "@angular-redux/store";
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: "kubermatic-wizard",
  templateUrl: "./wizard.component.html",
  styleUrls: ["./wizard.component.scss"]
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
    public dialog: MdDialog,
    private createNodesService: CreateNodesService,
    private ngRedux: NgRedux<any>
  ) {}

  ngOnInit() {
    this.resetCachedCredentials();

    let sub = this.step$.combineLatest(this.provider$)
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
        null, 
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

    console.log("Create cluster mode: \n" + JSON.stringify(clusterModel));
    this.api.createCluster(clusterModel).subscribe(cluster => {
        NotificationActions.success("Success", `Cluster successfully created`);
        this.router.navigate(["/clusters/" + cluster.metadata.name]);

        this.createNodesService.createInitialClusterNodes(cluster, nodeModel);
      },
      error => {
        NotificationActions.error("Error", `${error.status} ${error.statusText}`);
      });
  }

  public ngOnDestroy(): void {
    WizardActions.clearStore();

    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
