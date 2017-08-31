import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'kubermatic-navigation-buttons',
  templateUrl: './navigation-buttons.component.html',
  styleUrls: ['./navigation-buttons.component.scss']
})
export class NavigationButtonsComponent implements OnInit {

  @Input() step: number;
  @Output() syncStep = new EventEmitter();
  public currentStep: number;

  constructor() { }

  ngOnInit() {
  }

  public stepBack() {
    this.currentStep = (this.step - 1) < 0 ? 0 : (this.step - 1);
    this.syncStep.emit(this.currentStep);
  }

  public stepForward() {
    this.currentStep = (this.step + 1) > 0 ? 0 : (this.step + 1);
    this.syncStep.emit(this.currentStep);
  }
}
