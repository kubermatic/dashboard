import { SSHKeysFake } from './../testing/fake-data/sshkey.fake';
import { SshKeyItemComponent } from './ssh-key-list/ssh-key-item/ssh-key-item.component';
import { SharedModule } from './../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { ApiService } from '../core/services/index';
import { SshkeyComponent } from './sshkey.component';
import { MatDialog } from '@angular/material';
import { ApiMockService } from '../testing/services/api-mock.service';
import { SshKeyListComponent } from './ssh-key-list/ssh-key-list.component';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    RouterTestingModule,
    BrowserAnimationsModule,
    SharedModule
];

describe('SshkeyComponent', () => {
    let fixture: ComponentFixture<SshkeyComponent>;
    let component: SshkeyComponent;

    beforeEach(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SshkeyComponent,
                SshKeyListComponent,
                SshKeyItemComponent
            ],
            providers: [
                MatDialog,
                { provide: ApiService, useClass: ApiMockService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SshkeyComponent);
        component = fixture.componentInstance;
    });

    it('should create the sshkey cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should get sshkeys list', fakeAsync(() => {
        const sshkeys = SSHKeysFake;
        fixture.detectChanges();
        tick();

        expect(component.sshKeys).toEqual(sshkeys, 'should be obtained');
    }));
});
