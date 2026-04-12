import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Produto {
  id?: number;
  codigo: string;
  descricao: string;
  saldo: number;
}

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private url = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  listar(): Observable<Produto[]> {
    return this.http.get<Produto[]>(`${this.url}/produtos`);
  }

  criar(produto: Produto): Observable<Produto> {
    return this.http.post<Produto>(`${this.url}/produtos`, produto);
  }
}