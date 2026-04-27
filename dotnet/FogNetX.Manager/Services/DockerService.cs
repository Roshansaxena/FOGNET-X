using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.Extensions.Logging;

namespace FOGNETX.Manager.Services
{
    /// <summary>
    /// Docker service for managing FOGNET-X containers
    /// </summary>
    public class DockerService : IDisposable
    {
        private IDockerClient? _client;
        private readonly string _configDir;
        private readonly ILogger<DockerService> _logger;

        public DockerService(ILogger<DockerService> logger)
        {
            _logger = logger;
            _configDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), 
                                      "FOGNET-X", "config");
            
            if (!Directory.Exists(_configDir))
            {
                Directory.CreateDirectory(_configDir);
            }
        }

        public async Task<bool> ConnectAsync()
        {
            try
            {
                var dockerUri = Environment.OSVersion.Platform == PlatformID.Win32NT
                    ? "npipe://./pipe/docker_engine"
                    : "unix:///var/run/docker.sock";

                _client = new DockerClientConfiguration(new Uri(dockerUri))
                    .CreateClient();

                // Test connection
                var sysInfo = await _client.System.GetSystemInfoAsync();
                _logger.LogInformation($"Connected to Docker: {sysInfo.ServerVersion}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to Docker");
                return false;
            }
        }

        public async Task<bool> IsDockerRunningAsync()
        {
            try
            {
                if (_client == null)
                    await ConnectAsync();

                if (_client != null)
                {
                    await _client.System.GetSystemInfoAsync();
                    return true;
                }
            }
            catch
            {
                // Docker not running or not accessible
            }
            return false;
        }

        public async Task<List<ContainerListResponse>> GetFogNetXContainersAsync()
        {
            var containers = new List<ContainerListResponse>();
            
            try
            {
                if (_client == null)
                    await ConnectAsync();

                if (_client != null)
                {
                    containers = _client.Containers.ListContainersAsync(
                        new ContainersListParameters { All = true }).Result
                        .Where(c => c.Names.Any(n => n.Contains("fognetx", StringComparison.OrdinalIgnoreCase)))
                        .ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing containers");
            }

            return containers;
        }

        public async Task<bool> StartServicesAsync()
        {
            try
            {
                if (_client == null)
                    await ConnectAsync();

                if (_client == null || !Directory.Exists(_configDir))
                    return false;

                var (success, output) = await RunDockerComposeCommand("up -d");
                _logger.LogInformation("FOGNET-X services started: {Output}", output);
                return success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting services");
                return false;
            }
        }

        public async Task<bool> StopServicesAsync()
        {
            try
            {
                if (_client == null)
                    await ConnectAsync();

                if (_client == null || !Directory.Exists(_configDir))
                    return false;

                var (success, output) = await RunDockerComposeCommand("down");
                _logger.LogInformation("FOGNET-X services stopped: {Output}", output);
                return success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping services");
                return false;
            }
        }

        public async Task<bool> RestartServicesAsync()
        {
            await StopServicesAsync();
            await Task.Delay(2000);
            return await StartServicesAsync();
        }

        public async Task<string> GetLogsAsync(int tailLines = 100)
        {
            try
            {
                if (!Directory.Exists(_configDir))
                    return string.Empty;

                var (success, output) = await RunDockerComposeCommand($"logs --tail {tailLines}");
                return success ? output : $"Error: {output}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting logs");
                return $"Error: {ex.Message}";
            }
        }

        public async Task<(bool Success, string Output)> RunDockerComposeCommand(string args)
        {
            try
            {
                var startInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "docker-compose",
                    Arguments = args,
                    WorkingDirectory = _configDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = System.Diagnostics.Process.Start(startInfo);
                if (process == null)
                    return (false, "Failed to start process");

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();
                
                await Task.Run(() => process.WaitForExit());

                if (process.ExitCode != 0)
                    return (false, string.IsNullOrEmpty(error) ? output : error);

                return (true, string.IsNullOrEmpty(output) ? "Command executed successfully" : output);
            }
            catch (Exception ex)
            {
                return (false, $"Error: {ex.Message}");
            }
        }

        public async Task<ServiceStatus> GetServiceStatusAsync()
        {
            var status = new ServiceStatus();
            
            try
            {
                var containers = await GetFogNetXContainersAsync();
                
                status.TotalContainers = containers.Count;
                status.RunningContainers = containers.Count(c => c.State == "running");
                status.StoppedContainers = containers.Count(c => c.State != "running");
                
                status.IsRunning = status.RunningContainers > 0 && status.StoppedContainers == 0;
                status.IsPartiallyRunning = status.RunningContainers > 0 && status.StoppedContainers > 0;
                status.IsStopped = status.RunningContainers == 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting service status");
                status.Error = ex.Message;
            }

            return status;
        }

        public void Dispose()
        {
            _client?.Dispose();
            GC.SuppressFinalize(this);
        }
    }

    public class ServiceStatus
    {
        public int TotalContainers { get; set; }
        public int RunningContainers { get; set; }
        public int StoppedContainers { get; set; }
        public bool IsRunning { get; set; }
        public bool IsPartiallyRunning { get; set; }
        public bool IsStopped { get; set; }
        public string? Error { get; set; }
    }
}
