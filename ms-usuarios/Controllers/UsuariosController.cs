using Microsoft.AspNetCore.Mvc;
using ms_usuarios.DTOs;
using ms_usuarios.Interfaces;

namespace ms_usuarios.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuarioController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UsuarioDTO>>> Listar()
        {
            var usuarios = await _usuarioService.ListarAsync();

            return Ok(usuarios);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UsuarioDTO>> Obtener(int id)
        {
            var usuario = await _usuarioService.ObtenerAsync(id);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado"
                });
            }

            return Ok(usuario);
        }

        [HttpPost]
        public async Task<ActionResult<UsuarioDTO>> Registrar(
            CrearUsuarioDTO dto)
        {
            var usuario = await _usuarioService.RegistrarAsync(dto);

            return CreatedAtAction(
                nameof(Obtener),
                new { id = usuario.ID_Usuario },
                usuario);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UsuarioDTO>> Actualizar(
            int id,
            ActualizarUsuarioDTO dto)
        {
            var usuario = await _usuarioService.ActualizarAsync(id, dto);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado"
                });
            }

            return Ok(usuario);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var eliminado = await _usuarioService.EliminarAsync(id);

            if (!eliminado)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado"
                });
            }

            return Ok(new
            {
                mensaje = "Usuario eliminado correctamente"
            });
        }
    }
}