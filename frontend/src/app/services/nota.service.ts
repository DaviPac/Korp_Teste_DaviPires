import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ItemNota {
  codigo: string;
  quantidade: number;
}

export interface Nota {
  id?: number;
  numero?: number;
  status?: string;
  itens: ItemNota[];
}

@Injectable({ providedIn: 'root' })
export class NotaService {
  private url = 'http://localhost:8082';

  constructor(private http: HttpClient) {}

  listar(): Observable<Nota[]> {
    return this.http.get<Nota[]>(`${this.url}/notas`);
  }

  criar(nota: Nota, idempotencyKey: string): Observable<Nota> {
    return this.http.post<Nota>(
      `${this.url}/notas`,
      nota,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
  }

  imprimir(id: number): Observable<any> {
    return this.http.post(`${this.url}/notas/${id}/imprimir`, {});
  }
}