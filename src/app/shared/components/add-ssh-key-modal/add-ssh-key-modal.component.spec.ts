import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MatDialogModule, MatFormFieldModule, MatToolbarModule, ErrorStateMatcher, ShowOnDirtyErrorStateMatcher, MatInputModule } from '@angular/material';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick, inject } from '@angular/core/testing';
import { RouterTestingModule, RouterStub } from './../../../testing/router-stubs';
import { click } from './../../../testing/utils/click-handler';
import { DebugElement } from '@angular/core';

import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { LocalStorageService } from './../../../core/services/local-storage/local-storage.service';
import { InputValidationService, ApiService } from '../../../core/services/index';
import { AddSshKeyModalComponent } from './add-ssh-key-modal.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

const modules: any[] = [
    BrowserModule,
    BrowserAnimationsModule,
    RouterTestingModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatInputModule
];

describe('AddSshKeyModalComponent', () => {
    let fixture: ComponentFixture<AddSshKeyModalComponent>;
    let component: AddSshKeyModalComponent;
    let apiService: ApiService;
    let dialogRef: MatDialogRef<AddSshKeyModalComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                AddSshKeyModalComponent
            ],
            providers: [
                InputValidationService,
                { provide: MatDialogRef, useClass: MatDialogRefMock },
                { provide: ApiService, useClass: ApiMockService },
                { provide: Router, useClass: RouterStub }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddSshKeyModalComponent);
        component = fixture.componentInstance;

        apiService = fixture.debugElement.injector.get(ApiService);
        dialogRef = fixture.debugElement.injector.get(MatDialogRef);
    });

    it('should create the add node modal cmp', async(() => {
        expect(component).toBeTruthy();
    }));

    it('form invalid when empty', () => {
        fixture.detectChanges();

        expect(component.addSSHKeyForm.valid).toBeFalsy();
    });

    it('name field validity', () => {
        fixture.detectChanges();

        let errors = {};
        const name = component.addSSHKeyForm.controls['name'];
        errors = name.errors || {};
        expect(errors['required']).toBeTruthy();

        name.setValue('test');
        errors = name.errors || {};
        expect(errors['required']).toBeFalsy();
    });

    it('submitting a form calls addSSHKey method and closes dialog', fakeAsync(() => {
        fixture.detectChanges();

        expect(component.addSSHKeyForm.valid).toBeFalsy();
        component.addSSHKeyForm.controls['name'].setValue('testname');
        component.addSSHKeyForm.controls['key'].setValue('testkey');
        expect(component.addSSHKeyForm.valid).toBeTruthy();

        const spyDialogRefClose = spyOn(dialogRef, 'close');
        const spyAddShhKey = spyOn(apiService, 'addSSHKey').and.returnValue(Observable.of(null));
        component.addSSHKey();
        tick();
        fixture.detectChanges();

        expect(spyAddShhKey.and.callThrough()).toHaveBeenCalledTimes(1);
        expect(spyDialogRefClose.and.callThrough()).toHaveBeenCalledTimes(1);
      }));
});
