import { SharedModule } from '../../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture, inject, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { NodeComponent } from './node.component';
import { MatDialog } from '@angular/material';
import { nodesFake } from '../../../testing/fake-data/node.fake';

const modules: any[] = [
    BrowserModule,
    BrowserAnimationsModule,
    SlimLoadingBarModule.forRoot(),
    SharedModule
];

describe('NodeComponent', () => {
    let fixture: ComponentFixture<NodeComponent>;
    let component: NodeComponent;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                NodeComponent
            ],
            providers: [
                MatDialog
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NodeComponent);
        component = fixture.componentInstance;
    });

    it('should create the cluster details cmp', async(() => {
        expect(component).toBeTruthy();
    }));

    it('should hide remove button', () => {
        component.nodes = nodesFake;
        fixture.detectChanges();

        const deRemoveButtons = fixture.debugElement.queryAll(By.css('.km-btn-remove-node-wrapper'));

        expect(deRemoveButtons[0]).not.toBeNull();
        expect(deRemoveButtons.length).toBe(1, 'should display only one remove button');
    });

    it('should return correct css-classes', () => {
        const green = 'fa fa-circle green';
        const orange = 'fa fa-spin fa-circle-o-notch orange';

        const nodes = nodesFake;

        expect(component.getNodeHealth(nodes[0])).toBe(green, 'should return classes for green icon');
        expect(component.getNodeHealth(nodes[1])).toBe(orange, 'should return classes for orange icon');
    });
});
