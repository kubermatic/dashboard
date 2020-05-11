import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {first} from 'rxjs/operators';
import {gt, lt} from 'semver';

import {ClusterService} from '../../../core/services';
import {
  ClusterEntity,
  MasterVersion,
} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {ClusterUtils} from '../../../shared/utils/cluster-utils/cluster-utils';
import {ChangeClusterVersionComponent} from '../change-cluster-version/change-cluster-version.component';

@Component({
  selector: 'km-version-picker',
  templateUrl: './version-picker.component.html',
})
export class VersionPickerComponent implements OnInit, OnChanges {
  @Input() datacenter: DataCenterEntity;
  @Input() cluster: ClusterEntity;
  @Input() isClusterRunning = false;
  @Input() upgrades: MasterVersion[] = [];
  versionsList: string[] = [];
  updatesAvailable = false;
  downgradesAvailable = false;
  someUpgradesRestrictedByKubeletVersion = false;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _matDialog: MatDialog,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.processData();
  }

  processData(): void {
    this.versionsList = [];
    this.updatesAvailable = false;
    this.downgradesAvailable = false;
    this.someUpgradesRestrictedByKubeletVersion = false;

    this.upgrades.forEach(upgrade => {
      const isUpgrade = lt(this.cluster.spec.version, upgrade.version);
      const isDowngrade = gt(this.cluster.spec.version, upgrade.version);

      if (upgrade.restrictedByKubeletVersion === true) {
        this.someUpgradesRestrictedByKubeletVersion = isUpgrade;
        return; // Skip all restricted versions.
      }

      this.updatesAvailable = this.updatesAvailable ? true : isUpgrade;
      this.downgradesAvailable = this.downgradesAvailable ? true : isDowngrade;

      if (this.versionsList.indexOf(upgrade.version) < 0) {
        this.versionsList.push(upgrade.version);
      }
    });

    this._changeDetectorRef.detectChanges();
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  isEnabled(): boolean {
    return (
      this.isClusterRunning &&
      (this.updatesAvailable || this.downgradesAvailable)
    );
  }

  changeClusterVersionDialog(): void {
    if (this.isEnabled()) {
      const modal = this._matDialog.open(ChangeClusterVersionComponent);
      modal.componentInstance.cluster = this.cluster;
      modal.componentInstance.datacenter = this.datacenter;
      modal.componentInstance.controlPlaneVersions = this.versionsList;
      modal
        .afterClosed()
        .pipe(first())
        .subscribe(isChanged => {
          if (isChanged) {
            this._clusterService.onClusterUpdate.next();
          }
        });
    }
  }
}
