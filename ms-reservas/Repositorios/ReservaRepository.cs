using Microsoft.Data.SqlClient;
using ms_reservas.Data;
using ms_reservas.DTOs;
using ms_reservas.Interfaces;

namespace ms_reservas.Repositorios
{
    public class ReservaRepository : IReservaRepository
    {
        private readonly ConexionBD _conexionBD;

        public ReservaRepository(ConexionBD conexionBD)
        {
            _conexionBD = conexionBD;
        }

        public async Task<IEnumerable<ReservaDTO>> ListarAsync()
        {
            var reservas = new List<ReservaDTO>();

            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                SELECT
                    ID_Reserva,
                    ID_Departamento,
                    ID_Inquilino,
                    Fecha_Ingreso,
                    Fecha_Salida,
                    Cantidad_Huespedes,
                    Estado,
                    Fecha_Creacion
                FROM res.Reserva
                ORDER BY ID_Reserva DESC";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            using SqlDataReader reader = await comando.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                reservas.Add(MapearReserva(reader));
            }

            return reservas;
        }

        public async Task<ReservaDTO?> ObtenerAsync(int id)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                SELECT
                    ID_Reserva,
                    ID_Departamento,
                    ID_Inquilino,
                    Fecha_Ingreso,
                    Fecha_Salida,
                    Cantidad_Huespedes,
                    Estado,
                    Fecha_Creacion
                FROM res.Reserva
                WHERE ID_Reserva = @ID_Reserva";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue("@ID_Reserva", id);

            using SqlDataReader reader = await comando.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return MapearReserva(reader);
            }

            return null;
        }

        public async Task<ReservaDTO> RegistrarAsync(
            CrearReservaDTO dto)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            using SqlCommand comando = new SqlCommand(
                "res.sp_RegistrarReserva",
                conexion);

            comando.CommandType =
                System.Data.CommandType.StoredProcedure;

            comando.Parameters.AddWithValue(
                "@ID_Departamento",
                dto.ID_Departamento);

            comando.Parameters.AddWithValue(
                "@ID_Inquilino",
                dto.ID_Inquilino);

            comando.Parameters.AddWithValue(
                "@Fecha_Ingreso",
                dto.Fecha_Ingreso);

            comando.Parameters.AddWithValue(
                "@Fecha_Salida",
                dto.Fecha_Salida);

            comando.Parameters.AddWithValue(
                "@Cantidad_Huespedes",
                dto.Cantidad_Huespedes);

            int idGenerado = Convert.ToInt32(
                await comando.ExecuteScalarAsync());

            return (await ObtenerAsync(idGenerado))!;
        }

        public async Task<ReservaDTO?> ActualizarAsync(
            int id,
            ActualizarReservaDTO dto)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                UPDATE res.Reserva
                SET
                    Fecha_Ingreso = @Fecha_Ingreso,
                    Fecha_Salida = @Fecha_Salida,
                    Cantidad_Huespedes = @Cantidad_Huespedes,
                    Estado = @Estado
                WHERE ID_Reserva = @ID_Reserva";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue(
                "@ID_Reserva",
                id);

            comando.Parameters.AddWithValue(
                "@Fecha_Ingreso",
                dto.Fecha_Ingreso);

            comando.Parameters.AddWithValue(
                "@Fecha_Salida",
                dto.Fecha_Salida);

            comando.Parameters.AddWithValue(
                "@Cantidad_Huespedes",
                dto.Cantidad_Huespedes);

            comando.Parameters.AddWithValue(
                "@Estado",
                dto.Estado);

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
                DELETE FROM res.Reserva
                WHERE ID_Reserva = @ID_Reserva";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue(
                "@ID_Reserva",
                id);

            int filas = await comando.ExecuteNonQueryAsync();

            return filas > 0;
        }

        private ReservaDTO MapearReserva(SqlDataReader reader)
        {
            return new ReservaDTO
            {
                ID_Reserva = reader.GetInt32(
                    reader.GetOrdinal("ID_Reserva")),

                ID_Departamento = reader.GetInt32(
                    reader.GetOrdinal("ID_Departamento")),

                ID_Inquilino = reader.GetInt32(
                    reader.GetOrdinal("ID_Inquilino")),

                Fecha_Ingreso = reader.GetDateTime(
                    reader.GetOrdinal("Fecha_Ingreso")),

                Fecha_Salida = reader.GetDateTime(
                    reader.GetOrdinal("Fecha_Salida")),

                Cantidad_Huespedes = reader.GetInt32(
                    reader.GetOrdinal("Cantidad_Huespedes")),

                Estado = reader.GetString(
                    reader.GetOrdinal("Estado")),

                Fecha_Creacion = reader.GetDateTime(
                    reader.GetOrdinal("Fecha_Creacion"))
            };
        }
    }
}