import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {DatacenterService} from '../../core/services/datacenter/datacenter.service';
import {WizardService} from '../../core/services/wizard/wizard.service';
import {ClusterEntity, getClusterProvider} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity, getDatacenterProvider} from '../../shared/entity/DatacenterEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';

@Component({
  selector: 'kubermatic-set-datacenter',
  templateUrl: 'set-datacenter.component.html',
  styleUrls: ['set-datacenter.component.scss'],
})
export class SetDatacenterComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  setDatacenterForm: FormGroup;
  datacenters: DataCenterEntity[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private dcService: DatacenterService, private wizardService: WizardService) {}

  ngOnInit(): void {
    this.setDatacenterForm = new FormGroup({
      datacenter: new FormControl(this.cluster.spec.cloud.dc, [Validators.required]),
    });

    // Get all datacenters for the cluster cloud provider
    this.subscriptions.push(this.dcService.getDataCenters().subscribe((datacenters) => {
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

        // When clicked openshift display provider options for KubeAdm.
        if (clusterProvider === NodeProvider.OPENSHIFT && provider === NodeProvider.BRINGYOUROWN) {
          providerDatacenters.push(datacenter);
        }
      }

      this.datacenters = providerDatacenters;
    }));

    this.subscriptions.push(this.setDatacenterForm.valueChanges.subscribe((data) => {
      this.changeClusterDatacenter();
    }));
  }

  changeClusterDatacenter(): void {
    let dc: DataCenterEntity = null;
    for (const datacenter of this.datacenters) {
      if (this.setDatacenterForm.controls.datacenter.value === datacenter.metadata.name) {
        dc = datacenter;
      }
    }
    this.wizardService.changeClusterDatacenter({
      datacenter: dc,
      valid: this.setDatacenterForm.valid,
    });
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
