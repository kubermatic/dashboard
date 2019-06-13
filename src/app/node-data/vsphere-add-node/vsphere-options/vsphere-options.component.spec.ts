import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DatacenterService} from '../../../core/services/datacenter/datacenter.service';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {WizardService} from '../../../core/services/wizard/wizard.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeVSphereCluster} from '../../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {DatacenterMockService} from '../../../testing/services/datacenter-mock.service';
import {VSphereOptionsComponent} from './vsphere-options.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
];

describe('VSphereOptionsComponent', () => {
  let fixture: ComponentFixture<VSphereOptionsComponent>;
  let component: VSphereOptionsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            VSphereOptionsComponent,
          ],
          providers: [NodeDataService, WizardService, {provide: DatacenterService, useClass: DatacenterMockService}],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereOptionsComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeVSphereCluster().spec.cloud;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the vshpere options cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should have valid form when initializing', () => {
    expect(component.vsphereOptionsForm.valid).toBeTruthy();
  });

  it('should call getVSphereOptionsData method', () => {
    component.vsphereOptionsForm.controls.template.patchValue('test-template');
    fixture.detectChanges();
    expect(component.getVSphereOptionsData())
        .toEqual({spec: {vsphere: {cpus: 1, memory: 512, template: 'test-template', diskSizeGB: 256}}, valid: true});
  });
});
