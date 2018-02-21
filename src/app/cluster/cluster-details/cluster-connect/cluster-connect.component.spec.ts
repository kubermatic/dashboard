import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterConnectComponent } from './cluster-connect.component';

describe('ClusterConnectComponent', () => {
  let component: ClusterConnectComponent;
  let fixture: ComponentFixture<ClusterConnectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClusterConnectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
