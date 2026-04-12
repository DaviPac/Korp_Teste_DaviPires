import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaNotaComponent } from './nova-nota.component';

describe('NovaNota', () => {
  let component: NovaNotaComponent;
  let fixture: ComponentFixture<NovaNotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovaNotaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovaNotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
