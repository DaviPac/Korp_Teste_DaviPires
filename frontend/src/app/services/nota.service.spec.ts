import { TestBed } from '@angular/core/testing';

import { Nota, NotaService } from './nota.service';

describe('Nota', () => {
  let service: NotaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
