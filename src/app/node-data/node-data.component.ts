import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {
  ClusterService,
  DatacenterService,
  ProjectService,
  WizardService,
} from '../core/services';
import {NodeDataService} from '../core/services/node-data/node-data.service';
import {ClusterNameGenerator} from '../core/util/name-generator.service';
import {ClusterEntity, MasterVersion} from '../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../shared/entity/DatacenterEntity';
import {ResourceType} from '../shared/entity/LabelsEntity';
import {OperatingSystemSpec} from '../shared/entity/NodeEntity';
import {OperatingSystem} from '../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../shared/model/NodeSpecChange';
import {ClusterUtils} from '../shared/utils/cluster-utils/cluster-utils';
import {AsyncValidators} from '../shared/validators/async-label-form.validator';
import {NoIpsLeftValidator} from '../shared/validators/no-ips-left.validator';

@Component({
  selector: 'km-node-data',
  templateUrl: './node-data.component.html',
  styleUrls: ['./node-data.component.scss'],
})
export class NodeDataComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() nodeData: NodeData;
  @Input() existingNodesCount: number;
  @Input() isInWizard = false;
  @Input() seedDc: DataCenterEntity;
  @Output() valid = new EventEmitter<boolean>();
  isNameDisabled: boolean;
  projectId: string;
  seedDCName: string;
  form: FormGroup;
  operatingSystemForm: FormGroup;
  nodeDataForm: FormGroup;
  hideOptional = true;
  versions: string[] = [];
  asyncLabelValidators = [
    AsyncValidators.RestrictedLabelKeyName(ResourceType.NodeDeployment),
  ];
  private _unsubscribe = new Subject<void>();
  private providerData: NodeProviderData = {valid: false};

  constructor(
    private nameGenerator: ClusterNameGenerator,
    private addNodeService: NodeDataService,
    private wizardService: WizardService,
    private _dc: DatacenterService,
    private _project: ProjectService,
    private readonly _clusterService: ClusterService
  ) {}

  ngOnInit(): void {
    if (this.seedDc) {
      this.seedDCName = this.seedDc.metadata.name;
    }
    const initialKubeletVersion = this.nodeData.spec.versions.kubelet;
    this._project.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.projectId = project.id));
    this.isNameDisabled =
      this.nodeData.name && this.nodeData.name.length > 0 && !this.isInWizard;

    this.form = new FormGroup({
      count: new FormControl(this.nodeData.count, [
        Validators.required,
        Validators.min(0),
        NoIpsLeftValidator(
          this.cluster.spec.machineNetworks,
          this.existingNodesCount
        ),
      ]),
      operatingSystem: new FormControl(
        this.isClusterOpenshift()
          ? OperatingSystem.CentOS
          : this.selectDefaultOS(),
        Validators.required
      ),
      name: new FormControl(
        {value: this.nodeData.name, disabled: this.isNameDisabled},
        [
          Validators.pattern(
            '[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*'
          ),
        ]
      ),
    });

    if (!this.isInWizard) {
      this.form.addControl('kubelet', new FormControl());
    }

    this.form.controls.count.markAsTouched();

    this.operatingSystemForm = new FormGroup({
      distUpgradeOnBootUbuntu: new FormControl(
        !!this.nodeData.spec.operatingSystem.ubuntu &&
          this.nodeData.spec.operatingSystem.ubuntu.distUpgradeOnBoot
      ),
      distUpgradeOnBootCentos: new FormControl(
        !!this.nodeData.spec.operatingSystem.centos &&
          this.nodeData.spec.operatingSystem.centos.distUpgradeOnBoot
      ),
      distUpgradeOnBootSLES: new FormControl(
        !!this.nodeData.spec.operatingSystem.sles &&
          this.nodeData.spec.operatingSystem.sles.distUpgradeOnBoot
      ),
      distUpgradeOnBootRHEL: new FormControl(
        !!this.nodeData.spec.operatingSystem.rhel &&
          this.nodeData.spec.operatingSystem.rhel.distUpgradeOnBoot
      ),
      rhelSubscriptionManagerUser: new FormControl(
        this.nodeData.spec.operatingSystem.rhel
          ? this.nodeData.spec.operatingSystem.rhel.rhelSubscriptionManagerUser
          : ''
      ),
      rhelSubscriptionManagerPassword: new FormControl(
        this.nodeData.spec.operatingSystem.rhel
          ? this.nodeData.spec.operatingSystem.rhel
              .rhelSubscriptionManagerPassword
          : ''
      ),
      rhsmOfflineToken: new FormControl(
        this.nodeData.spec.operatingSystem.rhel
          ? this.nodeData.spec.operatingSystem.rhel.rhsmOfflineToken
          : ''
      ),
      disableAutoUpdate: new FormControl(
        !!this.nodeData.spec.operatingSystem.containerLinux &&
          this.nodeData.spec.operatingSystem.containerLinux.disableAutoUpdate
      ),
    });

    this.nodeDataForm = new FormGroup({
      dynamicConfig: new FormControl(this.nodeData.dynamicConfig),
    });

    this.nodeDataForm.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.addNodeService.changeNodeData(this.getAddNodeData());
      });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.addNodeService.changeNodeData(this.getAddNodeData());
      this.addNodeService.changeNodeOperatingSystemData(this.getOSSpec());
      this.valid.emit(this.form.valid);
      this.nodeData.valid = this.form.valid;
      this.providerData.valid = this.form.valid;
      this.addNodeService.changeNodeProviderData(this.providerData);
      this.addNodeService.changeNodeData(this.getAddNodeData());
    });

    this.operatingSystemForm.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.addNodeService.changeNodeData(this.getAddNodeData());
        this.addNodeService.changeNodeOperatingSystemData(this.getOSSpec());
      });

    this.addNodeService.nodeProviderDataChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.providerData = data;
        this.providerData.valid = this.providerData.valid && this.form.valid;
        this.addNodeService.changeNodeData(this.getAddNodeData());
      });

    this.wizardService.clusterSettingsFormViewChanged$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this.hideOptional = data.hideOptional;
      });

    this._dc
      .getDataCenter(this.cluster.spec.cloud.dc)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        this.seedDc = dc;
        this.seedDCName = dc.spec.seed;

        if (!this.isInWizard) {
          this._clusterService
            .nodeUpgrades(this.cluster.spec.version, this.cluster.type)
            .pipe(first())
            .subscribe((upgrades: MasterVersion[]) => {
              upgrades.forEach(upgrade => this.versions.push(upgrade.version));
              if (this.versions.length > 0) {
                if (this.versions.includes(initialKubeletVersion)) {
                  // First, try to default to kubelet version from node data (edit mode).
                  this.form.patchValue({kubelet: initialKubeletVersion});
                } else if (this.versions.includes(this.cluster.spec.version)) {
                  // Then, try to default to control plane version from cluster (adding new node).
                  this.form.patchValue({kubelet: this.cluster.spec.version});
                } else {
                  // Otherwise, just pick newest version from the list as default.
                  this.form.patchValue({
                    kubelet: this.versions[this.versions.length - 1],
                  });
                }
              }
            });
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  selectDefaultOS(): string {
    if (this.cluster.spec.cloud.vsphere) {
      if (this.isAvailable(OperatingSystem.Ubuntu)) {
        return OperatingSystem.Ubuntu;
      } else if (this.isAvailable(OperatingSystem.CentOS)) {
        return OperatingSystem.CentOS;
      } else if (this.isAvailable('coreos')) {
        return OperatingSystem.ContainerLinux;
      } else {
        return OperatingSystem.Ubuntu;
      }
    } else {
      return OperatingSystem.Ubuntu;
    }
  }

  getOSSpec(): OperatingSystemSpec {
    switch (this.form.controls.operatingSystem.value) {
      case OperatingSystem.Ubuntu:
        return {
          ubuntu: {
            distUpgradeOnBoot: this.operatingSystemForm.controls
              .distUpgradeOnBootUbuntu.value,
          },
        };
      case OperatingSystem.CentOS:
        return {
          centos: {
            distUpgradeOnBoot: this.operatingSystemForm.controls
              .distUpgradeOnBootCentos.value,
          },
        };
      case OperatingSystem.ContainerLinux:
        return {
          containerLinux: {
            disableAutoUpdate: this.operatingSystemForm.controls
              .disableAutoUpdate.value,
          },
        };
      case OperatingSystem.SLES:
        return {
          sles: {
            distUpgradeOnBoot: this.operatingSystemForm.controls
              .distUpgradeOnBootSLES.value,
          },
        };
      case OperatingSystem.RHEL:
        return {
          rhel: {
            distUpgradeOnBoot: this.operatingSystemForm.controls
              .distUpgradeOnBootRHEL.value,
            rhelSubscriptionManagerUser: this.operatingSystemForm.controls
              .rhelSubscriptionManagerUser.value,
            rhelSubscriptionManagerPassword: this.operatingSystemForm.controls
              .rhelSubscriptionManagerPassword.value,
            rhsmOfflineToken: this.operatingSystemForm.controls.rhsmOfflineToken
              .value,
          },
        };
      default:
        return {
          ubuntu: {
            distUpgradeOnBoot: false,
          },
        };
    }
  }

  generateName(): void {
    this.form.patchValue({name: this.nameGenerator.generateName()});
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  isClusterOpenshift(): boolean {
    return ClusterUtils.isOpenshiftType(this.cluster);
  }

  isRHELAvailable(): boolean {
    return (
      !!this.cluster.spec.cloud.aws ||
      !!this.cluster.spec.cloud.azure ||
      !!this.cluster.spec.cloud.gcp ||
      !!this.cluster.spec.cloud.kubevirt ||
      !!this.cluster.spec.cloud.openstack ||
      !!this.cluster.spec.cloud.vsphere
    );
  }

  isAvailable(os: string): boolean {
    if (this.cluster.spec.cloud.vsphere) {
      return (
        !!this.seedDc &&
        !!this.seedDc.spec &&
        !!this.seedDc.spec.vsphere &&
        !!this.seedDc.spec.vsphere.templates[os] &&
        this.seedDc.spec.vsphere.templates[os] !== ''
      );
    } else {
      return true;
    }
  }

  getAddNodeData(): NodeData {
    let versions = {};
    if (!this.isInWizard) {
      versions = {
        kubelet: this.form.controls.kubelet.value,
      };
    }

    return {
      spec: {
        cloud: this.providerData.spec,
        operatingSystem: this.getOSSpec(),
        labels: this.nodeData.spec.labels,
        taints: this.nodeData.spec.taints,
        versions,
      },
      name: this.form.controls.name.value,
      count: this.form.controls.count.value,
      valid: this.providerData.valid,
      dynamicConfig: this.nodeDataForm.controls.dynamicConfig.value,
    };
  }
}
