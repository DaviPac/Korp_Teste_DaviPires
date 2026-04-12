import { Routes } from '@angular/router';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { NotasComponent } from './pages/notas/notas.component';
import { NovaNotaComponent } from './pages/nova-nota/nova-nota.component';

export const routes: Routes = [
  { path: '', redirectTo: 'produtos', pathMatch: 'full' },
  { path: 'produtos', component: ProdutosComponent },
  { path: 'notas', component: NotasComponent },
  { path: 'notas/nova', component: NovaNotaComponent },
];