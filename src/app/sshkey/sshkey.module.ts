import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {SSHKeyItemComponent} from './sshkey-item/sshkey-item.component';
import {SSHKeyRoutingModule} from './sshkey-routing.module';
import {SSHKeyComponent} from './sshkey.component';

const components: any[] = [
  SSHKeyComponent,
  SSHKeyItemComponent,
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
