import { NgModule } from '@angular/core';
import { SSHKeyComponent } from './sshkey.component';
import { SSHKeyItemComponent } from './sshkey-item/sshkey-item.component';
import { SharedModule } from '../shared/shared.module';
import { MatTabsModule } from '@angular/material';
import { SSHKeyRoutingModule } from './sshkey-routing.module';

const components: any[] = [
  SSHKeyComponent,
  SSHKeyItemComponent
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
  entryComponents: []
})
export class SSHKeyModule {
}
