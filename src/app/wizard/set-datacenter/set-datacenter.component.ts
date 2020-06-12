import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService, WizardService} from '../../core/services';
import {AuditLoggingSettings, ClusterEntity, getClusterProvider} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity, getDatacenterProvider} from '../../shared/entity/datacenter';

@Component({
  selector: 'km-set-datacenter',
  templateUrl: 'set-datacenter.component.html',
  styleUrls: ['set-datacenter.component.scss'],
})
export class SetDatacenterComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  setDatacenterForm: FormGroup;
  datacenters: DataCenterEntity[] = [];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _dcService: DatacenterService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.setDatacenterForm = new FormGroup({
      datacenter: new FormControl(this.cluster.spec.cloud.dc, [Validators.required]),
    });

    // Get all datacenters for the cluster cloud provider
    this._dcService.datacenters.pipe(takeUntil(this._unsubscribe)).subscribe(datacenters => {
      const providerDatacenters: DataCenterEntity[] = [];
      for (const datacenter of datacenters) {
        if (datacenter.seed) {
          continue;
        }
        const provider = getDatacenterProvider(datacenter);
        const clusterProvider = getClusterProvider(this.cluster);
        if (provider === clusterProvider) {
          providerDatacenters.push(datacenter);
        }
      }
      this.datacenters = providerDatacenters;
    });

    this.setDatacenterForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.changeClusterDatacenter();
    });
  }

  changeClusterDatacenter(): void {
    let dc: DataCenterEntity = null;
    for (const datacenter of this.datacenters) {
      if (this.setDatacenterForm.controls.datacenter.value === datacenter.metadata.name) {
        dc = datacenter;

        const usePodSecurityPolicyAdmissionPlugin = dc.spec.enforcePodSecurityPolicy
          ? true
          : this.cluster.spec.usePodSecurityPolicyAdmissionPlugin;
        const auditLogging = dc.spec.enforceAuditLogging ? {enabled: true} : this.cluster.spec.auditLogging;
        this.enforceClusterProperties(auditLogging, usePodSecurityPolicyAdmissionPlugin);
      }
    }
    this._wizardService.changeClusterDatacenter({
      datacenter: dc,
      valid: this.setDatacenterForm.valid,
    });
  }

  getLocationName(datacenter: DataCenterEntity): string {
    if (datacenter.spec.location.includes('(')) {
      const splitted = datacenter.spec.location.replace(')', '').split('(');
      return '<span class="km-country-prefix">' + splitted[0].trim() + '</span><span>' + splitted[1].trim() + '</span>';
    }

    if (datacenter.spec.openstack && datacenter.spec.location.includes(' - ')) {
      const splitted = datacenter.spec.location.split(' - ');
      return '<span class="km-country-prefix">' + splitted[0].trim() + '</span><span>' + splitted[1].trim() + '</span>';
    }

    return datacenter.spec.location.replace('Azure', '');
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  enforceClusterProperties(auditLogging: AuditLoggingSettings, usePodSecurityPolicyAdmissionPlugin: boolean): void {
    this._wizardService.changeClusterSpec({
      name: this.cluster.name,
      type: this.cluster.type,
      labels: this.cluster.labels,
      version: this.cluster.spec.version,
      imagePullSecret: this.cluster.spec.openshift ? this.cluster.spec.openshift.imagePullSecret : '',
      usePodSecurityPolicyAdmissionPlugin,
      usePodNodeSelectorAdmissionPlugin: this.cluster.spec.usePodNodeSelectorAdmissionPlugin,
      auditLogging,
      valid: true,
    });
  }
}
