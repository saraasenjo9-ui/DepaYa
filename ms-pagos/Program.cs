using ms_pagos.Data;
using ms_pagos.Interfaces;
using ms_pagos.Repositorios;
using ms_pagos.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddScoped<ConexionBD>();
builder.Services.AddScoped<IPagoRepository, PagoRepository>();
builder.Services.AddScoped<IPagoService, PagoService>();

var app = builder.Build();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
