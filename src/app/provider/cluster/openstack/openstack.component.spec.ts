import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenstackClusterComponent } from './openstack.component';

describe('OpenstackComponent', () => {
  let component: OpenstackClusterComponent;
  let fixture: ComponentFixture<OpenstackClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenstackClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
