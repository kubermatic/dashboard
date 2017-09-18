import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {

  @Input() cloud: string;
  @Input() region;
  @Input() sshKeys;
  @Input() clusterSpec;
  @Input() cloudSpec;
  @Input() nodeSpec;

  @Output() syncStep = new EventEmitter();

  constructor() { }

  ngOnInit() { }

  public gotoStep(step: number) {
      this.syncStep.emit(step);
  }
}
