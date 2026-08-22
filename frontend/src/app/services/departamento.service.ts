import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Departamento {
  id: number;
  Titulo: string;
  Distrito: string;
  Precio_Noche: number;
  Habitaciones: number;
  Banos: number;
  Categoria: string;
  URL_Imagen: string;
  propietarioEmail: string;
  Descripcion?: string;
  Capacidad?: number;
  TienePiscina?: boolean;
  TieneWifi?: boolean;
  AdmiteMascotas?: boolean;
  Activo?: boolean;
  fechaPublicacion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DepartamentoService {
  private readonly STORAGE_KEY = 'departamentosDepaYa';

  private readonly TITULOS_DEMO = new Set([
    'Loft Ejecutivo Prime con Vista al Mar',
    'Departamento Moderno en San Isidro',
    'Departamento Familiar en Barranco',
    'Departamento con Vista al Mar',
    'Loft Ejecutivo Moderno',
    'Casa de Playa Familiar',
  ]);

  private departamentos: Departamento[] = [];

  // ============================================================
  // NUEVO: CONEXIÓN AL BACKEND DE AZURE
  // ============================================================
  private apiUrl = 'https://depayabackend-fzbeg0g5cydsecbm.canadacentral-01.azurewebsites.net/api/Departamentos';

  constructor(private http: HttpClient) {
    this.cargarDepartamentos();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // ============================================================
  // NUEVO: MÉTODOS HTTP PARA CONECTAR CON EL BACKEND
  // ============================================================
  listarDesdeBackend(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  obtenerDesdeBackend(id: number): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  crearEnBackend(departamento: any): Observable<any> {
    return this.http.post(this.apiUrl, departamento, {
      headers: this.getHeaders(),
    });
  }

  actualizarEnBackend(id: number, departamento: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, departamento, {
      headers: this.getHeaders(),
    });
  }

  eliminarEnBackend(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  listarPorPropietarioDesdeBackend(email: string): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.apiUrl}/propietario/${email}`, {
      headers: this.getHeaders(),
    });
  }

  listarActivosDesdeBackend(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.apiUrl}/activos`, {
      headers: this.getHeaders(),
    });
  }

  // ============================================================
  // CÓDIGO ORIGINAL (NO TOCAR) - MANEJO LOCAL CON localStorage
  // ============================================================

  private cargarDepartamentos(): void {
    const datos = localStorage.getItem(this.STORAGE_KEY);

    if (datos) {
      try {
        const lista = JSON.parse(datos);

        if (Array.isArray(lista)) {
          this.departamentos = this.limpiarDepartamentosDemo(lista);
          this.normalizarDepartamentos();
          this.guardar();
          return;
        }
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
      }
    }

    this.departamentos = [];
    this.guardar();
  }

  private limpiarDepartamentosDemo(lista: Departamento[]): Departamento[] {
    return lista.filter((departamento) => {
      const esDemo =
        this.TITULOS_DEMO.has((departamento.Titulo || '').trim()) &&
        (departamento.propietarioEmail || '').trim().toLowerCase() === 'propietario@depaya.com' &&
        !departamento.fechaPublicacion;

      return !esDemo;
    });
  }

  private normalizarDepartamentos(): void {
    this.departamentos = this.departamentos.map((departamento) => ({
      ...departamento,
      Descripcion: departamento.Descripcion ?? '',
      Capacidad: Number(departamento.Capacidad ?? 0),
      TienePiscina: Boolean(departamento.TienePiscina),
      TieneWifi: Boolean(departamento.TieneWifi),
      AdmiteMascotas: Boolean(departamento.AdmiteMascotas),
      Activo: departamento.Activo !== false,
    }));
  }

  private sincronizar(): void {
    const datos = localStorage.getItem(this.STORAGE_KEY);

    if (!datos) {
      this.departamentos = [];
      return;
    }

    try {
      const lista = JSON.parse(datos);

      if (Array.isArray(lista)) {
        this.departamentos = this.limpiarDepartamentosDemo(lista);
        this.normalizarDepartamentos();
      }
    } catch (error) {
      console.error('Error sincronizando departamentos:', error);
    }
  }

  private guardar(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.departamentos));
  }

  // ============================================================
  // MÉTODOS ORIGINALES (NO TOCAR)
  // ============================================================

  getDepartamentos(): Departamento[] {
    this.sincronizar();

    return this.departamentos.map((departamento) => ({
      ...departamento,
    }));
  }

  getDepartamentosActivos(): Departamento[] {
    this.sincronizar();

    return this.departamentos
      .filter((departamento) => departamento.Activo !== false)
      .map((departamento) => ({
        ...departamento,
      }));
  }

  getDepartamentoById(id: number): Departamento | undefined {
    this.sincronizar();

    const departamento = this.departamentos.find((item) => item.id === id);

    return departamento ? { ...departamento } : undefined;
  }

  getDepartamentosPorPropietario(email: string): Departamento[] {
    this.sincronizar();

    const correo = email.trim().toLowerCase();

    return this.departamentos
      .filter((departamento) => departamento.propietarioEmail.trim().toLowerCase() === correo)
      .map((departamento) => ({
        ...departamento,
      }));
  }

  agregarDepartamento(departamento: Departamento): Departamento {
    this.sincronizar();

    const nuevoId =
      this.departamentos.length > 0
        ? Math.max(...this.departamentos.map((item) => item.id)) + 1
        : 1;

    const nuevoDepartamento: Departamento = {
      ...departamento,
      id: nuevoId,
      propietarioEmail: departamento.propietarioEmail.trim().toLowerCase(),
      Descripcion: (departamento.Descripcion || '').trim(),
      Capacidad: Number(departamento.Capacidad ?? 0),
      TienePiscina: Boolean(departamento.TienePiscina),
      TieneWifi: Boolean(departamento.TieneWifi),
      AdmiteMascotas: Boolean(departamento.AdmiteMascotas),
      Activo: departamento.Activo !== false,
      fechaPublicacion: departamento.fechaPublicacion || new Date().toISOString(),
    };

    this.departamentos.push(nuevoDepartamento);
    this.guardar();

    return {
      ...nuevoDepartamento,
    };
  }

  actualizarDepartamento(departamento: Departamento): boolean {
    this.sincronizar();

    const indice = this.departamentos.findIndex((item) => item.id === departamento.id);

    if (indice === -1) {
      return false;
    }

    this.departamentos[indice] = {
      ...this.departamentos[indice],
      ...departamento,
      propietarioEmail: departamento.propietarioEmail.trim().toLowerCase(),
      Descripcion: (departamento.Descripcion || '').trim(),
      Capacidad: Number(departamento.Capacidad ?? 0),
      TienePiscina: Boolean(departamento.TienePiscina),
      TieneWifi: Boolean(departamento.TieneWifi),
      AdmiteMascotas: Boolean(departamento.AdmiteMascotas),
      Activo:
        departamento.Activo === undefined
          ? this.departamentos[indice].Activo !== false
          : departamento.Activo !== false,
    };

    this.guardar();
    return true;
  }

  desactivarDepartamento(id: number): boolean {
    this.sincronizar();

    const indice = this.departamentos.findIndex(
      (departamento) => Number(departamento.id) === Number(id),
    );

    if (indice === -1) {
      return false;
    }

    this.departamentos[indice] = {
      ...this.departamentos[indice],
      Activo: false,
    };

    this.guardar();
    return true;
  }

  desactivarDepartamentosPropietario(email: string): number {
    this.sincronizar();

    const correo = email.trim().toLowerCase();
    let cantidad = 0;

    this.departamentos = this.departamentos.map((departamento) => {
      const pertenece = (departamento.propietarioEmail || '').trim().toLowerCase() === correo;

      if (pertenece && departamento.Activo !== false) {
        cantidad++;

        return {
          ...departamento,
          Activo: false,
        };
      }

      return departamento;
    });

    if (cantidad > 0) {
      this.guardar();
    }

    return cantidad;
  }

  reactivarDepartamentosPropietario(email: string): number {
    this.sincronizar();

    const correo = email.trim().toLowerCase();
    let cantidad = 0;

    this.departamentos = this.departamentos.map((departamento) => {
      const pertenece = (departamento.propietarioEmail || '').trim().toLowerCase() === correo;

      if (pertenece && departamento.Activo === false) {
        cantidad++;

        return {
          ...departamento,
          Activo: true,
        };
      }

      return departamento;
    });

    if (cantidad > 0) {
      this.guardar();
    }

    return cantidad;
  }

  eliminarDepartamentosPorPropietario(email: string): number {
    this.sincronizar();

    const correo = email.trim().toLowerCase();
    const cantidadAnterior = this.departamentos.length;

    this.departamentos = this.departamentos.filter(
      (departamento) => (departamento.propietarioEmail || '').trim().toLowerCase() !== correo,
    );

    const eliminados = cantidadAnterior - this.departamentos.length;

    if (eliminados > 0) {
      this.guardar();
    }

    return eliminados;
  }

  eliminarDepartamento(id: number): boolean {
    this.sincronizar();

    const cantidadAnterior = this.departamentos.length;

    this.departamentos = this.departamentos.filter((departamento) => departamento.id !== id);

    if (this.departamentos.length === cantidadAnterior) {
      return false;
    }

    this.guardar();
    return true;
  }
}
