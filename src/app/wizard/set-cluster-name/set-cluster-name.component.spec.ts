import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetClusterNameComponent } from './set-cluster-name.component';

describe('ClusterNameComponent', () => {
  let component: SetClusterNameComponent;
  let fixture: ComponentFixture<SetClusterNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetClusterNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetClusterNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
