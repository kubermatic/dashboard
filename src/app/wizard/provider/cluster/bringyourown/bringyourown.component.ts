import { BringYourOwnCloudSpec } from './../../../../shared/entity/cloud/BringYourOwnCloudSpec';
import { WizardActions } from './../../../../redux/actions/wizard.actions';
import { Component, OnInit } from '@angular/core';
import { CloudSpec } from 'app/shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-bringyourown',
  templateUrl: './bringyourown.component.html',
  styleUrls: ['./bringyourown.component.scss']
})
export class BringyourownClusterComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    const byoCloudSpec = new BringYourOwnCloudSpec();

    WizardActions.setCloudSpec(
      new CloudSpec(null, null, null, byoCloudSpec, null, null)
    );

    setTimeout(() => {
      WizardActions.nextStep();
    }, 0);
  }

}
