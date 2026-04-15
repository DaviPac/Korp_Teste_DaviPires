import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { AiChatService, ChatMessage, AiResponse } from '../services/ai-chat.service';
import { ProdutoService } from '../services/produto.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Produto } from '../services/produto.service';
import { ItemNota } from '../services/nota.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatLabel, MatIconModule, MatInputModule, MatButtonModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements OnInit {
  isOpen = false;
  userInput = '';
  isLoading = false;
  messages: ChatMessage[] = [];
  pendingOperation: AiResponse | null = null;
  idempotencyKey: string | null = null;

  produtos: Produto[] = [];

  produtoForm: FormGroup;
  notaForm: FormGroup;

  get itens() {
    return this.notaForm.get('itens') as FormArray;
  }

  constructor(
    private aiService: AiChatService, 
    private fb: FormBuilder,
    private produtoService: ProdutoService
  ) {
    this.notaForm = this.fb.group({
      itens: this.fb.array([])
    });
    this.produtoForm = this.fb.group({
      codigo:    ['', Validators.required],
      descricao: ['', Validators.required],
      saldo:     [0,  Validators.required],
    });
  }

  ngOnInit() {
    this.produtoService.listar().subscribe({
      next: (produtos) => this.produtos = produtos,
      error: (err) => console.error('Erro ao carregar produtos', err)
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  adicionarItemNota() {
    this.itens.push(this.fb.group({
      codigo: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
    }));
  }

  removerItemNota(index: number) {
    this.itens.removeAt(index);
  }
  // -----------------------------------------------

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    this.messages.push({ sender: 'user', text: this.userInput });
    const texto = this.userInput;
    this.userInput = '';
    this.isLoading = true;
    this.pendingOperation = null;

    this.aiService.sendMessageToAi(texto).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.messages.push({ sender: 'ai', text: response.mensagem });

        if (response.operacao !== 'desconhecido') {
          this.pendingOperation = response;

          if (response.operacao === 'cadastrar_produto' && response.produto) {
            this.produtoForm.patchValue(response.produto);
          }

          if (response.operacao === 'criar_nota' && response.nota?.itens) {
            this.itens.clear();
            this.idempotencyKey = crypto.randomUUID();
            response.nota.itens.forEach((item: ItemNota) => {
              this.itens.push(this.fb.group({
                codigo:     [item.codigo, Validators.required],
                quantidade: [item.quantidade, [Validators.required, Validators.min(1)]],
              }));
            });
            
            if (this.itens.length === 0) {
               this.adicionarItemNota();
            }
          }
        }
      },
      error: () => {
        this.isLoading = false;
        this.messages.push({ sender: 'ai', text: 'Desculpe, ocorreu um erro.' });
      }
    });
  }

  confirmOperation() {
    if (!this.pendingOperation) return;

    const operacao = this.pendingOperation.operacao;
    const payload = operacao === 'cadastrar_produto'
      ? this.produtoForm.value
      : this.notaForm.value;

    this.isLoading = true;

    this.aiService.executeOperation(operacao, payload, this.idempotencyKey ?? undefined)
      .subscribe(ok => {
        this.isLoading = false;
        this.messages.push({
          sender: 'ai',
          text: ok ? 'Operação realizada com sucesso!' : 'Erro ao executar a operação.'
        });
        this.pendingOperation = null;
        this.idempotencyKey = null;
      });
  }

  cancelOperation() {
    this.pendingOperation = null;
    this.idempotencyKey = null;
    this.messages.push({ sender: 'ai', text: 'Operação cancelada. Como mais posso ajudar?' });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}