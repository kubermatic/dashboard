import { ApiService } from 'app/core/services/api/api.service';
import { InputValidationService } from 'app/core/services';
import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { AddNodeFormComponent } from './../add-node-form/add-node-form.component';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node.component';
import { ApiMockService } from '../../testing/services/api-mock.service';

const modules: any[] = [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    ReactiveFormsModule,
    NgReduxTestingModule
];

describe('DigitaloceanAddNodeComponent', () => {
    let fixture: ComponentFixture<DigitaloceanAddNodeComponent>;
    let component: DigitaloceanAddNodeComponent;
    let apiSevice: ApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                DigitaloceanAddNodeComponent,
                AddNodeFormComponent
            ],
            providers: [
                InputValidationService,
                { provide: ApiService, useClass: ApiMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DigitaloceanAddNodeComponent);
        component = fixture.componentInstance;

        apiSevice = fixture.debugElement.injector.get(ApiService);
    });

    it('should create the add node cmp', () => {
        expect(component).toBeTruthy();
    });

    it('form invalid after creating', () => {
        fixture.detectChanges();

        expect(component.doNodeForm.valid).toBeFalsy();
    });

    it('node count field validity', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        let errors = {};
        const name = component.doNodeForm.controls['node_count'];
        errors = name.errors || {};
        expect(errors['required']).toBeFalsy();
        expect(errors['min']).toBeFalsy();

        name.setValue(0);
        errors = name.errors || {};
        expect(errors['required']).toBeFalsy();
        expect(errors['min']).toBeTruthy();

        name.setValue('');
        errors = name.errors || {};
        expect(errors['required']).toBeTruthy();
    }));
});
