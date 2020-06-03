import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {ClusterService, DatacenterService} from '../../core/services';
import {Cluster, ClusterType, MasterVersion} from '../../shared/entity/cluster';
import {NodeSpec} from '../../shared/entity/node';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {ClusterService as ClusterDataService} from '../../shared/services/cluster.service';
import {BaseFormValidator} from '../../shared/validators/base-form.validator';
import {NodeDataService} from '../service/service';

enum Controls {
  Kubelet = 'kubelet',
}

@Component({
  selector: 'km-node-data-kubelet-version',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeletVersionNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeletVersionNodeDataComponent),
      multi: true,
    },
  ],
})
export class KubeletVersionNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _clusterType: ClusterType;

  readonly Controls = Controls;

  @Input() selected: string;

  versions: string[] = [];

  get versionHeadline(): string {
    return Cluster.getVersionHeadline(this._clusterType, true);
  }

  constructor(
    private readonly _clusterDataService: ClusterDataService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService,
    private readonly _builder: FormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this._clusterType = this._clusterDataService.clusterType;
    this.selected = this._nodeDataService.nodeData.spec.versions.kubelet;

    this.form = this._builder.group({
      [Controls.Kubelet]: this._builder.control(this.selected, Validators.required),
    });

    this._datacenterService
      .getDatacenter(this._clusterDataService.cluster.spec.cloud.dc)
      .pipe(
        switchMap(_ =>
          this._clusterService.nodeUpgrades(
            this._clusterDataService.cluster.spec.version,
            this._clusterDataService.clusterType
          )
        )
      )
      .pipe(first())
      .subscribe(this._setDefaultVersion.bind(this));

    this.form
      .get(Controls.Kubelet)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(version => (this._nodeDataService.nodeData = this._getNodeDataVersionInfo(version)));
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _setDefaultVersion(upgrades: MasterVersion[]): void {
    this.versions = upgrades.map(upgrade => upgrade.version);
    const clusterVersion = this._clusterDataService.cluster.spec.version;

    // First try to pre-select value that was passed to the component
    if (this.versions.includes(this.selected)) {
      this.form.get(Controls.Kubelet).setValue(this.selected);
      return;
    }

    // Then, try to use cluster version from the provided cluster entity
    if (this.versions.includes(clusterVersion)) {
      this.form.get(Controls.Kubelet).setValue(clusterVersion);
      return;
    }

    // As a fallback simply use the newest version available
    this.form.get(Controls.Kubelet).setValue(this.versions.pop());
  }

  private _getNodeDataVersionInfo(version: string): NodeData {
    return {
      spec: {
        versions: {
          kubelet: version,
        },
      } as NodeSpec,
    } as NodeData;
  }
}
