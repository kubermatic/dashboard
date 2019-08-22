import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DatacenterService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeOpenstackCluster} from '../../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {DatacenterMockService} from '../../../testing/services/datacenter-mock.service';
import {OpenstackOptionsComponent} from './openstack-options.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('OpenstackOptionsComponent', () => {
  let fixture: ComponentFixture<OpenstackOptionsComponent>;
  let component: OpenstackOptionsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            OpenstackOptionsComponent,
          ],
          providers: [NodeDataService, WizardService, {provide: DatacenterService, useClass: DatacenterMockService}],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackOptionsComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeOpenstackCluster().spec.cloud;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the vshpere options cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should have valid form when initializing', () => {
    expect(component.osOptionsForm.valid).toBeTruthy();
  });

  it('should call getOsOptionsData method', () => {
    component.osOptionsForm.controls.image.patchValue('test-image');
    fixture.detectChanges();
    expect(component.getOsOptionsData()).toEqual({
      spec: {openstack: {flavor: 'm1.small', image: 'test-image', useFloatingIP: false, tags: {}, diskSize: undefined}},
      valid: true
    });
  });
});
