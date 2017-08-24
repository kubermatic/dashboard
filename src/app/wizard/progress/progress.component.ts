import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'kubermatic-progress',
  templateUrl: 'progress.component.html',
  styleUrls: ['progress.component.scss']
})
export class ProgressComponent implements OnInit{

  @Input() step: number;
  @Output() syncStep = new EventEmitter();
  public currentStep: number;

  constructor() { }

  ngOnInit() { }


  public gotoStep(clickStep: number) {
    if(this.step >= clickStep) {
      this.currentStep = clickStep;
      this.syncStep.emit(this.currentStep);
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
