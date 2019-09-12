import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {forkJoin, of, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../app-config.service';
import {ClusterService, ProjectService, WizardService} from '../core/services';
import {NodeDataService} from '../core/services/node-data/node-data.service';
import {Step, StepsService} from '../core/services/wizard/steps.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ClusterEntity, getEmptyCloudProviderSpec} from '../shared/entity/ClusterEntity';
import {getEmptyNodeProviderSpec, getEmptyNodeVersionSpec, getEmptyOperatingSystemSpec} from '../shared/entity/NodeEntity';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
import {SSHKeyEntity} from '../shared/entity/SSHKeyEntity';
import {ClusterDatacenterForm, ClusterProviderForm, ClusterProviderSettingsForm, ClusterSpecForm, MachineNetworkForm, SetMachineNetworksForm} from '../shared/model/ClusterForm';
import {CreateClusterModel} from '../shared/model/CreateClusterModel';
import {NodeProvider} from '../shared/model/NodeProviderConstants';
import {NodeData} from '../shared/model/NodeSpecChange';
import {ClusterType} from '../shared/utils/cluster-utils/cluster-utils';

@Component({
  selector: 'kubermatic-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss'],
})
export class WizardComponent implements OnInit, OnDestroy {
  private _machineNetworksFormData: MachineNetworkForm[] = [{valid: false, cidr: '', dnsServers: [''], gateway: ''}];
  private _clusterSpecFormData: ClusterSpecForm = {valid: false, name: '', type: '', version: ''};
  private _clusterProviderSettingsFormData: ClusterProviderSettingsForm = {valid: false};
  private _setMachineNetworksFormData: SetMachineNetworksForm = {
    valid: false,
    machineNetworks: this._machineNetworksFormData,
    setMachineNetworks: false
  };
  private _unsubscribe: Subject<any> = new Subject();

  steps: Step[] = [];
  currentStep: Step;
  currentStepIndex = 0;
  cluster: ClusterEntity;
  clusterProviderFormData: ClusterProviderForm = {valid: false, provider: NodeProvider.NONE};
  clusterDatacenterFormData: ClusterDatacenterForm = {valid: false};
  clusterSSHKeys: SSHKeyEntity[] = [];
  addNodeData: NodeData;
  creating = false;
  project = {} as ProjectEntity;

  constructor(
      private readonly _wizardService: WizardService, private readonly _addNodeService: NodeDataService,
      private readonly _stepsService: StepsService, private readonly _router: Router,
      private readonly _projectService: ProjectService, private readonly _clusterService: ClusterService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _appConfigService: AppConfigService) {
    const defaultNodeCount = this._appConfigService.getConfig().default_node_count || 3;
    this.cluster = {
      name: '',
      spec: {
        version: '',
        cloud: {
          dc: '',
        },
        machineNetworks: [],
      },
      type: '',
    };

    this.addNodeData = {
      spec: {
        cloud: {},
        operatingSystem: {},
        versions: {},
      },
      count: defaultNodeCount,
    };
  }

  ngOnInit(): void {
    this.updateSteps();
    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .subscribe(project => this.project = project);
    this._googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreationWizardStarted');

    // When the cluster spec got changed, update the cluster
    this._wizardService.clusterSpecFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this._clusterSpecFormData = data;
      if (this._clusterSpecFormData.valid) {
        this.cluster.name = this._clusterSpecFormData.name;
        this.cluster.spec.version = this._clusterSpecFormData.version;
        this.cluster.type = this._clusterSpecFormData.type;

        if (this._clusterSpecFormData.type === ClusterType.OpenShift) {
          this.cluster.spec.openshift = {
            imagePullSecret: this._clusterSpecFormData.imagePullSecret,
          };
        }

        this._wizardService.changeCluster(this.cluster);
      }
    });

    // When the cluster settings got changed, update the cluster
    this._wizardService.setMachineNetworksFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this._setMachineNetworksFormData = data;
      if (!!this._setMachineNetworksFormData.setMachineNetworks) {
        if (this._setMachineNetworksFormData.valid) {
          this._setMachineNetworksFormData = data;
          this.cluster.spec.machineNetworks = this._setMachineNetworksFormData.machineNetworks;
          this._wizardService.changeCluster(this.cluster);
        }
      } else {
        this.cluster.spec.machineNetworks = [];
      }
    });

    // When the provider got changed, update the cluster
    // Caveat: We must not delete existing provider settings.
    // Caveat: The DC stays set. When changing the provider we have a invalid dc stored in the cluster. But will be
    // changed on the next step.
    this._wizardService.clusterProviderFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
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
        this._clusterProviderSettingsFormData.valid = false;
      } else {
        this.cluster.spec.cloud[this.clusterProviderFormData.provider] = oldProviderSpec;
        this.addNodeData.spec.cloud[this.clusterProviderFormData.provider] = oldProviderNodeSpec;
      }
      this._wizardService.changeCluster(this.cluster);
      if (this.clusterProviderFormData.valid) {
        this.stepForward();
      }
    });

    // When the datacenter got changed, update the cluster
    this._wizardService.clusterDatacenterFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.clusterDatacenterFormData = data;
      if (!this.clusterProviderFormData.valid) {
        return;
      }

      this.cluster.spec.cloud.dc = this.clusterDatacenterFormData.datacenter.metadata.name;
      this._wizardService.changeCluster(this.cluster);
      if (this.clusterDatacenterFormData.valid) {
        this.stepForward();
      }
    });

    // When the provider settings got changed, update the cluster
    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this._clusterProviderSettingsFormData = data;
      if (!this._clusterProviderSettingsFormData.valid) {
        return;
      }
      this.cluster.spec.cloud = this._clusterProviderSettingsFormData.cloudSpec;
      this._wizardService.changeCluster(this.cluster);
    });

    this._wizardService.clusterSSHKeysChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((keys) => {
      this.clusterSSHKeys = keys;
    });

    this._addNodeService.nodeDataChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(async (data: NodeData) => {
      this.addNodeData = await data;
    });

    // Keep local cluster up to date
    this._wizardService.clusterChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((cluster) => {
      this.cluster = cluster;
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe))
        .subscribe(credentials => this.cluster.credential = credentials);

    this._stepsService.currentStepChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((step) => {
      this.currentStep = step;
      this.updateSteps();
    });

    this._stepsService.currentStepIndexChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((index) => {
      this.currentStepIndex = index;
      this.updateSteps();
    });

    this._stepsService.stepsChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((steps) => {
      this.steps = steps;
    });

    this._stepsService.changeCurrentStep(0, this.steps[0]);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  updateSteps(): void {
    const setClusterSpecStep:
        Step = {name: 'set-cluster-spec', description: 'Cluster', valid: () => this._clusterSpecFormData.valid};
    const setMachinenNetworksStep: Step = {
      name: 'set-machine-networks',
      description: 'Machine Networks',
      valid: () => this._setMachineNetworksFormData.valid
    };
    const setProviderStep:
        Step = {name: 'set-provider', description: 'Provider', valid: () => this.clusterProviderFormData.valid};
    const setDatacenterStep:
        Step = {name: 'set-datacenter', description: 'Datacenter', valid: () => this.clusterDatacenterFormData.valid};
    const setProviderSettingsStep: Step = {
      name: 'set-provider-settings',
      description: 'Settings',
      valid: () => this._clusterProviderSettingsFormData.valid && this.addNodeData.valid
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

    this._stepsService.changeSteps(this.steps);
  }

  stepForward(): void {
    this._stepsService.changeCurrentStep(this.currentStepIndex + 1, this.steps[this.currentStepIndex + 1]);
  }

  stepBack(): void {
    this._stepsService.changeCurrentStep(this.currentStepIndex - 1, this.steps[this.currentStepIndex - 1]);
  }

  createCluster(): void {
    this.creating = true;
    let createdCluster: ClusterEntity;
    const datacenter = this.clusterDatacenterFormData.datacenter;
    const createCluster = this._getCreateCluterModel();

    this._clusterService.create(this.project.id, datacenter.spec.seed, createCluster)
        .pipe(switchMap(cluster => {
          NotificationActions.success(`Cluster ${createCluster.cluster.name} successfully created`);
          this._googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreated');
          createdCluster = cluster;

          return this._clusterService.cluster(this.project.id, createdCluster.id, datacenter.spec.seed);
        }))
        .pipe(switchMap(() => {
          this.creating = false;

          if (this.clusterSSHKeys.length > 0) {
            return forkJoin(this.clusterSSHKeys.map(
                key => this._clusterService.createSSHKey(
                    this.project.id, createdCluster.id, datacenter.spec.seed, key.id)));
          }

          return of([]);
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            (keys: SSHKeyEntity[]) => {
              this._router.navigate(
                  [`/projects/${this.project.id}/dc/${datacenter.spec.seed}/clusters/${createdCluster.id}`]);
              keys.forEach(
                  key => NotificationActions.success(
                      `SSH key ${key.name} was added successfully to cluster ${createCluster.cluster.name}`));
            },
            () => {
              NotificationActions.error(`Could not create cluster ${createCluster.cluster.name}`);
              this._googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreationFailed');
              this.creating = false;
            });
  }


  private _getCreateCluterModel(): CreateClusterModel {
    const keyNames: string[] = [];
    for (const key of this.clusterSSHKeys) {
      keyNames.push(key.name);
    }

    return {
      cluster: {
        name: this.cluster.name,
        spec: this.cluster.spec,
        type: this.cluster.type,
        sshKeys: keyNames,
        credential: this.cluster.credential,
      },
      nodeDeployment: {
        name: this.addNodeData.name,
        spec: {
          template: this.addNodeData.spec,
          replicas: this.addNodeData.count,
        },
      }
    };
  }
}
