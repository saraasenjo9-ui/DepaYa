using ms_pagos.DTOs;
using ms_pagos.Interfaces;

namespace ms_pagos.Services
{
    public class PagoService : IPagoService
    {
        private readonly IPagoRepository _pagoRepository;

        public PagoService(IPagoRepository pagoRepository)
        {
            _pagoRepository = pagoRepository;
        }

        public async Task<IEnumerable<PagoDTO>> ListarAsync()
        {
            return await _pagoRepository.ListarAsync();
        }

        public async Task<PagoDTO?> ObtenerAsync(int id)
        {
            return await _pagoRepository.ObtenerAsync(id);
        }

        public async Task<PagoDTO> RegistrarAsync(CrearPagoDTO dto)
        {
            return await _pagoRepository.RegistrarAsync(dto);
        }

        public async Task<PagoDTO?> ActualizarAsync(
            int id,
            ActualizarPagoDTO dto)
        {
            return await _pagoRepository.ActualizarAsync(id, dto);
        }

        public async Task<bool> EliminarAsync(int id)
        {
            return await _pagoRepository.EliminarAsync(id);
        }
    }
}