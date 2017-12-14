import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeClusterComponent } from './upgrade-cluster.component';

describe('UpgradeClusterComponent', () => {
  let component: UpgradeClusterComponent;
  let fixture: ComponentFixture<UpgradeClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpgradeClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
