import { Observable } from 'rxjs/Rx';
import { select } from '@angular-redux/store';
import {Component, OnInit } from '@angular/core';

@Component({
  selector: 'kubermatic-provider-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class ProviderNodeComponent implements OnInit {

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  constructor() { }

  ngOnInit() { 
    this.provider$.subscribe(provider => {
      provider && (this.provider = provider);
    });
  }
}
