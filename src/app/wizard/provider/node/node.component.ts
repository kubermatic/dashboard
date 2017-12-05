import { Observable } from 'rxjs/Rx';
import { select } from '@angular-redux/store';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-provider-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class ProviderNodeComponent implements OnInit, OnDestroy {

  private subscription: Subscription;  

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  constructor() { }

  ngOnInit() { 
    this.subscription = this.provider$.subscribe(provider => {
      provider && (this.provider = provider);
    });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
