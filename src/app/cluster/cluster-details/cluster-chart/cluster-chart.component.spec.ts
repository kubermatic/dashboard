import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterChartComponent } from './cluster-chart.component';

describe('ClusterChartComponent', () => {
  let component: ClusterChartComponent;
  let fixture: ComponentFixture<ClusterChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClusterChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
