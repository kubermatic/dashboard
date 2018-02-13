import { NodeProvider } from './../../shared/model/NodeProviderConstants';
import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { DatacenterService } from 'app/core/services';
import { select, NgRedux } from '@angular-redux/store';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { FormGroup } from '@angular/forms';
import {Wizard} from "../../redux/reducers/wizard";

@Component({
  selector: 'kubermatic-navigation-buttons',
  templateUrl: './navigation-buttons.component.html',
  styleUrls: ['./navigation-buttons.component.scss']
})
export class NavigationButtonsComponent implements OnInit, OnDestroy {

  public nextStep: boolean;
  private subscriptions: Subscription[] = [];
  public supportedNodeProviders: string[] = NodeProvider.Supported;
  public datacenters: { [key: string]: DataCenterEntity[] } = {};

  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;

  @select(['wizard', 'valid']) valid$: Observable<boolean[]>;

  constructor(private ngRedux: NgRedux<any>,
              private dcService: DatacenterService) { }

  public ngOnInit(): void {
    const sub = this.step$.subscribe(step => {
      this.step = step;
      this.nextStep = this.canGotoStep();
    });
    this.subscriptions.push(sub);

    const sub2 = this.valid$.subscribe(valid => {
      this.nextStep = this.canGotoStep();
    });
    this.subscriptions.push(sub2);

    const sub3 = this.getDatacenters();
    this.subscriptions.push(sub3);
  }

  public getDatacenters(): Subscription {
    return this.dcService.getDataCenters().subscribe(result => {
      result.forEach(elem => {
        if (!this.datacenters.hasOwnProperty(elem.spec.provider)) {
          this.datacenters[elem.spec.provider] = [];
        }

        this.datacenters[elem.spec.provider].push(elem);
      });
    });
  }

  public canGotoStep(): boolean {
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

  public stepBack(): void {
    const reduxStore = this.ngRedux.getState();
    const provider = reduxStore.wizard.setProviderForm.provider;

    if (this.step === 4 && provider && provider === 'bringyourown') {
      if (this.datacenters[provider].length === 1) {
        WizardActions.goToStep(1);
      } else {
        WizardActions.goToStep(2);
      }
      return;
    }

    if (this.step === 3 && this.datacenters[provider].length === 1
        && this.supportedNodeProviders.length === 1) {
      WizardActions.goToStep(0);
      return;
    }

    if (this.step === 3 && this.datacenters[provider].length === 1) {
      WizardActions.goToStep(1);
      return;
    }

    if (this.step === 2 && this.supportedNodeProviders.length === 1) {
      WizardActions.goToStep(0);
      return;
    }

    WizardActions.prevStep();
  }

  public stepForward(): void {
    WizardActions.checkValidation();

    const reduxStore = this.ngRedux.getState();
    const isChecked = reduxStore.wizard.isCheckedForm;

    if (!isChecked) {
      WizardActions.nextStep();
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
