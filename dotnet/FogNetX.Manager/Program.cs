using System;
using System.Windows.Forms;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Events;

namespace FOGNETX.Manager
{
    /// <summary>
    /// Application entry point
    /// </summary>
    public class Program
    {
        [STAThread]
        static void Main()
        {
            // Configure logging
            Log.Logger = new LoggerConfiguration()
                .WriteTo.File("logs/fognetx-manager-.log", rollingInterval: RollingInterval.Day)
                .CreateLogger();

            try
            {
                var services = ConfigureServices();
                var serviceProvider = services.BuildServiceProvider();

                var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogInformation("FOGNET-X Manager starting...");

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                var mainForm = serviceProvider.GetRequiredService<MainForm>();
                Application.Run(mainForm);
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Application terminated unexpectedly");
                
                MessageBox.Show(
                    $"FOGNET-X Manager encountered an error:\n\n{ex.Message}\n\nThe application will now close.",
                    "Application Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        private static IServiceCollection ConfigureServices()
        {
            var services = new ServiceCollection();

            // Configure Serilog
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.File("logs/fognetx-manager-.log", rollingInterval: RollingInterval.Day)
                .CreateLogger();

            // Services
            services.AddSingleton<Services.DockerService>();

            // Forms
            services.AddTransient<MainForm>();
            services.AddTransient<LogsForm>();

            return services;
        }
    }
}
