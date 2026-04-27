using System.CommandLine;
using System.CommandLine.Invocation;
using Spectre.Console;

namespace FogNetX.CLI
{
    class Program
    {
        static async Task<int> Main(string[] args)
        {
            var rootCommand = CreateRootCommand();
            return await rootCommand.InvokeAsync(args);
        }

        private static RootCommand CreateRootCommand()
        {
            var rootCommand = new RootCommand("FOGNET-X Management CLI - Cross-platform Docker management");

            // Status command
            var statusCommand = new Command("status", "Show FOGNET-X service status");
            statusCommand.Handler = CommandHandler.Create(async () =>
            {
                AnsiConsole.MarkupLine("[bold cyan]Checking FOGNET-X status...[/]");
                
                try
                {
                    var dockerService = new DockerServiceWrapper();
                    var connected = await dockerService.ConnectAsync();
                    
                    if (!connected)
                    {
                        AnsiConsole.MarkupLine("[red]✗ Cannot connect to Docker[/]");
                        return 1;
                    }
                    
                    AnsiConsole.MarkupLine("[green]✓ Connected to Docker[/]");
                    
                    var containers = await dockerService.GetFogNetXContainersAsync();
                    
                    var table = new Table();
                    table.AddColumn("Container");
                    table.AddColumn("Status");
                    table.AddColumn("Ports");
                    
                    foreach (var container in containers)
                    {
                        var status = container.State == "running" 
                            ? "[green]Running[/]" 
                            : "[yellow]Stopped[/]";
                        
                        var ports = string.Join(", ", 
                            container.Ports?.Select(p => $"{p.PublicPort ?? 0}->{p.PrivatePort}") ?? 
                            Enumerable.Empty<string>());
                        
                        table.AddRow(container.Names.FirstOrDefault()?.TrimStart('/') ?? "N/A", 
                                   status, ports);
                    }
                    
                    AnsiConsole.Write(table);
                    
                    var runningCount = containers.Count(c => c.State == "running");
                    AnsiConsole.MarkupLine($"\n[bold]Summary:[/] {runningCount}/{containers.Count} containers running");
                }
                catch (Exception ex)
                {
                    AnsiConsole.MarkupLine($"[red]Error: {ex.Message}[/]");
                    return 1;
                }
            });

            // Start command
            var startCommand = new Command("start", "Start FOGNET-X services");
            startCommand.Handler = CommandHandler.Create(async () =>
            {
                AnsiConsole.MarkupLine("[bold cyan]Starting FOGNET-X services...[/]");
                
                try
                {
                    var dockerService = new DockerServiceWrapper();
                    var result = await dockerService.StartServicesAsync();
                    
                    if (result)
                        AnsiConsole.MarkupLine("[green]✓ Services started successfully[/]");
                    else
                        AnsiConsole.MarkupLine("[red]✗ Failed to start services[/]");
                }
                catch (Exception ex)
                {
                    AnsiConsole.MarkupLine($"[red]Error: {ex.Message}[/]");
                    return 1;
                }
            });

            // Stop command
            var stopCommand = new Command("stop", "Stop FOGNET-X services");
            stopCommand.Handler = CommandHandler.Create(async () =>
            {
                AnsiConsole.MarkupLine("[bold yellow]Stopping FOGNET-X services...[/]");
                
                try
                {
                    var dockerService = new DockerServiceWrapper();
                    var result = await dockerService.StopServicesAsync();
                    
                    if (result)
                        AnsiConsole.MarkupLine("[green]✓ Services stopped successfully[/]");
                    else
                        AnsiConsole.MarkupLine("[red]✗ Failed to stop services[/]");
                }
                catch (Exception ex)
                {
                    AnsiConsole.MarkupLine($"[red]Error: {ex.Message}[/]");
                    return 1;
                }
            });

            // Restart command
            var restartCommand = new Command("restart", "Restart FOGNET-X services");
            restartCommand.Handler = CommandHandler.Create(async () =>
            {
                AnsiConsole.MarkupLine("[bold cyan]Restarting FOGNET-X services...[/]");
                
                try
                {
                    var dockerService = new DockerServiceWrapper();
                    var result = await dockerService.RestartServicesAsync();
                    
                    if (result)
                        AnsiConsole.MarkupLine("[green]✓ Services restarted successfully[/]");
                    else
                        AnsiConsole.MarkupLine("[red]✗ Failed to restart services[/]");
                }
                catch (Exception ex)
                {
                    AnsiConsole.MarkupLine($"[red]Error: {ex.Message}[/]");
                    return 1;
                }
            });

            // Logs command
            var logsCommand = new Command("logs", "View FOGNET-X logs")
            {
                new Option<int>("--tail", () => 100, "Number of lines to display"),
                new Option<bool>("--follow", "Follow log output")
            };
            logsCommand.Handler = CommandHandler.Create(async (int tail, bool follow) =>
            {
                try
                {
                    var dockerService = new DockerServiceWrapper();
                    var logs = await dockerService.GetLogsAsync(tail);
                    
                    AnsiConsole.WriteLine(logs);
                }
                catch (Exception ex)
                {
                    AnsiConsole.MarkupLine($"[red]Error: {ex.Message}[/]");
                    return 1;
                }
            });

            // Doctor command
            var doctorCommand = new Command("doctor", "Diagnose FOGNET-X installation");
            doctorCommand.Handler = CommandHandler.Create(async () =>
            {
                AnsiConsole.MarkupLine("[bold cyan]Running diagnostics...[/]\n");
                
                var issues = new List<string>();
                
                // Check Docker
                AnsiConsole.Markup("[bold]Docker:[/] ");
                try
                {
                    var dockerService = new DockerServiceWrapper();
                    var connected = await dockerService.ConnectAsync();
                    
                    if (connected)
                    {
                        var info = await dockerService.GetDockerInfoAsync();
                        AnsiConsole.MarkupLine($"[green]✓ {info}[/]");
                    }
                    else
                    {
                        AnsiConsole.MarkupLine("[red]✗ Not running[/]");
                        issues.Add("Docker not running");
                    }
                }
                catch (Exception ex)
                {
                    AnsiConsole.MarkupLine($"[red]✗ {ex.Message}[/]");
                    issues.Add("Docker connection failed");
                }
                
                // Check configuration
                AnsiConsole.Markup("[bold]Configuration:[/] ");
                var configPath = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                    "FOGNET-X", "config");
                
                if (Directory.Exists(configPath))
                    AnsiConsole.MarkupLine("[green]✓ Found[/]");
                else
                {
                    AnsiConsole.MarkupLine("[yellow]⚠ Not found[/]");
                    issues.Add("Configuration directory missing");
                }
                
                // Check containers
                AnsiConsole.Markup("[bold]Containers:[/] ");
                try
                {
                    var dockerService = new DockerServiceWrapper();
                    var containers = await dockerService.GetFogNetXContainersAsync();
                    
                    if (containers.Any())
                    {
                        var running = containers.Count(c => c.State == "running");
                        AnsiConsole.MarkupLine($"[green]✓ {running}/{containers.Count} running[/]");
                    }
                    else
                    {
                        AnsiConsole.MarkupLine("[yellow]⚠ No containers found[/]");
                        issues.Add("No FOGNET-X containers");
                    }
                }
                catch
                {
                    AnsiConsole.MarkupLine("[red]✗ Cannot check[/]");
                    issues.Add("Cannot check containers");
                }
                
                // Summary
                AnsiConsole.MarkupLine("\n[bold]Summary:[/]");
                if (issues.Any())
                {
                    AnsiConsole.MarkupLine($"[red]Found {issues.Count} issue(s):[/]");
                    foreach (var issue in issues)
                        AnsiConsole.MarkupLine($"  [red]- {issue}[/]");
                }
                else
                {
                    AnsiConsole.MarkupLine("[green]All checks passed! ✓[/]");
                }
            });

            // Add commands to root
            rootCommand.AddCommand(statusCommand);
            rootCommand.AddCommand(startCommand);
            rootCommand.AddCommand(stopCommand);
            rootCommand.AddCommand(restartCommand);
            rootCommand.AddCommand(logsCommand);
            rootCommand.AddCommand(doctorCommand);

            return rootCommand;
        }
    }

    /// <summary>
    /// Simple Docker wrapper for CLI operations
    /// </summary>
    class DockerServiceWrapper
    {
        private Docker.DotNet.IDockerClient? _client;

        public async Task<bool> ConnectAsync()
        {
            try
            {
                var dockerUri = OperatingSystem.IsWindows()
                    ? "npipe://./pipe/docker_engine"
                    : "unix:///var/run/docker.sock";

                _client = new Docker.DotNet.DockerClientConfiguration(new Uri(dockerUri))
                    .CreateClient();

                await _client.System.GetSystemInfoAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> GetDockerInfoAsync()
        {
            if (_client == null)
                throw new InvalidOperationException("Not connected");

            var info = await _client.System.GetSystemInfoAsync();
            return $"Docker {info.ServerVersion}";
        }

        public async Task<List<Docker.DotNet.Models.ContainerListResponse>> GetFogNetXContainersAsync()
        {
            if (_client == null)
                throw new InvalidOperationException("Not connected");

            var containers = await _client.Containers.ListContainersAsync(
                new Docker.DotNet.Models.ContainersListParameters { All = true });

            return containers.FindAll(c => 
                c.Names.Any(n => n.Contains("fognetx", StringComparison.OrdinalIgnoreCase)));
        }

        public async Task<bool> RunCommandAsync(string args)
        {
            var startInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = OperatingSystem.IsWindows() ? "docker-compose.cmd" : "docker-compose",
                Arguments = args,
                WorkingDirectory = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                    "FOGNET-X", "config"),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(startInfo);
            if (process == null)
                return false;

            await process.StandardOutput.ReadToEndAsync();
            await process.StandardError.ReadToEndAsync();
            
            await Task.Run(() => process.WaitForExit());
            
            return process.ExitCode == 0;
        }

        public Task<bool> StartServicesAsync() => RunCommandAsync("up -d");
        public Task<bool> StopServicesAsync() => RunCommandAsync("down");
        public async Task<bool> RestartServicesAsync()
        {
            await StopServicesAsync();
            await Task.Delay(2000);
            return await StartServicesAsync();
        }

        public async Task<string> GetLogsAsync(int tailLines = 100)
        {
            var startInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = OperatingSystem.IsWindows() ? "docker-compose.cmd" : "docker-compose",
                Arguments = $"logs --tail {tailLines}",
                WorkingDirectory = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                    "FOGNET-X", "config"),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(startInfo);
            if (process == null)
                return "Error starting process";

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            
            await Task.Run(() => process.WaitForExit());

            return string.IsNullOrEmpty(output) ? error : output;
        }
    }
}
