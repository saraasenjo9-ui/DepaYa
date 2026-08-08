using Microsoft.AspNetCore.Mvc;
using ms_reservas.DTOs;
using ms_reservas.Interfaces;

namespace ms_reservas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservaController : ControllerBase
    {
        private readonly IReservaService _reservaService;

        public ReservaController(IReservaService reservaService)
        {
            _reservaService = reservaService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReservaDTO>>> Listar()
        {
            var reservas = await _reservaService.ListarAsync();

            return Ok(reservas);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ReservaDTO>> Obtener(int id)
        {
            var reserva = await _reservaService.ObtenerAsync(id);

            if (reserva == null)
            {
                return NotFound(new
                {
                    mensaje = "Reserva no encontrada."
                });
            }

            return Ok(reserva);
        }

        [HttpPost]
        public async Task<ActionResult<ReservaDTO>> Registrar(
            [FromBody] CrearReservaDTO dto)
        {
            var reserva = await _reservaService.RegistrarAsync(dto);

            return CreatedAtAction(
                nameof(Obtener),
                new { id = reserva.ID_Reserva },
                reserva);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ReservaDTO>> Actualizar(
            int id,
            [FromBody] ActualizarReservaDTO dto)
        {
            var reserva = await _reservaService.ActualizarAsync(id, dto);

            if (reserva == null)
            {
                return NotFound(new
                {
                    mensaje = "Reserva no encontrada."
                });
            }

            return Ok(reserva);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var eliminado = await _reservaService.EliminarAsync(id);

            if (!eliminado)
            {
                return NotFound(new
                {
                    mensaje = "Reserva no encontrada."
                });
            }

            return Ok(new
            {
                mensaje = "Reserva eliminada correctamente."
            });
        }
    }
}