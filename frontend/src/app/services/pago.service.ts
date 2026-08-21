import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export type MetodoPago = 'YAPE' | 'PLIN' | 'VISA' | 'MASTERCARD';

export type EstadoPago =
  'PROCESANDO' | 'COMPLETADO' | 'REEMBOLSO_PENDIENTE' | 'REEMBOLSADO' | 'CANCELADO';

export interface Pago {
  id: number;
  reservaId: number;
  propietarioEmail: string;
  inquilinoEmail: string;
  inquilinoNombre: string;
  departamento: string;
  monto: number;
  moneda: 'PEN';
  metodo: MetodoPago;
  estado: EstadoPago;
  fecha: string;
  fechaSolicitudReembolso?: string;
  fechaLimiteReembolso?: string;
  fechaReembolso?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PagoService {
  private readonly baseUrl = 'https://depayabackend-fzbeg0g5cydsecbm.canadacentral-01.azurewebsites.net';
  private readonly apiUrl = `${this.baseUrl}/api/Pago`;

  private pagos: Pago[] = [];

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

  private normalizarPago(item: any): Pago {
    return {
      id: Number(item.id ?? item.ID_Pago ?? 0),
      reservaId: Number(item.reservaId ?? item.ID_Reserva ?? 0),
      propietarioEmail: String(item.propietarioEmail ?? item.PropietarioEmail ?? '').trim().toLowerCase(),
      inquilinoEmail: String(item.inquilinoEmail ?? item.InquilinoEmail ?? '').trim().toLowerCase(),
      inquilinoNombre: item.inquilinoNombre ?? item.InquilinoNombre ?? 'Inquilino',
      departamento: item.departamento ?? item.Departamento ?? 'Departamento',
      monto: Number(item.monto ?? item.Monto_Total ?? 0),
      moneda: (item.moneda ?? item.Moneda ?? 'PEN') as 'PEN',
      metodo: (item.metodo ?? item.Metodo_Pago ?? 'YAPE') as MetodoPago,
      estado: (item.estado ?? item.Estado_Pago ?? 'PROCESANDO') as EstadoPago,
      fecha: item.fecha ?? item.Fecha_Transaccion ?? new Date().toISOString(),
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
          this.pagos = (response ?? []).map((item) => this.normalizarPago(item));
        },
        error: () => {
          this.pagos = [];
        },
      });
  }

  private refrescar(): void {
    this.cargarDesdeServidor();
  }

  listar(): Pago[] {
    return [...this.pagos];
  }

  obtenerPorId(id: number): Pago | undefined {
    return this.pagos.find((pago) => Number(pago.id) === Number(id));
  }

  obtenerPorReserva(reservaId: number): Pago | undefined {
    return this.pagos.find((pago) => Number(pago.reservaId) === Number(reservaId));
  }

  crearPagoPendiente(reserva: any, metodo: MetodoPago): Pago {
    const pago: Pago = {
      id: Number(reserva.id ?? this.pagos.length + 1),
      reservaId: Number(reserva.id),
      propietarioEmail: String(reserva.propietarioEmail ?? '').trim().toLowerCase(),
      inquilinoEmail: String(reserva.inquilinoEmail ?? '').trim().toLowerCase(),
      inquilinoNombre: reserva.inquilinoNombre ?? 'Inquilino',
      departamento: reserva.departamento ?? 'Departamento',
      monto: Number(reserva.total ?? 0),
      moneda: 'PEN',
      metodo,
      estado: 'PROCESANDO',
      fecha: new Date().toISOString(),
    };

    this.http
      .post<any>(this.apiUrl, {
        ID_Reserva: Number(reserva.id),
        Monto_Total: Number(pago.monto),
        Moneda: 'PEN',
        Metodo_Pago: metodo,
        Pasarela_Transaccion_ID: undefined,
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return { ...pago };
  }

  confirmarPago(id: number): boolean {
    const pago = this.obtenerPorId(id);

    if (!pago) {
      return false;
    }

    this.http
      .put<any>(`${this.apiUrl}/${id}`, {
        ID_Reserva: Number(pago.reservaId),
        Monto_Total: Number(pago.monto),
        Moneda: pago.moneda,
        Metodo_Pago: pago.metodo,
        Estado_Pago: 'COMPLETADO',
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  solicitarReembolso(reservaId: number): Pago | null {
    const pago = this.obtenerPorReserva(reservaId);

    if (!pago || pago.estado !== 'COMPLETADO') {
      return null;
    }

    const ahora = new Date();
    const limite = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);

    this.http
      .put<any>(`${this.apiUrl}/${pago.id}`, {
        ID_Reserva: Number(reservaId),
        Monto_Total: Number(pago.monto),
        Moneda: pago.moneda,
        Metodo_Pago: pago.metodo,
        Estado_Pago: 'REEMBOLSO_PENDIENTE',
        Fecha_Solicitud_Reembolso: ahora.toISOString(),
        Fecha_Limite_Reembolso: limite.toISOString(),
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return { ...pago, estado: 'REEMBOLSO_PENDIENTE', fechaSolicitudReembolso: ahora.toISOString(), fechaLimiteReembolso: limite.toISOString() };
  }

  revertirSolicitudReembolso(pagoId: number): boolean {
    const pago = this.obtenerPorId(pagoId);

    if (!pago || pago.estado !== 'REEMBOLSO_PENDIENTE') {
      return false;
    }

    this.http
      .put<any>(`${this.apiUrl}/${pagoId}`, {
        ID_Reserva: Number(pago.reservaId),
        Monto_Total: Number(pago.monto),
        Moneda: pago.moneda,
        Metodo_Pago: pago.metodo,
        Estado_Pago: 'COMPLETADO',
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  confirmarReembolso(pagoId: number): Pago | null {
    const pago = this.obtenerPorId(pagoId);

    if (!pago || pago.estado !== 'REEMBOLSO_PENDIENTE') {
      return null;
    }

    this.http
      .put<any>(`${this.apiUrl}/${pagoId}`, {
        ID_Reserva: Number(pago.reservaId),
        Monto_Total: Number(pago.monto),
        Moneda: pago.moneda,
        Metodo_Pago: pago.metodo,
        Estado_Pago: 'REEMBOLSADO',
        Fecha_Reembolso: new Date().toISOString(),
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return { ...pago, estado: 'REEMBOLSADO', fechaReembolso: new Date().toISOString() };
  }

  procesarReembolsosVencidos(): Pago[] {
    const vencidos = this.pagos.filter(
      (pago) =>
        pago.estado === 'REEMBOLSO_PENDIENTE' &&
        !!pago.fechaLimiteReembolso &&
        new Date(pago.fechaLimiteReembolso).getTime() <= Date.now(),
    );

    vencidos.forEach((pago) => {
      this.http
        .put<any>(`${this.apiUrl}/${pago.id}`, {
          ID_Reserva: Number(pago.reservaId),
          Monto_Total: Number(pago.monto),
          Moneda: pago.moneda,
          Metodo_Pago: pago.metodo,
          Estado_Pago: 'REEMBOLSADO',
          Fecha_Reembolso: new Date().toISOString(),
        }, {
          headers: this.getHeaders(),
        })
        .subscribe({
          next: () => this.refrescar(),
          error: () => this.refrescar(),
        });
    });

    return vencidos.map((pago) => ({ ...pago, estado: 'REEMBOLSADO' }));
  }

  actualizarPago(pago: Pago): boolean {
    this.http
      .put<any>(`${this.apiUrl}/${pago.id}`, {
        ID_Reserva: Number(pago.reservaId),
        Monto_Total: Number(pago.monto),
        Moneda: pago.moneda,
        Metodo_Pago: pago.metodo,
        Estado_Pago: pago.estado,
      }, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => this.refrescar(),
        error: () => this.refrescar(),
      });

    return true;
  }

  eliminarPago(id: number): boolean {
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

  buscarPorPropietario(email: string): Pago[] {
    const correo = (email || '').trim().toLowerCase();

    return this.pagos.filter(
      (pago) => (pago.propietarioEmail || '').trim().toLowerCase() === correo,
    );
  }

  buscarPorInquilino(email: string): Pago[] {
    const correo = (email || '').trim().toLowerCase();

    return this.pagos.filter(
      (pago) => (pago.inquilinoEmail || '').trim().toLowerCase() === correo,
    );
  }

  obtenerIngresosPropietario(email: string): number {
    return this.buscarPorPropietario(email)
      .filter((pago) => pago.estado === 'COMPLETADO')
      .reduce((total, pago) => total + Number(pago.monto), 0);
  }

  obtenerNombreMetodo(metodo: MetodoPago): string {
    switch (metodo) {
      case 'YAPE':
        return 'Yape';
      case 'PLIN':
        return 'Plin';
      case 'VISA':
        return 'Visa';
      case 'MASTERCARD':
        return 'Mastercard';
      default:
        return metodo;
    }
  }

  obtenerNombreEstado(estado: EstadoPago): string {
    switch (estado) {
      case 'PROCESANDO':
        return 'Procesando';
      case 'COMPLETADO':
        return 'Completado';
      case 'REEMBOLSO_PENDIENTE':
        return 'Reembolso pendiente';
      case 'REEMBOLSADO':
        return 'Devuelto completo';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  }
}
