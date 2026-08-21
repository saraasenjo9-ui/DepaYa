import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  private readonly baseUrl = 'https://depayabackend-fzbeg0g5cydsecbm.canadacentral-01.azurewebsites.net';
  private readonly apiUrl = `${this.baseUrl}/api/Departamento`;

  private departamentos: Departamento[] = [];

  constructor(private http: HttpClient) {
    this.cargarDesdeServidor();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  private normalizarDepartamento(item: any): Departamento {
    const activo = item.Activo ?? item.activo ?? item.Estado ?? 'Disponible';

    return {
      id: Number(item.id ?? item.ID_Departamento ?? 0),
      Titulo: item.Titulo ?? item.titulo ?? 'Sin título',
      Distrito: item.Distrito ?? item.distrito ?? '',
      Precio_Noche: Number(item.Precio_Noche ?? item.precio_Noche ?? item.PrecioNoche ?? 0),
      Habitaciones: Number(item.Habitaciones ?? item.habitaciones ?? 0),
      Banos: Number(item.Banos ?? item.banos ?? 0),
      Categoria: item.Categoria ?? item.categoria ?? 'General',
      URL_Imagen: item.URL_Imagen ?? item.url_Imagen ?? item.URLImagen ?? '',
      propietarioEmail: String(
        item.propietarioEmail ?? item.PropietarioEmail ?? item.emailPropietario ?? '',
      )
        .trim()
        .toLowerCase(),
      Descripcion: item.Descripcion ?? item.descripcion ?? '',
      Capacidad: Number(item.Capacidad ?? item.capacidad ?? item.Capacidad_Personas ?? 0),
      TienePiscina: Boolean(item.TienePiscina ?? item.tienePiscina ?? false),
      TieneWifi: Boolean(item.TieneWifi ?? item.tieneWifi ?? false),
      AdmiteMascotas: Boolean(item.AdmiteMascotas ?? item.admiteMascotas ?? false),
      Activo: activo !== false && String(activo).toLowerCase() !== 'inactivo',
      fechaPublicacion:
        item.fechaPublicacion ?? item.Fecha_Publicacion ?? new Date().toISOString(),
    };
  }

  private cargarDesdeServidor(): void {
    this.http
      .get<any[]>(this.apiUrl, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.departamentos = (response ?? []).map((item) => this.normalizarDepartamento(item));
        },
        error: () => {
          this.departamentos = [];
        },
      });
  }

  private refrescar(): void {
    this.cargarDesdeServidor();
  }

  getDepartamentos(): Departamento[] {
    return [...this.departamentos];
  }

  getDepartamentosActivos(): Departamento[] {
    return this.departamentos.filter((departamento) => departamento.Activo !== false);
  }

  getDepartamentoById(id: number): Departamento | undefined {
    return this.departamentos.find((item) => Number(item.id) === Number(id));
  }

  getDepartamentosPorPropietario(email: string): Departamento[] {
    const correo = (email || '').trim().toLowerCase();

    return this.departamentos.filter(
      (departamento) => (departamento.propietarioEmail || '').trim().toLowerCase() === correo,
    );
  }

  agregarDepartamento(departamento: Departamento): Departamento {
    const payload = {
      ID_Propietario: 0,
      Titulo: departamento.Titulo,
      Descripcion: departamento.Descripcion ?? '',
      Distrito: departamento.Distrito,
      Direccion: departamento.Distrito,
      Latitud: null,
      Longitud: null,
      Precio_Noche: Number(departamento.Precio_Noche ?? 0),
      Capacidad_Personas: Number(departamento.Capacidad ?? 0),
      Habitaciones: Number(departamento.Habitaciones ?? 0),
      Banos: Number(departamento.Banos ?? 0),
      Estado: departamento.Activo === false ? 'Inactivo' : 'Disponible',
    };

    this.http
      .post<any>(this.apiUrl, payload, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return {
      ...departamento,
      id: departamento.id ?? this.departamentos.length + 1,
    };
  }

  actualizarDepartamento(departamento: Departamento): boolean {
    const payload = {
      ID_Propietario: 0,
      Titulo: departamento.Titulo,
      Descripcion: departamento.Descripcion ?? '',
      Distrito: departamento.Distrito,
      Direccion: departamento.Distrito,
      Latitud: null,
      Longitud: null,
      Precio_Noche: Number(departamento.Precio_Noche ?? 0),
      Capacidad_Personas: Number(departamento.Capacidad ?? 0),
      Habitaciones: Number(departamento.Habitaciones ?? 0),
      Banos: Number(departamento.Banos ?? 0),
      Estado: departamento.Activo === false ? 'Inactivo' : 'Disponible',
    };

    this.http
      .put<any>(`${this.apiUrl}/${departamento.id}`, payload, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  desactivarDepartamento(id: number): boolean {
    this.http
      .delete(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  desactivarDepartamentosPropietario(email: string): number {
    const departamentos = this.getDepartamentosPorPropietario(email);

    departamentos.forEach((departamento) => {
      this.http
        .delete(`${this.apiUrl}/${departamento.id}`, {
          headers: this.getHeaders(),
        })
        .subscribe({
          next: () => this.refrescar(),
          error: () => this.refrescar(),
        });
    });

    return departamentos.length;
  }

  reactivarDepartamentosPropietario(email: string): number {
    const departamentos = this.getDepartamentosPorPropietario(email).filter(
      (departamento) => departamento.Activo === false,
    );

    departamentos.forEach((departamento) => {
      this.http
        .put(
          `${this.apiUrl}/${departamento.id}`,
          {
            ...departamento,
            Estado: 'Disponible',
            Activo: true,
          },
          {
            headers: this.getHeaders(),
          },
        )
        .subscribe({
          next: () => this.refrescar(),
          error: () => this.refrescar(),
        });
    });

    return departamentos.length;
  }

  eliminarDepartamentosPorPropietario(email: string): number {
    const departamentos = this.getDepartamentosPorPropietario(email);

    departamentos.forEach((departamento) => {
      this.http
        .delete(`${this.apiUrl}/${departamento.id}`, {
          headers: this.getHeaders(),
        })
        .subscribe({
          next: () => this.refrescar(),
          error: () => this.refrescar(),
        });
    });

    return departamentos.length;
  }

  eliminarDepartamento(id: number): boolean {
    this.http
      .delete(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }
}
