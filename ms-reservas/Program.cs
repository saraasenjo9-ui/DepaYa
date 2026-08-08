using ms_reservas.Data;
using ms_reservas.Interfaces;
using ms_reservas.Repositorios;
using ms_reservas.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddScoped<ConexionBD>();
builder.Services.AddScoped<IReservaRepository, ReservaRepository>();
builder.Services.AddScoped<IReservaService, ReservaService>();

var app = builder.Build();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();