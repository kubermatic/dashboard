import { NgRedux } from '@angular-redux/store';
import { BringYourOwnCloudSpec } from 'app/shared/entity/cloud/BringYourOwnCloudSpec';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { Component, OnInit } from '@angular/core';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-bringyourown',
  templateUrl: './bringyourown.component.html',
  styleUrls: ['./bringyourown.component.scss']
})
export class BringyourownClusterComponent implements OnInit {

  constructor(private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    const byoCloudSpec = new BringYourOwnCloudSpec();
    const ruduxStore = this.ngRedux.getState();
    const wizard = ruduxStore.wizard;
    const region = wizard.setDatacenterForm.datacenter.metadata.name;

    WizardActions.setCloudSpec(
      new CloudSpec(region, null, null, byoCloudSpec, null, null)
    );

    setTimeout(() => {
      WizardActions.nextStep();
    }, 0);
  }

}
