import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, Subject, interval, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { WizardService } from '../core/services/wizard/wizard.service';
import { ClusterDatacenterForm, ClusterFormData, ClusterSpecForm, ClusterProviderForm, ClusterProviderSettingsForm } from '../shared/model/ClusterForm';
import { ClusterEntity, getEmptyCloudProviderSpec } from '../shared/entity/ClusterEntity';
import { SSHKeyEntity } from '../shared/entity/SSHKeyEntity';
import { AddNodeService } from '../core/services/add-node/add-node.service';
import { ProjectEntity } from '../shared/entity/ProjectEntity';
import { NodeData } from '../shared/model/NodeSpecChange';
import { NodeProvider } from '../shared/model/NodeProviderConstants';
import { Step, StepsService } from '../core/services/wizard/steps.service';
import { ApiService, InitialNodeDataService, ProjectService, HealthService } from '../core/services';
import { NotificationActions } from '../redux/actions/notification.actions';
import { Router, ActivatedRoute } from '@angular/router';
import { CreateClusterModel } from '../shared/model/CreateClusterModel';
import { NodeEntity, getEmptyNodeProviderSpec, getEmptyOperatingSystemSpec, getEmptyNodeVersionSpec } from '../shared/entity/NodeEntity';
import { GoogleAnalyticsService } from '../google-analytics.service';

@Component({
  selector: 'kubermatic-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss']
})
export class WizardComponent implements OnInit, OnDestroy {
  public steps: Step[] = [];
  public currentStep: Step;
  public currentStepIndex: number;
  public cluster: ClusterEntity;
  public node: NodeEntity;
  public clusterSpecFormData: ClusterSpecForm = { valid: false, name: '', version: '' };
  public clusterFormData: ClusterFormData = { valid: false };
  public clusterProviderFormData: ClusterProviderForm = { valid: false, provider: '' };
  public clusterDatacenterFormData: ClusterDatacenterForm = { valid: false };
  public clusterProviderSettingsFormData: ClusterProviderSettingsForm = { valid: false };
  public clusterSSHKeys: SSHKeyEntity[] = [];
  public addNodeData: NodeData;
  public creating = false;
  public project: ProjectEntity;
  private subscriptions: Subscription[] = [];

  constructor(private wizardService: WizardService,
              private addNodeService: AddNodeService,
              private stepsService: StepsService,
              private initialNodeDataService: InitialNodeDataService,
              private router: Router,
              private route: ActivatedRoute,
              private projectService: ProjectService,
              private healthService: HealthService,
              private api: ApiService,
              public googleAnalyticsService: GoogleAnalyticsService) {

    this.cluster = {
      name: '',
      spec: {
        version: '',
        cloud: {
          dc: '',
        },
      },
    };

    this.addNodeData = {
      node: {
        spec: {
          cloud: {},
          operatingSystem: {},
          versions: {}
        },
        status: {},
      },
      count: 3
    };
  }

  ngOnInit(): void {
    this.project = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
    }));

    this.googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreationWizardStarted');

    // When the cluster spec got changed, update the cluster
    this.subscriptions.push(this.wizardService.clusterSpecFormChanges$.subscribe(data => {
      this.clusterSpecFormData = data;
      if (this.clusterSpecFormData.valid) {
        this.cluster.name = this.clusterSpecFormData.name;
        this.cluster.spec.version = this.clusterSpecFormData.version;
        this.wizardService.changeCluster(this.cluster);
      }
    }));

    // When the provider got changed, update the cluster
    // Caveat: We must not delete existing provider settings.
    // Caveat: The DC stays set. When changing the provider we have a invalid dc stored in the cluster. But will be changed on the next step.
    this.subscriptions.push(this.wizardService.clusterProviderFormChanges$.subscribe(data => {
      this.clusterProviderFormData = data;

      if (!this.clusterProviderFormData.valid) {
        return;
      }

      let oldProviderSpec = null;
      let oldProviderNodeSpec = null;
      let oldDC = '';

      if (!!this.clusterDatacenterFormData.datacenter) {
        oldProviderSpec = this.clusterDatacenterFormData.datacenter.spec[this.clusterDatacenterFormData.datacenter.spec.provider];
        oldProviderNodeSpec = this.addNodeData.node.spec.cloud[this.clusterProviderFormData.provider];
        oldDC = this.clusterDatacenterFormData.datacenter.spec.seed;
      }
      this.cluster.spec.cloud = { dc: oldDC };

      if (oldProviderSpec == null || oldProviderSpec !== undefined) {
        this.cluster.spec.cloud[this.clusterProviderFormData.provider] = getEmptyCloudProviderSpec(this.clusterProviderFormData.provider);
        this.addNodeData.node.spec.cloud[this.clusterProviderFormData.provider] = getEmptyNodeProviderSpec(this.clusterProviderFormData.provider);
        this.addNodeData.node.spec.operatingSystem = getEmptyOperatingSystemSpec();
        this.addNodeData.node.spec.versions = getEmptyNodeVersionSpec();
        this.clusterDatacenterFormData.valid = false;
        this.clusterProviderSettingsFormData.valid = false;
      } else {
        this.cluster.spec.cloud[this.clusterProviderFormData.provider] = oldProviderSpec;
        this.addNodeData.node.spec.cloud[this.clusterProviderFormData.provider] = oldProviderNodeSpec;
      }
      this.wizardService.changeCluster(this.cluster);
      if (this.clusterProviderFormData.valid) {
        this.stepForward();
      }
    }));

    // When the datacenter got changed, update the cluster
    this.subscriptions.push(this.wizardService.clusterDatacenterFormChanges$.subscribe(data => {
      this.clusterDatacenterFormData = data;
      if (!this.clusterProviderFormData.valid) {
        return;
      }

      this.cluster.spec.cloud.dc = this.clusterDatacenterFormData.datacenter.metadata.name;
      this.wizardService.changeCluster(this.cluster);
      if (this.clusterDatacenterFormData.valid) {
        this.stepForward();
      }
    }));

    // When the provider settings got changed, update the cluster
    this.subscriptions.push(this.wizardService.clusterProviderSettingsFormChanges$.subscribe(data => {
      this.clusterProviderSettingsFormData = data;
      if (!this.clusterProviderSettingsFormData.valid) {
        return;
      }
      this.cluster.spec.cloud = this.clusterProviderSettingsFormData.cloudSpec;
      this.wizardService.changeCluster(this.cluster);
    }));

    this.subscriptions.push(this.wizardService.clusterSSHKeysChanges$.subscribe(keys => {
      this.clusterSSHKeys = keys;
    }));

    this.subscriptions.push(this.addNodeService.nodeDataChanges$.subscribe(async (data: NodeData) => {
      this.addNodeData = await data;
    }));

    // Keep local cluster up to date
    this.subscriptions.push(this.wizardService.clusterChanges$.subscribe(cluster => {
      this.cluster = cluster;
    }));

    this.subscriptions.push(this.stepsService.currentStepChanges$.subscribe(step => {
      this.currentStep = step;
      this.updateSteps();
    }));

    this.subscriptions.push(this.stepsService.currentStepIndexChanges$.subscribe(index => {
      this.currentStepIndex = index;
      this.updateSteps();
    }));

    this.subscriptions.push(this.stepsService.stepsChanges$.subscribe(steps => {
      this.steps = steps;
    }));

    this.updateSteps();
    this.stepsService.changeCurrentStep(0, this.steps[0]);
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  updateSteps(): void {
    const setClusterSpecStep: Step = { name: 'set-cluster-spec', description: 'Cluster', valid: () => this.clusterSpecFormData.valid };
    const setProviderStep: Step = { name: 'set-provider', description: 'Provider', valid: () => this.clusterProviderFormData.valid };
    const setDatacenterStep: Step = { name: 'set-datacenter', description: 'Datacenter', valid: () => this.clusterDatacenterFormData.valid };
    const setProviderSettingsStep: Step = { name: 'set-provider-settings', description: 'Settings', valid: () => this.clusterProviderSettingsFormData.valid && this.addNodeData.valid };
    const summary: Step = { name: 'summary', description: 'Summary', valid: () => true };

    const steps: Step[] = [];
    if (this.clusterProviderFormData.provider === NodeProvider.BRINGYOUROWN) {
      this.steps = [
        setClusterSpecStep,
        setProviderStep,
        setDatacenterStep,
        summary,
      ];
    } else {
      this.steps = [
        setClusterSpecStep,
        setProviderStep,
        setDatacenterStep,
        setProviderSettingsStep,
        summary,
      ];
    }

    this.stepsService.changeSteps(this.steps);

  }

  stepForward(): void {
    this.stepsService.changeCurrentStep(this.currentStepIndex + 1, this.steps[this.currentStepIndex + 1]);
  }

  stepBack(): void {
    this.stepsService.changeCurrentStep(this.currentStepIndex - 1, this.steps[this.currentStepIndex - 1]);
  }

  createCluster(): void {
    this.creating = true;
    const datacenter = this.clusterDatacenterFormData.datacenter;
    const keyNames: string[] = [];
    for (const key of this.clusterSSHKeys) {
      keyNames.push(key.name);
    }

    const createCluster: CreateClusterModel = { name: this.cluster.name, spec: this.cluster.spec, sshKeys: keyNames };

    this.subscriptions.push(this.api.createCluster(createCluster, datacenter.spec.seed, this.project.id)
/*      .pipe(catchError(error => {
        console.log("NOOOOPE")
        return of(null);
    }))*/
    .subscribe(cluster => {
      this.creating = false;
      NotificationActions.success('Success', `Cluster successfully created`);
      this.googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreated');

      const isReady = new Subject<boolean>();
      const timer = interval(5000).pipe(takeUntil(isReady));
      timer.subscribe(tick => {
        this.api.getCluster(cluster.id, datacenter.spec.seed, this.project.id).subscribe(clusterRes => {
          this.router.navigate(['/projects/' + this.project.id + '/dc/' + datacenter.spec.seed + '/clusters/' + cluster.id]);

          if (this.clusterSSHKeys.length > 0) {
            for (const key of this.clusterSSHKeys) {
              this.api.addClusterSSHKey(key.id, cluster.id, datacenter.spec.seed, this.project.id).subscribe(sshkey => {
                NotificationActions.success('Success', `SSH key ${key.name} was successfully added`);
              });
            }
          }
          isReady.next(true);
        },
        error => {
          return;
        });
      });

      const isHealthy = new Subject<boolean>();
      const timerHealth = interval(10000).pipe(takeUntil(isHealthy));
      timerHealth.subscribe(tick => {
        return this.healthService.getClusterHealth(cluster.id, datacenter.spec.seed, this.project.id).subscribe(health => {
          if (health.apiserver && health.controller && health.etcd && health.machineController && health.scheduler) {
            isHealthy.next(true);
            if (this.clusterProviderFormData.provider !== 'bringyourown') {
              this.initialNodeDataService.storeInitialNodeData(this.addNodeData.count, cluster, this.addNodeData.node);
            }
          }
        });
      });
    },
    error => {
      NotificationActions.error('Error', `Could not create cluster`);
      this.googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreationFailed');
      this.creating = false;
    }));
  }

}
