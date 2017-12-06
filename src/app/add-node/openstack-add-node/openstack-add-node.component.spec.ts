import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenstackAddNodeComponent } from './openstack-add-node.component';

describe('OpenstackAddNodeComponent', () => {
  let component: OpenstackAddNodeComponent;
  let fixture: ComponentFixture<OpenstackAddNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenstackAddNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackAddNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
