import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterNameComponent } from './cluster-name.component';

describe('ClusterNameComponent', () => {
  let component: ClusterNameComponent;
  let fixture: ComponentFixture<ClusterNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClusterNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
