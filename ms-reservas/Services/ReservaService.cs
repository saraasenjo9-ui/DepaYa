using ms_reservas.DTOs;
using ms_reservas.Interfaces;

namespace ms_reservas.Services
{
    public class ReservaService : IReservaService
    {
        private readonly IReservaRepository _reservaRepository;

        public ReservaService(IReservaRepository reservaRepository)
        {
            _reservaRepository = reservaRepository;
        }

        public async Task<IEnumerable<ReservaDTO>> ListarAsync()
        {
            return await _reservaRepository.ListarAsync();
        }

        public async Task<ReservaDTO?> ObtenerAsync(int id)
        {
            return await _reservaRepository.ObtenerAsync(id);
        }

        public async Task<ReservaDTO> RegistrarAsync(CrearReservaDTO dto)
        {
            return await _reservaRepository.RegistrarAsync(dto);
        }

        public async Task<ReservaDTO?> ActualizarAsync(
            int id,
            ActualizarReservaDTO dto)
        {
            return await _reservaRepository.ActualizarAsync(id, dto);
        }

        public async Task<bool> EliminarAsync(int id)
        {
            return await _reservaRepository.EliminarAsync(id);
        }
    }
}