import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalClusterWizardComponent } from './component';

describe('ExternalClusterWizardComponent', () => {
  let component: ExternalClusterWizardComponent;
  let fixture: ComponentFixture<ExternalClusterWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExternalClusterWizardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalClusterWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
