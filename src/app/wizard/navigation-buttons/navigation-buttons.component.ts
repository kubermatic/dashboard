import { select, NgRedux } from '@angular-redux/store';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import {Component, OnInit, OnDestroy} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-navigation-buttons',
  templateUrl: './navigation-buttons.component.html',
  styleUrls: ['./navigation-buttons.component.scss']
})
export class NavigationButtonsComponent implements OnInit, OnDestroy {

  public nextStep: boolean;
  private subscriptions: Subscription[] = [];

  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;

  @select(['wizard', 'valid']) valid$: Observable<boolean[]>;

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;
  
  constructor(private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    let sub = this.step$.subscribe(step => {
      this.step = step;
      this.nextStep = this.canGotoStep();
    });
    this.subscriptions.push(sub);

    let sub2 = this.valid$.subscribe(valid => {
      this.nextStep = this.canGotoStep();
    });
    this.subscriptions.push(sub2);

    let sub3 = this.provider$.subscribe(provider => {
      provider && (this.provider = provider);
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
                      valid.get('nodeForm')) {
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
    // if (this.step === 4 && this.provider === 'bringyourown') {
    //   WizardActions.goToStep(2);
    // }

    WizardActions.prevStep();
  }

  public stepForward() {
    // if (this.step === 2 && this.provider === 'bringyourown') {
    //   WizardActions.goToStep(4);
    // }

    WizardActions.nextStep();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
