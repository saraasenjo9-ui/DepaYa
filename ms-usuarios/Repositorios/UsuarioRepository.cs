using Microsoft.Data.SqlClient;
using ms_usuarios.Data;
using ms_usuarios.DTOs;
using ms_usuarios.Interfaces;

namespace ms_usuarios.Repositorios
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly ConexionBD _conexionBD;

        public UsuarioRepository(ConexionBD conexionBD)
        {
            _conexionBD = conexionBD;
        }

        public async Task<IEnumerable<UsuarioDTO>> ListarAsync()
        {
            var usuarios = new List<UsuarioDTO>();

            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                SELECT
                    ID_Usuario,
                    Azure_Object_ID,
                    Nombre,
                    Apellido,
                    Tipo_Documento,
                    Numero_Documento,
                    Correo,
                    Telefono,
                    Rol,
                    Fecha_Registro
                FROM usr.Usuario
                ORDER BY ID_Usuario DESC";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            using SqlDataReader reader = await comando.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                usuarios.Add(MapearUsuario(reader));
            }

            return usuarios;
        }

        public async Task<UsuarioDTO?> ObtenerAsync(int id)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                SELECT
                    ID_Usuario,
                    Azure_Object_ID,
                    Nombre,
                    Apellido,
                    Tipo_Documento,
                    Numero_Documento,
                    Correo,
                    Telefono,
                    Rol,
                    Fecha_Registro
                FROM usr.Usuario
                WHERE ID_Usuario = @ID_Usuario";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue("@ID_Usuario", id);

            using SqlDataReader reader = await comando.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return MapearUsuario(reader);
            }

            return null;
        }

        public async Task<UsuarioDTO> RegistrarAsync(
            CrearUsuarioDTO dto)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                INSERT INTO usr.Usuario
                (
                    Azure_Object_ID,
                    Nombre,
                    Apellido,
                    Tipo_Documento,
                    Numero_Documento,
                    Correo,
                    Telefono,
                    Rol
                )
                VALUES
                (
                    @Azure_Object_ID,
                    @Nombre,
                    @Apellido,
                    @Tipo_Documento,
                    @Numero_Documento,
                    @Correo,
                    @Telefono,
                    @Rol
                );

                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue(
                "@Azure_Object_ID",
                dto.Azure_Object_ID.HasValue
                    ? dto.Azure_Object_ID
                    : DBNull.Value);

            comando.Parameters.AddWithValue(
                "@Nombre",
                dto.Nombre);

            comando.Parameters.AddWithValue(
                "@Apellido",
                dto.Apellido);

            comando.Parameters.AddWithValue(
                "@Tipo_Documento",
                dto.Tipo_Documento);

            comando.Parameters.AddWithValue(
                "@Numero_Documento",
                dto.Numero_Documento);

            comando.Parameters.AddWithValue(
                "@Correo",
                dto.Correo);

            comando.Parameters.AddWithValue(
                "@Telefono",
                dto.Telefono);

            comando.Parameters.AddWithValue(
                "@Rol",
                dto.Rol);

            int idGenerado = Convert.ToInt32(
                await comando.ExecuteScalarAsync());

            return (await ObtenerAsync(idGenerado))!;
        }

        public async Task<UsuarioDTO?> ActualizarAsync(
            int id,
            ActualizarUsuarioDTO dto)
        {
            using SqlConnection conexion = _conexionBD.ObtenerConexion();

            await conexion.OpenAsync();

            string sql = @"
                UPDATE usr.Usuario
                SET
                    Nombre = @Nombre,
                    Apellido = @Apellido,
                    Tipo_Documento = @Tipo_Documento,
                    Numero_Documento = @Numero_Documento,
                    Correo = @Correo,
                    Telefono = @Telefono,
                    Rol = @Rol
                WHERE ID_Usuario = @ID_Usuario";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue(
                "@ID_Usuario",
                id);

            comando.Parameters.AddWithValue(
                "@Nombre",
                dto.Nombre);

            comando.Parameters.AddWithValue(
                "@Apellido",
                dto.Apellido);

            comando.Parameters.AddWithValue(
                "@Tipo_Documento",
                dto.Tipo_Documento);

            comando.Parameters.AddWithValue(
                "@Numero_Documento",
                dto.Numero_Documento);

            comando.Parameters.AddWithValue(
                "@Correo",
                dto.Correo);

            comando.Parameters.AddWithValue(
                "@Telefono",
                dto.Telefono);

            comando.Parameters.AddWithValue(
                "@Rol",
                dto.Rol);

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
                DELETE FROM usr.Usuario
                WHERE ID_Usuario = @ID_Usuario";

            using SqlCommand comando = new SqlCommand(sql, conexion);

            comando.Parameters.AddWithValue(
                "@ID_Usuario",
                id);

            int filas = await comando.ExecuteNonQueryAsync();

            return filas > 0;
        }

        private UsuarioDTO MapearUsuario(SqlDataReader reader)
        {
            return new UsuarioDTO
            {
                ID_Usuario = reader.GetInt32(
                    reader.GetOrdinal("ID_Usuario")),

                Azure_Object_ID = reader.IsDBNull(
                    reader.GetOrdinal("Azure_Object_ID"))
                    ? null
                    : reader.GetGuid(
                        reader.GetOrdinal("Azure_Object_ID")),

                Nombre = reader.GetString(
                    reader.GetOrdinal("Nombre")),

                Apellido = reader.GetString(
                    reader.GetOrdinal("Apellido")),

                Tipo_Documento = reader.GetString(
                    reader.GetOrdinal("Tipo_Documento")),

                Numero_Documento = reader.GetString(
                    reader.GetOrdinal("Numero_Documento")),

                Correo = reader.GetString(
                    reader.GetOrdinal("Correo")),

                Telefono = reader.GetString(
                    reader.GetOrdinal("Telefono")),

                Rol = reader.GetString(
                    reader.GetOrdinal("Rol")),

                Fecha_Registro = reader.GetDateTime(
                    reader.GetOrdinal("Fecha_Registro"))
            };
        }
    }
}