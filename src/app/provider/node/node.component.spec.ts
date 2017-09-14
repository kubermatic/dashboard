import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderNodeComponent } from './node.component';

describe('ProviderNodeComponent', () => {
  let component: ProviderNodeComponent;
  let fixture: ComponentFixture<ProviderNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProviderNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
