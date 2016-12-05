/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { KubermaticComponent } from './kubermatic.component';

describe('KubermaticComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        KubermaticComponent
      ],
    });
  });

  it('should create the app', async(() => {
    let fixture = TestBed.createComponent(KubermaticComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'kubermatic works!'`, async(() => {
    let fixture = TestBed.createComponent(KubermaticComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('kubermatic works!');
  }));

  it('should render title in a h1 tag', async(() => {
    let fixture = TestBed.createComponent(KubermaticComponent);
    fixture.detectChanges();
    let compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('kubermatic works!');
  }));
});
