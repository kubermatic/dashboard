import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { select } from '@angular-redux/store/lib/src/decorators/select';
import { WizardActions } from 'app/redux/actions/wizard.actions';

@Component({
  selector: 'kubermatic-progress',
  templateUrl: 'progress.component.html',
  styleUrls: ['progress.component.scss']
})
export class ProgressComponent implements OnInit {

  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;

  constructor() { }

  ngOnInit() { 
    this.step$.subscribe(step => {
      this.step = step;
    });
  }

  public gotoStep(clickStep: number) {
    if (this.step >= clickStep) {
      WizardActions.goToStep(clickStep);
    }
  }

  public getIconClass (iconStep: number) {
    let iconClass = "fa fa-circle-o-notch fa-spin";

    if (this.step > iconStep) {
      iconClass = "fa fa-check";
    } else if (this.step < iconStep) {
      iconClass = "fa fa-times";
    }

    return iconClass;
  }

  public getCurser (curserStep: number) {
    let curser = 'default';

    if (this.step > curserStep) {
      curser = 'pointer';
    }

    return curser;
  }

}
