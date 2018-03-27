import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RevokeAdminTokenComponent } from './revoke-admin-token.component';
import { MatDialogRef } from '@angular/material';
import { MatDialogRefMock } from '../../../../testing/services/mat-dialog-ref-mock';
import { SharedModule } from '../../../../shared/shared.module';
import { ApiService } from '../../../../core/services/api/api.service';
import { ApiMockService } from '../../../../testing/services/api-mock.service';

const modules: any[] = [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule
];

describe('RevokeAdminTokenComponent', () => {
    let fixture: ComponentFixture<RevokeAdminTokenComponent>;
    let component: RevokeAdminTokenComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                RevokeAdminTokenComponent
            ],
            providers: [
                { provide: ApiService, useClass: ApiMockService },
                { provide: MatDialogRef, useClass: MatDialogRefMock }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RevokeAdminTokenComponent);
        component = fixture.componentInstance;
    });

    it('should create the revoke admin token cmp', () => {
        expect(component).toBeTruthy();
    });
});
