using Microsoft.Data.SqlClient;
using ms_pagos.Data;
using ms_pagos.DTOs;
using ms_pagos.Interfaces;

namespace ms_pagos.Repositorios
{
    public class PagoRepository : IPagoRepository
    {
        private readonly ConexionBD _conexionBD;

        public PagoRepository(ConexionBD conexionBD)
        {
            _conexionBD = conexionBD;
        }

        public async Task<IEnumerable<PagoDTO>> ListarAsync()
        {
            var pagos = new List<PagoDTO>();

            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                SELECT
                    ID_Pago,
                    ID_Reserva,
                    Monto_Total,
                    Moneda,
                    Metodo_Pago,
                    Estado_Pago,
                    Fecha_Transaccion,
                    Pasarela_Transaccion_ID
                FROM pag.Transaccion";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            using SqlDataReader reader = await comando.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                pagos.Add(MapearPago(reader));
            }

            return pagos;
        }

        public async Task<PagoDTO?> ObtenerAsync(int id)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                SELECT
                    ID_Pago,
                    ID_Reserva,
                    Monto_Total,
                    Moneda,
                    Metodo_Pago,
                    Estado_Pago,
                    Fecha_Transaccion,
                    Pasarela_Transaccion_ID
                FROM pag.Transaccion
                WHERE ID_Pago = @ID_Pago";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue("@ID_Pago", id);

            using SqlDataReader reader = await comando.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return MapearPago(reader);
            }

            return null;
        }

        public async Task<PagoDTO> RegistrarAsync(CrearPagoDTO dto)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                INSERT INTO pag.Transaccion
                (
                    ID_Reserva,
                    Monto_Total,
                    Moneda,
                    Metodo_Pago,
                    Estado_Pago,
                    Pasarela_Transaccion_ID
                )
                VALUES
                (
                    @ID_Reserva,
                    @Monto_Total,
                    @Moneda,
                    @Metodo_Pago,
                    @Estado_Pago,
                    @Pasarela_Transaccion_ID
                );

                SELECT SCOPE_IDENTITY();";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue("@ID_Reserva", dto.ID_Reserva);
            comando.Parameters.AddWithValue("@Monto_Total", dto.Monto_Total);
            comando.Parameters.AddWithValue("@Moneda", dto.Moneda);
            comando.Parameters.AddWithValue(
                "@Metodo_Pago",
                dto.Metodo_Pago ?? (object)DBNull.Value);
            comando.Parameters.AddWithValue("@Estado_Pago", dto.Estado_Pago);
            comando.Parameters.AddWithValue(
                "@Pasarela_Transaccion_ID",
                dto.Pasarela_Transaccion_ID ?? (object)DBNull.Value);

            int idGenerado = Convert.ToInt32(
                await comando.ExecuteScalarAsync());

            return (await ObtenerAsync(idGenerado))!;
        }

        public async Task<PagoDTO?> ActualizarAsync(
            int id,
            ActualizarPagoDTO dto)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                UPDATE pag.Transaccion
                SET
                    Monto_Total = @Monto_Total,
                    Moneda = @Moneda,
                    Metodo_Pago = @Metodo_Pago,
                    Estado_Pago = @Estado_Pago,
                    Pasarela_Transaccion_ID = @Pasarela_Transaccion_ID
                WHERE ID_Pago = @ID_Pago";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue("@ID_Pago", id);
            comando.Parameters.AddWithValue("@Monto_Total", dto.Monto_Total);
            comando.Parameters.AddWithValue("@Moneda", dto.Moneda);
            comando.Parameters.AddWithValue(
                "@Metodo_Pago",
                dto.Metodo_Pago ?? (object)DBNull.Value);
            comando.Parameters.AddWithValue("@Estado_Pago", dto.Estado_Pago);
            comando.Parameters.AddWithValue(
                "@Pasarela_Transaccion_ID",
                dto.Pasarela_Transaccion_ID ?? (object)DBNull.Value);

            int filas = await comando.ExecuteNonQueryAsync();

            if (filas == 0)
            {
                return null;
            }

            return await ObtenerAsync(id);
        }

        public async Task<bool> EliminarAsync(int id)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                DELETE FROM pag.Transaccion
                WHERE ID_Pago = @ID_Pago";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue("@ID_Pago", id);

            int filas = await comando.ExecuteNonQueryAsync();

            return filas > 0;
        }

        private PagoDTO MapearPago(SqlDataReader reader)
        {
            return new PagoDTO
            {
                ID_Pago = reader.GetInt32(
                    reader.GetOrdinal("ID_Pago")),

                ID_Reserva = reader.GetInt32(
                    reader.GetOrdinal("ID_Reserva")),

                Monto_Total = reader.GetDecimal(
                    reader.GetOrdinal("Monto_Total")),

                Moneda = reader.GetString(
                    reader.GetOrdinal("Moneda")),

                Metodo_Pago = reader.IsDBNull(
                    reader.GetOrdinal("Metodo_Pago"))
                    ? null
                    : reader.GetString(
                        reader.GetOrdinal("Metodo_Pago")),

                Estado_Pago = reader.GetString(
                    reader.GetOrdinal("Estado_Pago")),

                Fecha_Transaccion = reader.GetDateTime(
                    reader.GetOrdinal("Fecha_Transaccion")),

                Pasarela_Transaccion_ID = reader.IsDBNull(
                    reader.GetOrdinal("Pasarela_Transaccion_ID"))
                    ? null
                    : reader.GetString(
                        reader.GetOrdinal("Pasarela_Transaccion_ID"))
            };
        }
    }
}