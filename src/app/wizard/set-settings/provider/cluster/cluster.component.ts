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

  @ViewChild(AWSClusterComponent)
  private awsClusterComponent: AWSClusterComponent;
  @ViewChild(DigitaloceanClusterComponent)
  private digitalOceanClusterComponent: DigitaloceanClusterComponent;
  @ViewChild(OpenstackClusterComponent)
  private openstackClusterComponent: OpenstackClusterComponent;

  constructor() { }

  ngOnInit() {
    this.subscription = this.provider$.subscribe((provider: string) => {
        provider && (this.provider = provider);
      });
  }

  public showRequiredFields(event: any) {
    const methodName = event.methodName;
    switch (this.provider) {
      case 'aws':
        return this.awsClusterComponent[methodName](event);
      case 'digitalocean':
        return this.digitalOceanClusterComponent[methodName](event);
      case 'openstack':
        return this.openstackClusterComponent[methodName](event);
      default:
        return;
    }
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
