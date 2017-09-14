import {Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'kubermatic-provider-cluster',
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.scss']
})
export class ProviderClusterComponent implements OnInit {

  @Input() provider: string;

  constructor() { }

  ngOnInit() {
  }

}
