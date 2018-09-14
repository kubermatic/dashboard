import { NgModule } from '@angular/core';
import { SSHKeyComponent } from './sshkey.component';
import { SSHKeyItemComponent } from './sshkey-item/sshkey-item.component';
import { SharedModule } from '../shared/shared.module';
import { MatTabsModule } from '@angular/material';
import { SSHKeyRoutingModule } from './sshkey-routing.module';
import { SSHKeyDeleteConfirmationComponent } from './sshkey-delete-confirmation/sshkey-delete-confirmation.component';

const components: any[] = [
  SSHKeyComponent,
  SSHKeyItemComponent,
  SSHKeyDeleteConfirmationComponent
];

@NgModule({
  imports: [
    SharedModule,
    MatTabsModule,
    SSHKeyRoutingModule
  ],
  declarations: [
    ...components
  ],
  exports: [
    ...components
  ],
  entryComponents: [SSHKeyDeleteConfirmationComponent]
})
export class SSHKeyModule {
}
