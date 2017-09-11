import { Component, OnInit, Input} from '@angular/core';

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

  constructor() { }

  ngOnInit() {
    console.log(this.clusterSpec);
    console.log(this.nodeSpec);
    console.log(this.sshKeys);
    console.log(this.nodeSpec[this.cloud].size );
  }

}
