import { Observable } from 'rxjs/Rx';
import { select } from '@angular-redux/store';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'kubermatic-provider-cluster',
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.scss']
})
export class ProviderClusterComponent implements OnInit {

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  constructor() { }

  ngOnInit() { 
    this.provider$.subscribe((provider: string) => {
        provider && (this.provider = provider);
      });
  }
}
