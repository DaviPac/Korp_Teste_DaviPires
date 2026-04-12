import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotaService, Nota } from '../../services/nota.service';

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatSnackBarModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notas.component.html',
})
export class NotasComponent implements OnInit, OnDestroy {
  notas: Nota[] = [];
  colunas = ['numero', 'status', 'acoes'];
  imprimindo: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private notaService: NotaService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.carregarNotas();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarNotas() {
    this.notaService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => this.notas = dados ?? [],
        error: () => this.snackBar.open('Erro ao carregar notas', 'Fechar', { duration: 3000 }),
      });
  }

  imprimir(nota: Nota) {
    if (nota.status !== 'Aberta') return;

    this.imprimindo = nota.id!;

    this.notaService.imprimir(nota.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`Nota ${nota.numero} impressa com sucesso!`, 'Fechar', { duration: 3000 });
          this.imprimindo = null;
          this.carregarNotas();
        },
        error: (err) => {
          const msg = err.error?.error ?? 'Erro ao imprimir nota';
          this.snackBar.open(msg, 'Fechar', { duration: 4000 });
          this.imprimindo = null;
        },
      });
  }
}