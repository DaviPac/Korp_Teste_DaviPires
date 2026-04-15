import { HttpClient } from "@angular/common/http";
import { Nota, NotaService } from "./nota.service";
import { Produto, ProdutoService } from "./produto.service";
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RefreshService } from "./refresh.service";

export type TipoOperacao = 'cadastrar_produto' | 'criar_nota' | 'desconhecido'

export interface AiResponse {
  operacao: TipoOperacao;
  produto: Produto;
  nota: Nota;
  mensagem: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {

  constructor(
    private http: HttpClient,
    private produtoService: ProdutoService,
    private notaService: NotaService,
    private refreshService: RefreshService
  ) {}
  
  private url = 'http://localhost:8083';
  sendMessageToAi(message: string): Observable<AiResponse> {
    return this.http.post<AiResponse>(
      `${this.url}/interpretar`,
      { mensagem: message }
    );
  }

  executeOperation(operacao: TipoOperacao, payload: any, idempotencyKey?: string): Observable<boolean> {
    switch (operacao) {
      case 'cadastrar_produto':
        return this.produtoService.criar(payload).pipe(
          map(() => {
            this.refreshService.trigger('produtos');  // ← adiciona
            return true;
          }),
          catchError(err => {
            console.error('Erro ao cadastrar produto:', err);
            return of(false);
          })
        );
      case 'criar_nota':
        return this.notaService.criar(payload, idempotencyKey!).pipe(
          map(() => {
            this.refreshService.trigger('notas');  // ← adiciona
            return true;
          }),
          catchError(err => {
            console.error('Erro ao criar nota:', err);
            return of(false);
          })
        );
      default:
        return of(false);
    }
  }
}