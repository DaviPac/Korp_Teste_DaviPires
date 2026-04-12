import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

import { ProdutoService, Produto } from '../../services/produto.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
  ],
  templateUrl: './produtos.component.html',
})
export class ProdutosComponent implements OnInit, OnDestroy {
  produtos: Produto[] = [];
  colunas = ['codigo', 'descricao', 'saldo'];
  private destroy$ = new Subject<void>();
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
    codigo:    ['', Validators.required],
    descricao: ['', Validators.required],
    saldo:     [0,  Validators.required],
  });
  }

  // ngOnInit — ciclo de vida usado para carregar dados ao abrir a tela
  ngOnInit() {
    this.carregarProdutos();
  }

  // ngOnDestroy — ciclo de vida usado para cancelar subscriptions e evitar memory leak
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarProdutos() {
    this.produtoService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => this.produtos = dados ?? [],
        error: () => this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 }),
      });
  }

  salvar() {
    if (this.form.invalid) return;

    this.produtoService.criar(this.form.value as Produto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Produto cadastrado!', 'Fechar', { duration: 3000 });
          this.form.reset({ saldo: 0 });
          this.carregarProdutos();
        },
        error: () => this.snackBar.open('Erro ao cadastrar produto', 'Fechar', { duration: 3000 }),
      });
  }
}