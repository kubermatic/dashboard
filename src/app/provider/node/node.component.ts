import {Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'kubermatic-provider-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class ProviderNodeComponent implements OnInit {

  @Input() provider: string;

  constructor() { }

  ngOnInit() {
  }

}
