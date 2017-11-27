import { NgModule } from '@angular/core';

import { SshkeyRoutingModule } from 'app/sshkey/sshkey-routing.module';
import { SharedModule } from 'app/shared/shared.module';

import { ListSshKeyComponent } from 'app/sshkey/list-ssh-key/list-ssh-key.component';
import { AddSshKeyComponent } from 'app/sshkey/add-ssh-key/add-ssh-key.component';
import { SshkeyComponent } from './sshkey.component';

const components: any[] = [
    SshkeyComponent,
    ListSshKeyComponent,
    AddSshKeyComponent
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
export class SshkeyModule { }
