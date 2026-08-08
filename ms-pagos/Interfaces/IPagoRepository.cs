using ms_pagos.DTOs;

namespace ms_pagos.Interfaces
{
    public interface IPagoRepository
    {
        Task<IEnumerable<PagoDTO>> ListarAsync();

        Task<PagoDTO?> ObtenerAsync(int id);

        Task<PagoDTO> RegistrarAsync(CrearPagoDTO dto);

        Task<PagoDTO?> ActualizarAsync(
            int id,
            ActualizarPagoDTO dto);

        Task<bool> EliminarAsync(int id);
    }
}