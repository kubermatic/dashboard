import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'kubermatic-navigation-buttons',
  templateUrl: './navigation-buttons.component.html',
  styleUrls: ['./navigation-buttons.component.scss']
})
export class NavigationButtonsComponent implements OnInit {

  @Input() step: number;
  @Output() syncStep = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  public stepBack() {
    this.syncStep.emit(this.step - 1);
  }

  public stepForward() {
    this.syncStep.emit(this.step + 1);
  }
}
