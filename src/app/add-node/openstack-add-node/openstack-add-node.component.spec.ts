import { InputValidationService } from 'app/core/services';
import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { AddNodeFormComponent } from './../add-node-form/add-node-form.component';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { MockNgRedux } from '@angular-redux/store/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { OpenstackAddNodeComponent } from './openstack-add-node.component';

const modules: any[] = [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    ReactiveFormsModule,
    NgReduxTestingModule
];

function setMockNgRedux(nodeForm: any): void {
    const nodeFormStub = MockNgRedux.getSelectorStub(['wizard', 'nodeForm']);
    nodeFormStub.next(nodeForm);
}

function completeRedux() {
    const nodeFormStub = MockNgRedux.getSelectorStub(['wizard', 'nodeForm']);
    nodeFormStub.complete();
}

describe('OpenstackAddNodeComponent', () => {
    let fixture: ComponentFixture<OpenstackAddNodeComponent>;
    let component: OpenstackAddNodeComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                OpenstackAddNodeComponent,
                AddNodeFormComponent
            ],
            providers: [
                InputValidationService
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        MockNgRedux.reset();
        fixture = TestBed.createComponent(OpenstackAddNodeComponent);
        component = fixture.componentInstance;
    });

    it('should create the add node cmp', () => {
        expect(component).toBeTruthy();
    });

    it('form invalid after creating', () => {
        fixture.detectChanges();

        expect(component.osNodeForm.valid).toBeFalsy();
    });

    it('node count field validity', () => {
        fixture.detectChanges();

        let errors = {};
        const name = component.osNodeForm.controls['node_count'];
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
    });
});
