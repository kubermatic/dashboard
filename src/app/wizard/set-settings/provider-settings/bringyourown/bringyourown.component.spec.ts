import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BringyourownClusterSettingsComponent } from './bringyourown.component';
import { SharedModule } from '../../../../shared/shared.module';

describe('BringyourownClusterSettingsComponent', () => {
  let fixture: ComponentFixture<BringyourownClusterSettingsComponent>;
  let component: BringyourownClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule
      ],
      declarations: [
        BringyourownClusterSettingsComponent
      ],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BringyourownClusterSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the BYO cluster cmp', () => {
    expect(component).toBeTruthy();
  });
});
