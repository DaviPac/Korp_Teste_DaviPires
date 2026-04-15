import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';

import { NotaService, ItemNota } from '../../services/nota.service';
import { ProdutoService, Produto } from '../../services/produto.service';

@Component({
  selector: 'app-nova-nota',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatSelectModule,
  ],
  templateUrl: './nova-nota.component.html',
})
export class NovaNotaComponent implements OnInit, OnDestroy {
  itens: ItemNota[] = [];
  produtos: Produto[] = [];
  colunas = ['codigo', 'quantidade', 'remover'];
  private destroy$ = new Subject<void>();
  itemForm: ReturnType<FormBuilder['group']>;
  idempotencyKey = crypto.randomUUID();

  constructor(
    private fb: FormBuilder,
    private notaService: NotaService,
    private produtoService: ProdutoService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.itemForm = fb.group({
      codigo: ['', Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() {
    this.produtoService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => this.produtos = dados,
        error: () => this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 })
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  adicionarItem() {
    if (this.itemForm.invalid) return;

    const item = this.itemForm.value as ItemNota;

    const jaExiste = this.itens.find(i => i.codigo === item.codigo);
    if (jaExiste) {
      this.snackBar.open('Produto já adicionado', 'Fechar', { duration: 3000 });
      return;
    }

    this.itens = [...this.itens, item];

    this.itemForm.reset({ quantidade: 1 });
    
    Object.keys(this.itemForm.controls).forEach(key => {
      this.itemForm.get(key)?.setErrors(null);
    });
  }

  removerItem(codigo: string) {
    this.itens = this.itens.filter(i => i.codigo !== codigo);
  }

  salvar() {
    if (this.itens.length === 0) {
      this.snackBar.open('Adicione ao menos um produto', 'Fechar', { duration: 3000 });
      return;
    }

    this.notaService.criar({ itens: this.itens }, this.idempotencyKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Nota criada com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/notas']);
        },
        error: () => this.snackBar.open('Erro ao criar nota', 'Fechar', { duration: 3000 }),
      });
  }
}