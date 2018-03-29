import { Observable } from 'rxjs/Observable';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { select } from '@angular-redux/store/lib/src/decorators/select';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-progress',
  templateUrl: 'progress.component.html',
  styleUrls: ['progress.component.scss']
})
export class ProgressComponent implements OnInit, OnDestroy {

  @select(['wizard', 'step']) step$: Observable<number>;
  public step: number;
  private subscription: Subscription;

  constructor() { }

  ngOnInit() {
    this.subscription = this.step$.subscribe(step => {
      this.step = step;
    });
  }

  public gotoStep(clickStep: number): void {
    if (this.step >= clickStep) {
      WizardActions.goToStep(clickStep);
    }
  }

  public getIconClass(iconStep: number): string {
    let iconClass = 'fa fa-circle-o-notch fa-spin';

    if (this.step > iconStep) {
      iconClass = 'fa fa-check';
    } else if (this.step < iconStep) {
      iconClass = '';
    }

    return iconClass;
  }

  public getTitleClass(step: number): string {
    let titleClass = '';

    if (this.step < step) {
      titleClass = 'title-unchecked';
    }
    return titleClass;
  }

  public getCurser(curserStep: number): string {
    let curser = 'default';

    if (this.step > curserStep) {
      curser = 'pointer';
    }

    return curser;
  }

  public ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }
}
