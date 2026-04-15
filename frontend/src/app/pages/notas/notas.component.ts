import { Component, OnInit, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { NotaService, Nota } from '../../services/nota.service';
import { RefreshService } from '../../services/refresh.service';

@Pipe({ name: 'abertas', standalone: true })
export class AbertasPipe implements PipeTransform {
  transform(notas: Nota[]): number { return notas.filter(n => n.status === 'Aberta').length; }
}

@Pipe({ name: 'fechadas', standalone: true })
export class FechadasPipe implements PipeTransform {
  transform(notas: Nota[]): number { return notas.filter(n => n.status === 'Fechada').length; }
}

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatCardModule, MatTableModule,
    MatChipsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    AbertasPipe, FechadasPipe,
  ],
  templateUrl: './notas.component.html',
  styleUrl: './notas.component.scss'
})
export class NotasComponent implements OnInit, OnDestroy {
  notas: Nota[] = [];
  colunas = ['numero', 'itens', 'status', 'acoes'];
  imprimindo: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private notaService: NotaService,
    private refreshService: RefreshService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.carregarNotas();
    this.refreshService.onRefresh$
      .pipe(filter(t => t === 'notas'), takeUntil(this.destroy$))
      .subscribe(() => this.carregarNotas());
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

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
          this.snackBar.open(`Nota #${nota.numero} impressa!`, 'Fechar', { duration: 3000 });
          this.imprimindo = null;
          this.carregarNotas();
        },
        error: (err) => {
          this.snackBar.open(err.error?.error ?? 'Erro ao imprimir', 'Fechar', { duration: 4000 });
          this.imprimindo = null;
        },
      });
  }
}