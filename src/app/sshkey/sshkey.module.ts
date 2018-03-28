import { NgModule } from '@angular/core';

import { SshkeyRoutingModule } from 'app/sshkey/sshkey-routing.module';
import { SharedModule } from 'app/shared/shared.module';

import { SshKeyListComponent } from 'app/sshkey/ssh-key-list/ssh-key-list.component';
import { SshkeyComponent } from './sshkey.component';
import { SshKeyItemComponent } from './ssh-key-list/ssh-key-item/ssh-key-item.component';


const components: any[] = [
  SshkeyComponent,
  SshKeyListComponent,
  SshKeyItemComponent
];

@NgModule({
  imports: [
    SharedModule,
    SshkeyRoutingModule
  ],
  declarations: [
    ...components
  ],
  exports: [
    ...components
  ]
})
export class SshkeyModule {
}
