import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type RefreshTarget = 'produtos' | 'notas';

@Injectable({ providedIn: 'root' })
export class RefreshService {
  private refresh$ = new Subject<RefreshTarget>();

  onRefresh$ = this.refresh$.asObservable();

  trigger(target: RefreshTarget) {
    this.refresh$.next(target);
  }
}