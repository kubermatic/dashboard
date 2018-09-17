import { Component, OnDestroy, OnInit, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';

import { lt, gt } from 'semver';
import { Subscription, ObservableInput, Subject, interval, combineLatest} from 'rxjs';
import { retry, takeUntil } from 'rxjs/operators';

import { NotificationActions } from '../../redux/actions/notification.actions';
import { environment } from '../../../environments/environment';
import { AddNodeModalComponent } from './add-node-modal/add-node-modal.component';
import { EditProviderSettingsComponent } from './edit-provider-settings/edit-provider-settings.component';
import { ClusterDeleteConfirmationComponent } from './cluster-delete-confirmation/cluster-delete-confirmation.component';
import { ChangeClusterVersionComponent } from './change-cluster-version/change-cluster-version.component';
import { ClusterConnectComponent } from './cluster-connect/cluster-connect.component';
import { EditSSHKeysComponent } from './edit-sshkeys/edit-sshkeys.component';

import { ApiService, DatacenterService, InitialNodeDataService, HealthService, UserService } from '../../core/services';
import { AppConfigService } from '../../app-config.service';

import { ClusterEntity, getClusterProvider } from '../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { HealthEntity } from '../../shared/entity/HealthEntity';
import { NodeEntity } from '../../shared/entity/NodeEntity';
import { NodeProvider } from '../../shared/model/NodeProviderConstants';
import { AddNodeModalData } from '../../shared/model/add-node-modal-data';

import { UserGroupConfig } from '../../shared/model/Config';

@Component({
  selector: 'kubermatic-cluster-details',
  templateUrl: './cluster-details.component.html',
  styleUrls: ['./cluster-details.component.scss']
})

export class ClusterDetailsComponent implements OnInit, OnDestroy {
  public cluster: ClusterEntity;
  public nodeDc: DataCenterEntity;
  public datacenter: DataCenterEntity;
  public sshKeys: SSHKeyEntity[] = [];
  public nodes: NodeEntity[] = [];
  public stateOfTheAccordion: object[];
  public isClusterRunning: boolean;
  public clusterHealthClass: string;
  public health: HealthEntity;
  public projectID: string;
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  public updatesAvailable = false;
  public downgradesAvailable = false;
  public moreSshKeys = false;
  private unsubscribe: Subject<any> = new Subject();
  private clusterSubject: Subject<ClusterEntity>;
  private versionsList: string[] = [];
  private refreshInterval = 10000;
  private subscriptions: Subscription[] = [];

  constructor(private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public dialog: MatDialog,
    private initialNodeDataService: InitialNodeDataService,
    private dcService: DatacenterService,
    private healthService: HealthService,
    private userService: UserService,
    private appConfigService: AppConfigService) {
    this.clusterSubject = new Subject<ClusterEntity>();
  }

  public ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    const clusterName = this.route.snapshot.paramMap.get('clusterName');
    const seedDCName = this.route.snapshot.paramMap.get('seedDc');
    this.projectID = this.route.snapshot.paramMap.get('projectID');

    this.userService.currentUserGroup(this.projectID).pipe(takeUntil(this.unsubscribe)).subscribe(group => {
      this.userGroup = group;
    });

    this.initialNodeCreation();

    // Node datacenter & ssh keys - both once
    const onceSub = this.clusterSubject
      .subscribe(cluster => {

        this.dcService.getDataCenter(cluster.spec.cloud.dc)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(datacenter => {
            this.nodeDc = datacenter;
          });
        this.api.getClusterSSHKeys(clusterName, seedDCName, this.projectID)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(keys => {
            this.sshKeys = keys;
          });

        onceSub.unsubscribe();
      });

    // Health
    this.clusterSubject
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(cluster => {

        this.healthService.getClusterHealth(cluster.id, seedDCName, this.projectID).subscribe(health => {
          this.health = health;
          this.isClusterRunning = this.healthService.isClusterRunning(this.cluster, health);
          this.clusterHealthClass = this.healthService.getClusterHealthStatus(this.cluster, health);
          this.reloadClusterNodes();
        });
      });

    // Upgrades
    this.clusterSubject
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(cluster => {
        this.reloadVersions();
      });
    // Nodes
    this.clusterSubject
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(cluster => {
        this.initialNodeCreation();
        this.reloadClusterNodes();
      });



    combineLatest(this.dcService.getDataCenter(seedDCName), this.api.getCluster(clusterName, seedDCName, this.projectID))
      .pipe(takeUntil(this.unsubscribe), retry(3))
      .subscribe(
        (data: any[]): void => {
          this.datacenter = data[0];
          this.cluster = data[1];
          this.clusterSubject.next(data[1]);

          const timer = interval(this.refreshInterval);
          timer.pipe(takeUntil(this.unsubscribe)).subscribe(tick => {
            this.reloadCluster(clusterName, seedDCName, this.projectID);
          });
        },
        error => {
          if (error.status === 404) {
            this.router.navigate(['404']);
          }

        });
  }

  public ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  public reloadCluster(clusterName: string, seedDCName: string, projectID: string): void {
    this.api.getCluster(clusterName, seedDCName, projectID).pipe(takeUntil(this.unsubscribe), retry(3))
      .subscribe(res => {
        this.cluster = res;
        this.clusterSubject.next(res);
        this.reloadVersions();
      });
  }

  public initialNodeCreation() {
    if (this.health && this.health.apiserver && this.health.controller && this.health.etcd && this.health.machineController && this.health.scheduler) {
      // Initial node creation
      const initialNodeCreationSub = this.clusterSubject
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(cluster => {
          const data = this.initialNodeDataService.getInitialNodeData(cluster);
          if (data == null) {
            if (initialNodeCreationSub) {
              initialNodeCreationSub.unsubscribe();
              return;
            }
          }

          if (cluster && this.health && this.health.apiserver && this.health.machineController) {
            const createNodeObservables: Array<ObservableInput<NodeEntity>> = [];
            for (let i = 0; i < data.nodeCount; i++) {
              createNodeObservables.push(this.api.createClusterNode(cluster, data.node, this.datacenter.metadata.name, this.projectID));
            }
            combineLatest(createNodeObservables)
              .pipe(takeUntil(this.unsubscribe))
              .subscribe((createdNodes: NodeEntity[]): void => {
                NotificationActions.success('Success', `Node(s) successfully created`);
                this.reloadClusterNodes();
              });
            this.initialNodeDataService.clearInitialNodeData(cluster);
          }
        });
    }
  }

  public reloadClusterNodes() {
    if (this.cluster && this.health && this.health.apiserver && this.health.machineController) {
      this.api.getClusterNodes(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(nodes => {
          this.nodes = nodes;
        });
    }
  }

  public reloadVersions() {
    if (this.cluster && this.health && this.health.apiserver && this.health.machineController) {
      this.api.getClusterUpgrades(this.projectID, this.datacenter.metadata.name, this.cluster.id)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(upgrades => {
          this.versionsList = [];
          this.updatesAvailable = false;
          for (const i in upgrades) {
            if (upgrades.hasOwnProperty(i)) {
              if (this.versionsList.indexOf(upgrades[i].version) < 0) {
                this.versionsList.push(upgrades[i].version);
              }
              if (lt(this.cluster.spec.version, upgrades[i].version)) {
                this.updatesAvailable = true;
              } else if (gt(this.cluster.spec.version, upgrades[i].version)) {
                this.downgradesAvailable = true;
              }
            }
          }

        });
    }
  }

  public addNode(): void {
    const data = new AddNodeModalData(this.cluster, this.nodeDc);
    const modal = this.dialog.open(AddNodeModalComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;

    const sub = modal.afterClosed().subscribe(result => {
      this.reloadClusterNodes();
      sub.unsubscribe();
    });
  }

  public deleteClusterDialog(): void {
    const modal = this.dialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;

    modal.componentInstance.projectID = this.projectID;
    const sub = modal.afterClosed().subscribe(deleted => {
      if (deleted) {
        this.router.navigate(['/projects/' + this.projectID + '/clusters']);
      }
      sub.unsubscribe();
    });
  }

  public connectClusterDialog(): void {
    const modal = this.dialog.open(ClusterConnectComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
  }

  public changeClusterVersionDialog(): void {
    const modal = this.dialog.open(ChangeClusterVersionComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.possibleVersions = this.versionsList;
    const sub = modal.afterClosed().subscribe(() => {

      this.reloadCluster(this.cluster.id, this.datacenter.metadata.name, this.projectID);
      sub.unsubscribe();
    });
  }

  public getDownloadURL(): string {
    return this.api.getKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id);
  }

  public isLoaded(): boolean {
    if (this.cluster && getClusterProvider(this.cluster) === NodeProvider.BRINGYOUROWN) {
      return true;
    } else if (this.cluster) {
      return !!this.nodeDc;
    }
  }

  public editProviderSettings(): void {
    const modal = this.dialog.open(EditProviderSettingsComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;

    const sub = modal.afterClosed().subscribe(result => {
      sub.unsubscribe();
    });
  }

  public editSSHKeys() {
    const modal = this.dialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;

    const sub = modal.afterClosed().subscribe(result => {
      sub.unsubscribe();
      this.api.getClusterSSHKeys(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(keys => {
          this.sshKeys = keys;
        });
    });
  }

  public loadMoreSshKeys(moreSshKeys: boolean) {
    this.moreSshKeys = moreSshKeys;
  }
}
