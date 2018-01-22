import { Observable } from 'rxjs/Observable';
import { SharedModule } from './../../../shared/shared.module';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { MatDialog } from '@angular/material';
import { SshKeyItemComponent } from './ssh-key-item.component';
import { SSHKeysFake } from '../../../testing/fake-data/sshkey.fake';
import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { click } from '../../../testing/utils/click-handler';

const modules: any[] = [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule
];

describe('SshKeyItemComponent', () => {
    let fixture: ComponentFixture<SshKeyItemComponent>;
    let component: SshKeyItemComponent;
    let apiService: ApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SshKeyItemComponent
            ],
            providers: [
                { provide: ApiService, useClass: ApiMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SshKeyItemComponent);
        component = fixture.componentInstance;

        apiService = fixture.debugElement.injector.get(ApiService);
    });

    it('should create the sshkey item cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should call deleteSSHKey method from the api', fakeAsync(() => {
        component.sshKey = SSHKeysFake[0];
        const spyDeleteSSH = spyOn(apiService, 'deleteSSHKey').and.returnValue(Observable.of(null));
        fixture.detectChanges();

        component.deleteSSHKey();
        tick();
        fixture.detectChanges();

        expect(spyDeleteSSH.and.callThrough()).toHaveBeenCalledTimes(1);
    }));

    it('should have odd css class', () => {
        component.isOdd = true;
        component.sshKey = SSHKeysFake[0];
        fixture.detectChanges();

        const de = fixture.debugElement.query(By.css('.odd'));
        expect(de).not.toBeNull('should set odd class to element');
    });

    it('should show/hide publickey', () => {
        component.sshKey = SSHKeysFake[0];
        fixture.detectChanges();

        let dePublicKey = fixture.debugElement.query(By.css('.publickey-content'));
        expect(dePublicKey).toBeNull('should not show public key before click to the item');

        const deClick = fixture.debugElement.query(By.css('.km-card-list-content-item'));
        click(deClick);
        fixture.detectChanges();

        dePublicKey = fixture.debugElement.query(By.css('.publickey-content'));
        expect(dePublicKey).not.toBeNull('should show public key after click to the item');

        click(deClick);
        fixture.detectChanges();

        dePublicKey = fixture.debugElement.query(By.css('.publickey-content'));
        expect(dePublicKey).toBeNull('should hide public key after second click to the item');
    });
});
