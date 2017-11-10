import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderClusterComponent } from './cluster.component';

describe('ProviderClusterComponent', () => {
  let component: ProviderClusterComponent;
  let fixture: ComponentFixture<ProviderClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProviderClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
