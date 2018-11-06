import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { SSHKeyDeleteConfirmationComponent } from './sshkey-delete-confirmation/sshkey-delete-confirmation.component';
import { SSHKeyItemComponent } from './sshkey-item/sshkey-item.component';
import { SSHKeyRoutingModule } from './sshkey-routing.module';
import { SSHKeyComponent } from './sshkey.component';

const components: any[] = [
  SSHKeyComponent,
  SSHKeyItemComponent,
  SSHKeyDeleteConfirmationComponent,
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
  entryComponents: [SSHKeyDeleteConfirmationComponent],
})
export class SSHKeyModule {
}
