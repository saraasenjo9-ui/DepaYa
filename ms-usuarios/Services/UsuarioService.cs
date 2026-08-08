using ms_usuarios.DTOs;
using ms_usuarios.Interfaces;

namespace ms_usuarios.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuarioService(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<IEnumerable<UsuarioDTO>> ListarAsync()
        {
            return await _usuarioRepository.ListarAsync();
        }

        public async Task<UsuarioDTO?> ObtenerAsync(int id)
        {
            return await _usuarioRepository.ObtenerAsync(id);
        }

        public async Task<UsuarioDTO> RegistrarAsync(
            CrearUsuarioDTO dto)
        {
            return await _usuarioRepository.RegistrarAsync(dto);
        }

        public async Task<UsuarioDTO?> ActualizarAsync(
            int id,
            ActualizarUsuarioDTO dto)
        {
            return await _usuarioRepository.ActualizarAsync(id, dto);
        }

        public async Task<bool> EliminarAsync(int id)
        {
            return await _usuarioRepository.EliminarAsync(id);
        }
    }
}