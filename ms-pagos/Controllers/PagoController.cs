using Microsoft.AspNetCore.Mvc;
using ms_pagos.DTOs;
using ms_pagos.Interfaces;

namespace ms_pagos.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagoController : ControllerBase
    {
        private readonly IPagoService _pagoService;

        public PagoController(IPagoService pagoService)
        {
            _pagoService = pagoService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PagoDTO>>> Listar()
        {
            var pagos = await _pagoService.ListarAsync();

            return Ok(pagos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PagoDTO>> Obtener(int id)
        {
            var pago = await _pagoService.ObtenerAsync(id);

            if (pago == null)
            {
                return NotFound(new
                {
                    mensaje = "Pago no encontrado."
                });
            }

            return Ok(pago);
        }

        [HttpPost]
        public async Task<ActionResult<PagoDTO>> Registrar(
            [FromBody] CrearPagoDTO dto)
        {
            var pago = await _pagoService.RegistrarAsync(dto);

            return CreatedAtAction(
                nameof(Obtener),
                new { id = pago.ID_Pago },
                pago);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<PagoDTO>> Actualizar(
            int id,
            [FromBody] ActualizarPagoDTO dto)
        {
            var pago = await _pagoService.ActualizarAsync(id, dto);

            if (pago == null)
            {
                return NotFound(new
                {
                    mensaje = "Pago no encontrado."
                });
            }

            return Ok(pago);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var eliminado = await _pagoService.EliminarAsync(id);

            if (!eliminado)
            {
                return NotFound(new
                {
                    mensaje = "Pago no encontrado."
                });
            }

            return Ok(new
            {
                mensaje = "Pago eliminado correctamente."
            });
        }
    }
}