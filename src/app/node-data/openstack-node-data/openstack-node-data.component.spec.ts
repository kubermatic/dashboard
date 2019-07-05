import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';

import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeOpenstackFlavors} from '../../testing/fake-data/addNodeModal.fake';
import {fakeOpenstackCluster} from '../../testing/fake-data/cluster.fake';
import {fakeOpenstackDatacenter} from '../../testing/fake-data/datacenter.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';

import {OpenstackNodeDataComponent} from './openstack-node-data.component';

describe('OpenstackNodeDataComponent', () => {
  let fixture: ComponentFixture<OpenstackNodeDataComponent>;
  let component: OpenstackNodeDataComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getOpenStackFlavorsForWizard', 'getOpenStackFlavors']);
    apiMock.getOpenStackFlavorsForWizard.and.returnValue(asyncData(fakeOpenstackFlavors()));
    apiMock.getOpenStackFlavors.and.returnValue(asyncData(fakeOpenstackFlavors()));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SharedModule,
            ReactiveFormsModule,
            HttpClientModule,
          ],
          declarations: [
            OpenstackNodeDataComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
            {provide: DatacenterService, useClass: DatacenterMockService},
            {provide: ApiService, useValue: apiMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeOpenstackCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('should disable floating ip checkbox when required by datacenter', () => {
    const datacenterService = TestBed.get(DatacenterService);
    const dc = fakeOpenstackDatacenter();
    dc.spec.openstack.enforce_floating_ip = true;
    spyOn(datacenterService, 'getDataCenter').and.returnValue(of(dc));
    spyOn(component, 'isInWizard').and.returnValue(false);

    fixture.detectChanges();
    const tooltipEl = fixture.debugElement.query(By.css('.km-floating-ip-checkbox-info-icon'));
    expect(tooltipEl).not.toBeNull();
    expect(component.osNodeForm.controls.useFloatingIP.disabled).toBeTruthy();
  });

  it('should enable floating ip checkbox when not enforced by datacenter', () => {
    const tooltipEl = fixture.debugElement.query(By.css('.km-floating-ip-checkbox-info-icon'));
    spyOn(component, 'isInWizard').and.returnValue(false);

    fixture.detectChanges();
    expect(tooltipEl).toBeNull();
    expect(component.osNodeForm.controls.useFloatingIP.disabled).toBeFalsy();
  });
});
