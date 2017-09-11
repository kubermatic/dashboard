import { Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {

  @Input() clusterName: string;
  @Input() cloud: string;
  @Input() region;
  @Input() nodeCount: number;
  @Input() nodeSize: string;
  @Input() clusterSpec;
  @Input() nodeSpec;

  constructor() { }

  ngOnInit() {
  }

}
