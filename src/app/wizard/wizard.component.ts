import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {interval, Subject, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ApiService, InitialNodeDataService, ProjectService, WizardService} from '../core/services';
import {NodeDataService} from '../core/services/node-data/node-data.service';
import {Step, StepsService} from '../core/services/wizard/steps.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ClusterEntity, getEmptyCloudProviderSpec} from '../shared/entity/ClusterEntity';
import {getEmptyNodeProviderSpec, getEmptyNodeVersionSpec, getEmptyOperatingSystemSpec, NodeEntity} from '../shared/entity/NodeEntity';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
import {SSHKeyEntity} from '../shared/entity/SSHKeyEntity';
import {ClusterDatacenterForm, ClusterProviderForm, ClusterProviderSettingsForm, ClusterSpecForm, MachineNetworkForm, SetMachineNetworksForm} from '../shared/model/ClusterForm';
import {CreateClusterModel} from '../shared/model/CreateClusterModel';
import {NodeProvider} from '../shared/model/NodeProviderConstants';
import {NodeData} from '../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss'],
})
export class WizardComponent implements OnInit, OnDestroy {
  steps: Step[] = [];
  currentStep: Step;
  currentStepIndex: number;
  cluster: ClusterEntity;
  node: NodeEntity;
  clusterSpecFormData: ClusterSpecForm = {valid: false, name: '', version: ''};
  machineNetworksFormData: MachineNetworkForm[] = [{valid: false, cidr: '', dnsServers: [''], gateway: ''}];
  setMachineNetworksFormData:
      SetMachineNetworksForm = {valid: false, machineNetworks: this.machineNetworksFormData, setMachineNetworks: false};
  clusterProviderFormData: ClusterProviderForm = {valid: false, provider: ''};
  clusterDatacenterFormData: ClusterDatacenterForm = {valid: false};
  clusterProviderSettingsFormData: ClusterProviderSettingsForm = {valid: false};
  clusterSSHKeys: SSHKeyEntity[] = [];
  addNodeData: NodeData;
  creating = false;
  project: ProjectEntity;
  private subscriptions: Subscription[] = [];

  constructor(
      private wizardService: WizardService, private addNodeService: NodeDataService, private stepsService: StepsService,
      private initialNodeDataService: InitialNodeDataService, private router: Router,
      private projectService: ProjectService, private api: ApiService,
      public googleAnalyticsService: GoogleAnalyticsService) {
    this.cluster = {
      name: '',
      spec: {
        version: '',
        cloud: {
          dc: '',
        },
        machineNetworks: [],
      },
    };

    this.addNodeData = {
      spec: {
        cloud: {},
        operatingSystem: {},
        versions: {},
      },
      count: 3,
    };
  }

  ngOnInit(): void {
    this.project = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((project) => {
      this.project = project;
    }));

    this.googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreationWizardStarted');

    // When the cluster spec got changed, update the cluster
    this.subscriptions.push(this.wizardService.clusterSpecFormChanges$.subscribe((data) => {
      this.clusterSpecFormData = data;
      if (this.clusterSpecFormData.valid) {
        this.cluster.name = this.clusterSpecFormData.name;
        this.cluster.spec.version = this.clusterSpecFormData.version;
        this.wizardService.changeCluster(this.cluster);
      }
    }));

    // When the cluster settings got changed, update the cluster
    this.subscriptions.push(this.wizardService.setMachineNetworksFormChanges$.subscribe((data) => {
      this.setMachineNetworksFormData = data;
      if (!!this.setMachineNetworksFormData.setMachineNetworks) {
        if (this.setMachineNetworksFormData.valid) {
          this.setMachineNetworksFormData = data;
          this.cluster.spec.machineNetworks = this.setMachineNetworksFormData.machineNetworks;
          this.wizardService.changeCluster(this.cluster);
        }
      } else {
        this.cluster.spec.machineNetworks = [];
      }
    }));

    // When the provider got changed, update the cluster
    // Caveat: We must not delete existing provider settings.
    // Caveat: The DC stays set. When changing the provider we have a invalid dc stored in the cluster. But will be
    // changed on the next step.
    this.subscriptions.push(this.wizardService.clusterProviderFormChanges$.subscribe((data) => {
      this.clusterProviderFormData = data;

      if (!this.clusterProviderFormData.valid) {
        return;
      }

      let oldProviderSpec = null;
      let oldProviderNodeSpec = null;
      let oldDC = '';

      if (!!this.clusterDatacenterFormData.datacenter) {
        oldProviderSpec =
            this.clusterDatacenterFormData.datacenter.spec[this.clusterDatacenterFormData.datacenter.spec.provider];
        oldProviderNodeSpec = this.addNodeData.spec.cloud[this.clusterProviderFormData.provider];
        oldDC = this.clusterDatacenterFormData.datacenter.spec.seed;
      }
      this.cluster.spec.cloud = {dc: oldDC};

      if (oldProviderSpec === null || oldProviderSpec !== undefined) {
        this.cluster.spec.cloud[this.clusterProviderFormData.provider] =
            getEmptyCloudProviderSpec(this.clusterProviderFormData.provider);
        this.addNodeData.spec.cloud[this.clusterProviderFormData.provider] =
            getEmptyNodeProviderSpec(this.clusterProviderFormData.provider);
        this.addNodeData.spec.operatingSystem = getEmptyOperatingSystemSpec();
        this.addNodeData.spec.versions = getEmptyNodeVersionSpec();
        this.clusterDatacenterFormData.valid = false;
        this.clusterProviderSettingsFormData.valid = false;
      } else {
        this.cluster.spec.cloud[this.clusterProviderFormData.provider] = oldProviderSpec;
        this.addNodeData.spec.cloud[this.clusterProviderFormData.provider] = oldProviderNodeSpec;
      }
      this.wizardService.changeCluster(this.cluster);
      if (this.clusterProviderFormData.valid) {
        this.stepForward();
      }
    }));

    // When the datacenter got changed, update the cluster
    this.subscriptions.push(this.wizardService.clusterDatacenterFormChanges$.subscribe((data) => {
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
    this.subscriptions.push(this.wizardService.clusterProviderSettingsFormChanges$.subscribe((data) => {
      this.clusterProviderSettingsFormData = data;
      if (!this.clusterProviderSettingsFormData.valid) {
        return;
      }
      this.cluster.spec.cloud = this.clusterProviderSettingsFormData.cloudSpec;
      this.wizardService.changeCluster(this.cluster);
    }));

    this.subscriptions.push(this.wizardService.clusterSSHKeysChanges$.subscribe((keys) => {
      this.clusterSSHKeys = keys;
    }));

    this.subscriptions.push(this.addNodeService.nodeDataChanges$.subscribe(async (data: NodeData) => {
      this.addNodeData = await data;
    }));

    // Keep local cluster up to date
    this.subscriptions.push(this.wizardService.clusterChanges$.subscribe((cluster) => {
      this.cluster = cluster;
    }));

    this.subscriptions.push(this.stepsService.currentStepChanges$.subscribe((step) => {
      this.currentStep = step;
      this.updateSteps();
    }));

    this.subscriptions.push(this.stepsService.currentStepIndexChanges$.subscribe((index) => {
      this.currentStepIndex = index;
      this.updateSteps();
    }));

    this.subscriptions.push(this.stepsService.stepsChanges$.subscribe((steps) => {
      this.steps = steps;
    }));

    this.updateSteps();
    this.stepsService.changeCurrentStep(0, this.steps[0]);
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  updateSteps(): void {
    const setClusterSpecStep:
        Step = {name: 'set-cluster-spec', description: 'Cluster', valid: () => this.clusterSpecFormData.valid};
    const setMachinenNetworksStep: Step = {
      name: 'set-machine-networks',
      description: 'Machine Networks',
      valid: () => this.setMachineNetworksFormData.valid
    };
    const setProviderStep:
        Step = {name: 'set-provider', description: 'Provider', valid: () => this.clusterProviderFormData.valid};
    const setDatacenterStep:
        Step = {name: 'set-datacenter', description: 'Datacenter', valid: () => this.clusterDatacenterFormData.valid};
    const setProviderSettingsStep: Step = {
      name: 'set-provider-settings',
      description: 'Settings',
      valid: () => this.clusterProviderSettingsFormData.valid && this.addNodeData.valid
    };
    const summary: Step = {name: 'summary', description: 'Summary', valid: () => true};

    if (this.clusterProviderFormData.provider === NodeProvider.BRINGYOUROWN) {
      this.steps = [
        setClusterSpecStep,
        setProviderStep,
        setDatacenterStep,
        summary,
      ];
    } else if (this.clusterProviderFormData.provider === NodeProvider.VSPHERE) {
      this.steps = [
        setClusterSpecStep,
        setProviderStep,
        setDatacenterStep,
        setProviderSettingsStep,
        setMachinenNetworksStep,
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

    const createCluster: CreateClusterModel = {name: this.cluster.name, spec: this.cluster.spec, sshKeys: keyNames};

    this.subscriptions.push(
        this.api.createCluster(createCluster, datacenter.spec.seed, this.project.id)
            .subscribe(
                (cluster) => {
                  NotificationActions.success('Success', `Cluster successfully created`);
                  this.googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreated');

                  const isReady = new Subject<boolean>();
                  const timer = interval(5000).pipe(takeUntil(isReady));
                  timer.subscribe((tick) => {
                    this.api.getCluster(cluster.id, datacenter.spec.seed, this.project.id).subscribe((clusterRes) => {
                      this.router.navigate(
                          ['/projects/' + this.project.id + '/dc/' + datacenter.spec.seed + '/clusters/' + cluster.id]);

                      if (this.clusterSSHKeys.length > 0) {
                        for (const key of this.clusterSSHKeys) {
                          this.api.addClusterSSHKey(key.id, cluster.id, datacenter.spec.seed, this.project.id)
                              .subscribe((sshkey) => {
                                NotificationActions.success('Success', `SSH key ${key.name} was added successfully`);
                              });
                        }
                      }
                      isReady.next(true);
                      this.creating = false;
                    });
                  });

                  if (this.clusterProviderFormData.provider !== 'bringyourown') {
                    this.initialNodeDataService.storeInitialNodeData(
                        this.addNodeData.count, cluster, this.addNodeData.spec);
                  }
                },
                () => {
                  NotificationActions.error('Error', `Could not create cluster`);
                  this.googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreationFailed');
                  this.creating = false;
                }));
  }
}
