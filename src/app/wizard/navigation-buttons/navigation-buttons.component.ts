import { select, NgRedux } from '@angular-redux/store';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'kubermatic-navigation-buttons',
  templateUrl: './navigation-buttons.component.html',
  styleUrls: ['./navigation-buttons.component.scss']
})
export class NavigationButtonsComponent implements OnInit {

  public nextStep: boolean;

  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;

  @select(['wizard', 'valid']) valid$: Observable<boolean[]>;

  constructor(private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    this.step$.subscribe(step => {
      this.step = step;
      this.nextStep = this.canGotoStep();
    });

    this.valid$.subscribe(valid => {
      this.nextStep = this.canGotoStep();
    });
  }

  public canGotoStep() {
    const reduxStore = this.ngRedux.getState();
    const valid = reduxStore.wizard.valid;
    switch (this.step) {
      case 0:
        return valid.get('clusterNameForm');
      case 1:
        return valid.get('setProviderForm');
      case 2:
        return valid.get('setDatacenterForm');
      case 3:
          if (!valid.get('sshKeyForm')) {
            return false;
          } else if ((valid.get('awsClusterForm') || valid.get('digitalOceanClusterForm') || valid.get('openstackClusterForm') ) && 
                      (valid.get('awsNodeForm') || valid.get('digitalOceanNodeForm') || valid.get('openstackNodeForm'))) {
            return true;
          } else {
            return false;
          }
      case 4:
        return true;
      default:
        return false;
    }
  }

  public stepBack() {
    WizardActions.prevStep();
  }

  public stepForward() {
    WizardActions.nextStep();
  }
}
