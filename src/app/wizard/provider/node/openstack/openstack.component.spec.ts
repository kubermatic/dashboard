import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenstackNodeComponent } from './openstack.component';

describe('OpenstackNodeComponent', () => {
  let component: OpenstackNodeComponent;
  let fixture: ComponentFixture<OpenstackNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenstackNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
