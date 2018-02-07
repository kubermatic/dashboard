import { SharedModule } from './../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { MatDialog } from '@angular/material';
import { SshKeyListComponent } from './ssh-key-list.component';
import { SshKeyItemComponent } from './ssh-key-item/ssh-key-item.component';
import { SSHKeysFake } from '../../testing/fake-data/sshkey.fake';
import { ApiService } from '../../core/services/api/api.service';
import { ApiMockService } from '../../testing/services/api-mock.service';

const modules: any[] = [
    BrowserModule,
    RouterTestingModule,
    BrowserAnimationsModule,
    SharedModule
];

describe('SshKeyListComponent', () => {
    let fixture: ComponentFixture<SshKeyListComponent>;
    let component: SshKeyListComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SshKeyListComponent,
                SshKeyItemComponent
            ],
            providers: [
                { provide: ApiService, useClass: ApiMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SshKeyListComponent);
        component = fixture.componentInstance;
    });

    it('should create the sshkey list cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should render sshkey items', fakeAsync(() => {
        fixture.detectChanges();
        component.sshKeys = SSHKeysFake;

        tick();
        fixture.detectChanges();

       const deItems = fixture.debugElement.queryAll(By.css('.sshkey-item'));
       expect(deItems.length).toBe(component.sshKeys.length);
    }));

    it('should delete sshkey', () => {
        fixture.detectChanges();
        component.sshKeys = SSHKeysFake;
        const initialLength = component.sshKeys.length;
        const deletedItem = component.sshKeys[0];

        component.deleteSSHKey(deletedItem);
        const foundItem = component.sshKeys.find(item => item === deletedItem);
        expect(component.sshKeys.length).toBe(initialLength - 1, 'should delete item from the array');
        expect(foundItem).toBeUndefined('should not find deleted item in the array');
    });

    it('should render sshkeys when they are', () => {
        fixture.detectChanges();
        let sshKeyListDe = fixture.debugElement.query(By.css('.sshkey-list'));

        expect(sshKeyListDe).toBeNull('should not render sshkey list if it is not obtained');

        component.sshKeys = SSHKeysFake;
        fixture.detectChanges();
        sshKeyListDe = fixture.debugElement.query(By.css('.sshkey-list'));

        expect(sshKeyListDe).not.toBeNull('should render sshkey list if it is');
    });
});
