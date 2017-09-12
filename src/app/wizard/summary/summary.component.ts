import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {

  @Input() cloud: string;
  @Input() region;
  @Input() nodeCount: number;
  @Input() sshKeys;
  @Input() clusterSpec;
  @Input() nodeSpec;

  @Output() syncStep = new EventEmitter();

  constructor() { }

  ngOnInit() {
    console.log(this.clusterSpec);
    console.log(this.nodeSpec);
    console.log(this.sshKeys);
    console.log(this.nodeSpec[this.cloud].size );
  }


  public gotoStep(step: number) {
      this.syncStep.emit(step);
  }

}
