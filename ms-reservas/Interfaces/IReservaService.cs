using ms_reservas.DTOs;

namespace ms_reservas.Interfaces
{
    public interface IReservaService
    {
        Task<IEnumerable<ReservaDTO>> ListarAsync();

        Task<ReservaDTO?> ObtenerAsync(int id);

        Task<ReservaDTO> RegistrarAsync(CrearReservaDTO dto);

        Task<ReservaDTO?> ActualizarAsync(
            int id,
            ActualizarReservaDTO dto);

        Task<bool> EliminarAsync(int id);
    }
}