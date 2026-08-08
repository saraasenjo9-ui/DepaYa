namespace ms_pagos.DTOs
{
    public class ActualizarPagoDTO
    {
        public decimal Monto_Total { get; set; }

        public string Moneda { get; set; } = "PEN";

        public string? Metodo_Pago { get; set; }

        public string Estado_Pago { get; set; } = "Procesando";

        public string? Pasarela_Transaccion_ID { get; set; }
    }
}