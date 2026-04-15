import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subject, filter, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProdutoService, Produto } from '../../services/produto.service';
import { RefreshService } from '../../services/refresh.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatCardModule, MatTableModule, MatChipsModule, MatSnackBarModule,
  ],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss'
})
export class ProdutosComponent implements OnInit, OnDestroy {
  produtos: Produto[] = [];
  colunas = ['codigo', 'descricao', 'saldo'];
  private destroy$ = new Subject<void>();

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private refreshService: RefreshService,
    private snackBar: MatSnackBar,
  ) {
      this.form = fb.group({
      codigo:    ['', Validators.required],
      descricao: ['', Validators.required],
      saldo:     [0,  [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit() {
    this.carregarProdutos();
    this.refreshService.onRefresh$
      .pipe(filter(t => t === 'produtos'), takeUntil(this.destroy$))
      .subscribe(() => this.carregarProdutos());
  }

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