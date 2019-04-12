import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {SSHKeyRoutingModule} from './sshkey-routing.module';
import {SSHKeyComponent} from './sshkey.component';

const components: any[] = [
  SSHKeyComponent,
];

@NgModule({
  imports: [
    SharedModule,
    SSHKeyRoutingModule,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
  entryComponents: [],
})
export class SSHKeyModule {
}
