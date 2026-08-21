import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export type EstadoReserva = 'CONFIRMADA' | 'PENDIENTE' | 'CANCELADA';

export type EstadoReembolso = 'NO_APLICA' | 'PENDIENTE' | 'DEVUELTO';

export type MetodoReembolso = 'YAPE' | 'PLIN' | 'VISA' | 'MASTERCARD';

export interface Reserva {
  id: number;
  departamentoId: number;
  departamento: string;
  ciudad: string;
  propietarioEmail: string;
  inquilinoEmail: string;
  inquilinoNombre: string;
  huespedes?: number;
  fechaInicio: string;
  fechaFin: string;
  noches: number;
  precioNoche: number;
  total: number;
  estado: EstadoReserva;
  fechaReserva: string;
  estadoReembolso?: EstadoReembolso;
  metodoReembolso?: MetodoReembolso;
  fechaCancelacion?: string;
  fechaSolicitudReembolso?: string;
  fechaLimiteReembolso?: string;
  fechaReembolso?: string;
}

export interface RangoOcupado {
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoReserva;
  reservaId: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private readonly baseUrl = 'https://depayabackend-fzbeg0g5cydsecbm.canadacentral-01.azurewebsites.net';
  private readonly apiUrl = `${this.baseUrl}/api/Reserva`;

  private reservas: Reserva[] = [];

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

  private normalizarReserva(item: any): Reserva {
    const fechaIngreso = item.Fecha_Ingreso ?? item.fecha_Ingreso ?? item.fechaInicio ?? new Date().toISOString();
    const fechaSalida = item.Fecha_Salida ?? item.fecha_Salida ?? item.fechaFin ?? new Date().toISOString();

    const fechaInicio = typeof fechaIngreso === 'string' ? fechaIngreso : new Date(fechaIngreso).toISOString();
    const fechaFin = typeof fechaSalida === 'string' ? fechaSalida : new Date(fechaSalida).toISOString();

    return {
      id: Number(item.id ?? item.ID_Reserva ?? 0),
      departamentoId: Number(item.departamentoId ?? item.ID_Departamento ?? 0),
      departamento: item.departamento ?? item.Departamento ?? 'Departamento',
      ciudad: item.ciudad ?? item.Ciudad ?? '',
      propietarioEmail: String(item.propietarioEmail ?? item.PropietarioEmail ?? '').trim().toLowerCase(),
      inquilinoEmail: String(item.inquilinoEmail ?? item.InquilinoEmail ?? '').trim().toLowerCase(),
      inquilinoNombre: item.inquilinoNombre ?? item.InquilinoNombre ?? 'Inquilino',
      huespedes: Number(item.huespedes ?? item.Cantidad_Huespedes ?? 1),
      fechaInicio: fechaInicio.slice(0, 10),
      fechaFin: fechaFin.slice(0, 10),
      noches: Number(item.noches ?? this.calcularNoches(fechaInicio.slice(0, 10), fechaFin.slice(0, 10))),
      precioNoche: Number(item.precioNoche ?? item.Precio_Noche ?? item.precio_noche ?? 0),
      total: Number(item.total ?? item.Total ?? 0),
      estado: (item.estado ?? item.Estado ?? 'PENDIENTE') as EstadoReserva,
      fechaReserva: item.fechaReserva ?? item.Fecha_Creacion ?? new Date().toISOString(),
      estadoReembolso: (item.estadoReembolso ?? item.EstadoReembolso ?? 'NO_APLICA') as EstadoReembolso,
      metodoReembolso: item.metodoReembolso ?? item.MetodoReembolso,
      fechaCancelacion: item.fechaCancelacion ?? item.Fecha_Cancelacion,
      fechaSolicitudReembolso: item.fechaSolicitudReembolso ?? item.Fecha_Solicitud_Reembolso,
      fechaLimiteReembolso: item.fechaLimiteReembolso ?? item.Fecha_Limite_Reembolso,
      fechaReembolso: item.fechaReembolso ?? item.Fecha_Reembolso,
    };
  }

  private cargarDesdeServidor(): void {
    this.http
      .get<any[]>(this.apiUrl, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.reservas = (response ?? []).map((item) => this.normalizarReserva(item));
        },
        error: () => {
          this.reservas = [];
        },
      });
  }

  private refrescar(): void {
    this.cargarDesdeServidor();
  }

  listar(): Reserva[] {
    return [...this.reservas];
  }

  obtenerPorId(id: number): Reserva | undefined {
    return this.reservas.find((reserva) => Number(reserva.id) === Number(id));
  }

  private convertirFecha(fecha: string): number {
    if (!fecha) {
      return NaN;
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return NaN;
    }

    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);

    if (!anio || !mes || !dia) {
      return NaN;
    }

    return Date.UTC(anio, mes - 1, dia);
  }

  private obtenerHoyUTC(): number {
    const hoy = new Date();

    return Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  }

  private timestampAFecha(timestamp: number): string {
    const fecha = new Date(timestamp);
    const anio = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getUTCDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  fechasValidas(fechaInicio: string, fechaFin: string): boolean {
    const inicio = this.convertirFecha(fechaInicio);
    const fin = this.convertirFecha(fechaFin);

    if (Number.isNaN(inicio) || Number.isNaN(fin)) {
      return false;
    }

    return fin > inicio;
  }

  calcularNoches(fechaInicio: string, fechaFin: string): number {
    if (!this.fechasValidas(fechaInicio, fechaFin)) {
      return 0;
    }

    const inicio = this.convertirFecha(fechaInicio);
    const fin = this.convertirFecha(fechaFin);

    return Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
  }

  obtenerReservasActivasDepartamento(departamentoId: number): Reserva[] {
    return this.reservas.filter((reserva) => {
      const mismoDepartamento = Number(reserva.departamentoId) === Number(departamentoId);
      const bloquea = reserva.estado === 'CONFIRMADA' || reserva.estado === 'PENDIENTE';

      return mismoDepartamento && bloquea;
    });
  }

  obtenerConflictos(
    departamentoId: number,
    fechaInicio: string,
    fechaFin: string,
    excluirReservaId?: number,
  ): Reserva[] {
    if (!this.fechasValidas(fechaInicio, fechaFin)) {
      return [];
    }

    const nuevaEntrada = this.convertirFecha(fechaInicio);
    const nuevaSalida = this.convertirFecha(fechaFin);

    return this.obtenerReservasActivasDepartamento(departamentoId).filter((reserva) => {
      if (excluirReservaId !== undefined && Number(reserva.id) === Number(excluirReservaId)) {
        return false;
      }

      const entradaExistente = this.convertirFecha(reserva.fechaInicio);
      const salidaExistente = this.convertirFecha(reserva.fechaFin);

      return nuevaEntrada < salidaExistente && nuevaSalida > entradaExistente;
    });
  }

  estaDisponible(
    departamentoId: number,
    fechaInicio: string,
    fechaFin: string,
    excluirReservaId?: number,
  ): boolean {
    if (!this.fechasValidas(fechaInicio, fechaFin)) {
      return false;
    }

    return this.obtenerConflictos(departamentoId, fechaInicio, fechaFin, excluirReservaId).length === 0;
  }

  obtenerRangosOcupados(departamentoId: number): RangoOcupado[] {
    return this.obtenerReservasActivasDepartamento(departamentoId)
      .map((reserva) => ({
        fechaInicio: reserva.fechaInicio,
        fechaFin: reserva.fechaFin,
        estado: reserva.estado,
        reservaId: reserva.id,
      }))
      .sort((a, b) => this.convertirFecha(a.fechaInicio) - this.convertirFecha(b.fechaInicio));
  }

  fechaEstaOcupada(departamentoId: number, fecha: string): boolean {
    const fechaSeleccionada = this.convertirFecha(fecha);

    if (Number.isNaN(fechaSeleccionada)) {
      return false;
    }

    return this.obtenerReservasActivasDepartamento(departamentoId).some((reserva) => {
      const inicio = this.convertirFecha(reserva.fechaInicio);
      const fin = this.convertirFecha(reserva.fechaFin);

      return fechaSeleccionada >= inicio && fechaSeleccionada < fin;
    });
  }

  guardar(reserva: Reserva): Reserva {
    if (!this.fechasValidas(reserva.fechaInicio, reserva.fechaFin)) {
      throw new Error('Las fechas seleccionadas no son válidas.');
    }

    if (!this.estaDisponible(reserva.departamentoId, reserva.fechaInicio, reserva.fechaFin)) {
      throw new Error('Este departamento ya está reservado en las fechas seleccionadas.');
    }

    const payload = {
      ID_Departamento: Number(reserva.departamentoId),
      ID_Inquilino: 0,
      Fecha_Ingreso: new Date(reserva.fechaInicio).toISOString(),
      Fecha_Salida: new Date(reserva.fechaFin).toISOString(),
      Cantidad_Huespedes: Number(reserva.huespedes ?? 1),
    };

    this.http
      .post<any>(this.apiUrl, payload, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    const nuevaReserva: Reserva = {
      ...reserva,
      id: reserva.id ?? this.reservas.length + 1,
      noches: this.calcularNoches(reserva.fechaInicio, reserva.fechaFin),
      total: this.calcularNoches(reserva.fechaInicio, reserva.fechaFin) * Number(reserva.precioNoche),
      fechaReserva: reserva.fechaReserva || new Date().toISOString(),
      estadoReembolso: 'NO_APLICA',
    };

    return { ...nuevaReserva };
  }

  actualizarReserva(reservaActualizada: Reserva): boolean {
    this.http
      .put<any>(`${this.apiUrl}/${reservaActualizada.id}`, {
        ID_Departamento: Number(reservaActualizada.departamentoId),
        ID_Inquilino: 0,
        Fecha_Ingreso: new Date(reservaActualizada.fechaInicio).toISOString(),
        Fecha_Salida: new Date(reservaActualizada.fechaFin).toISOString(),
        Cantidad_Huespedes: Number(reservaActualizada.huespedes ?? 1),
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  actualizarEstado(id: number, estado: EstadoReserva): boolean {
    const reserva = this.obtenerPorId(id);

    if (!reserva) {
      return false;
    }

    this.http
      .put<any>(`${this.apiUrl}/${id}`, {
        ID_Departamento: Number(reserva.departamentoId),
        ID_Inquilino: 0,
        Fecha_Ingreso: new Date(reserva.fechaInicio).toISOString(),
        Fecha_Salida: new Date(reserva.fechaFin).toISOString(),
        Cantidad_Huespedes: Number(reserva.huespedes ?? 1),
        Estado: estado,
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  obtenerDiasHastaIngreso(reserva: Reserva): number {
    const ingreso = this.convertirFecha(reserva.fechaInicio);

    if (Number.isNaN(ingreso)) {
      return -1;
    }

    const hoy = this.obtenerHoyUTC();

    return Math.floor((ingreso - hoy) / (1000 * 60 * 60 * 24));
  }

  puedeCancelarConReembolso(reserva: Reserva): boolean {
    if (reserva.estado !== 'CONFIRMADA') {
      return false;
    }

    return this.obtenerDiasHastaIngreso(reserva) >= 1;
  }

  obtenerFechaLimiteCancelacion(reserva: Reserva): string {
    const ingreso = this.convertirFecha(reserva.fechaInicio);

    if (Number.isNaN(ingreso)) {
      return '';
    }

    const unDia = 24 * 60 * 60 * 1000;

    return this.timestampAFecha(ingreso - unDia);
  }

  cancelarReserva(id: number): boolean {
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

  cancelarConReembolso(
    id: number,
    metodo: MetodoReembolso,
    fechaSolicitud: string,
    fechaLimite: string,
  ): boolean {
    const reserva = this.obtenerPorId(id);

    if (!reserva || !this.puedeCancelarConReembolso(reserva)) {
      return false;
    }

    this.http
      .put<any>(`${this.apiUrl}/${id}`, {
        ID_Departamento: Number(reserva.departamentoId),
        ID_Inquilino: 0,
        Fecha_Ingreso: new Date(reserva.fechaInicio).toISOString(),
        Fecha_Salida: new Date(reserva.fechaFin).toISOString(),
        Cantidad_Huespedes: Number(reserva.huespedes ?? 1),
        Estado: 'CANCELADA',
        EstadoReembolso: 'PENDIENTE',
        MetodoReembolso: metodo,
        FechaSolicitudReembolso: fechaSolicitud,
        FechaLimiteReembolso: fechaLimite,
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  marcarReembolsoDevuelto(
    reservaId: number,
    metodo?: MetodoReembolso,
    fechaReembolso?: string,
  ): boolean {
    const reserva = this.obtenerPorId(reservaId);

    if (!reserva) {
      return false;
    }

    this.http
      .put<any>(`${this.apiUrl}/${reservaId}`, {
        ID_Departamento: Number(reserva.departamentoId),
        ID_Inquilino: 0,
        Fecha_Ingreso: new Date(reserva.fechaInicio).toISOString(),
        Fecha_Salida: new Date(reserva.fechaFin).toISOString(),
        Cantidad_Huespedes: Number(reserva.huespedes ?? 1),
        Estado: 'CANCELADA',
        EstadoReembolso: 'DEVUELTO',
        MetodoReembolso: metodo ?? reserva.metodoReembolso,
        FechaReembolso: fechaReembolso ?? new Date().toISOString(),
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  buscarPorInquilino(email: string): Reserva[] {
    const correo = (email || '').trim().toLowerCase();

    return this.reservas
      .filter((reserva) => (reserva.inquilinoEmail || '').trim().toLowerCase() === correo)
      .sort((a, b) => new Date(b.fechaReserva).getTime() - new Date(a.fechaReserva).getTime());
  }

  buscarPorPropietario(email: string): Reserva[] {
    const correo = (email || '').trim().toLowerCase();

    return this.reservas
      .filter((reserva) => (reserva.propietarioEmail || '').trim().toLowerCase() === correo)
      .sort((a, b) => new Date(b.fechaReserva).getTime() - new Date(a.fechaReserva).getTime());
  }

  obtenerTotalPropietario(email: string): number {
    return this.buscarPorPropietario(email)
      .filter((reserva) => reserva.estado === 'CONFIRMADA')
      .reduce((total, reserva) => total + Number(reserva.total), 0);
  }

  obtenerCantidadReservasPropietario(email: string): number {
    return this.buscarPorPropietario(email).filter((reserva) => reserva.estado === 'CONFIRMADA').length;
  }
}
