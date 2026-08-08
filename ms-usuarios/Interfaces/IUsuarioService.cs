using ms_usuarios.DTOs;

namespace ms_usuarios.Interfaces
{
    public interface IUsuarioService
    {
        Task<IEnumerable<UsuarioDTO>> ListarAsync();

        Task<UsuarioDTO?> ObtenerAsync(int id);

        Task<UsuarioDTO> RegistrarAsync(CrearUsuarioDTO dto);

        Task<UsuarioDTO?> ActualizarAsync(
            int id,
            ActualizarUsuarioDTO dto);

        Task<bool> EliminarAsync(int id);
    }
}