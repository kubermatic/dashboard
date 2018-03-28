import { SharedModule } from '../../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material';
import { nodesFake } from '../../../testing/fake-data/node.fake';
import { NodeListComponent } from './node-list.component';
import { clusterFake1 } from '../../../testing/fake-data/cluster.fake';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('NodeComponent', () => {
  let fixture: ComponentFixture<NodeListComponent>;
  let component: NodeListComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        NodeListComponent
      ],
      providers: [
        MatDialog
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeListComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster details cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should hide remove button', () => {
    component.nodes = nodesFake;
    component.cluster = clusterFake1;
    fixture.detectChanges();

    const deRemoveButtons = fixture.debugElement.queryAll(By.css('.km-btn-remove-node-wrapper'));

    expect(deRemoveButtons[0]).not.toBeNull();
    expect(deRemoveButtons.length).toBe(2, 'should display 2 remove button 2');
  });

  it('should return correct css-classes', () => {
    const green = 'fa fa-circle green';
    const orange = 'fa fa-spin fa-circle-o-notch orange';

    const nodes = nodesFake;

    expect(component.getNodeHealth(nodes[0])).toEqual({
      color: green,
      status: 'Running'
    }, 'should return classes for green icon');
    expect(component.getNodeHealth(nodes[1])).toEqual({
      color: orange,
      status: 'Pending'
    }, 'should return classes for orange icon');
  });
});
