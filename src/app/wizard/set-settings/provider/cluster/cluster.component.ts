import { Observable } from 'rxjs/Observable';
import { select } from '@angular-redux/store';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { AWSClusterComponent } from './aws/aws.component';
import { DigitaloceanClusterComponent } from './digitalocean/digitalocean.component';
import { OpenstackClusterComponent } from './openstack/openstack.component';

@Component({
  selector: 'kubermatic-provider-cluster',
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.scss']
})
export class ProviderClusterComponent implements OnInit, OnDestroy {

  private subscription: Subscription;

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public provider: string;

  constructor() { }

  ngOnInit() {
    this.subscription = this.provider$.subscribe((provider: string) => {
        provider && (this.provider = provider);
      });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
