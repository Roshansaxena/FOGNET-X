using System;
using System.Drawing;
using System.Windows.Forms;
using FOGNETX.Manager.Services;
using Microsoft.Extensions.Logging;

namespace FOGNETX.Manager
{
    /// <summary>
    /// Main form for FOGNET-X Manager
    /// </summary>
    public partial class MainForm : Form
    {
        private readonly DockerService _dockerService;
        private readonly ILogger<MainForm> _logger;
        private System.Windows.Forms.Timer? _refreshTimer;
        private NotifyIcon? _notifyIcon;
        private ContextMenuStrip? _trayMenu;

        public MainForm(DockerService dockerService, ILogger<MainForm> logger)
        {
            _dockerService = dockerService;
            _logger = logger;
            
            InitializeUI();
            InitializeTrayIcon();
            InitializeRefreshTimer();
            
            this.Load += async (s, e) => await OnFormLoadAsync();
        }

        private void InitializeUI()
        {
            // Form settings
            this.Text = "FOGNET-X Manager";
            this.Size = new Size(1024, 768);
            this.MinimumSize = new Size(800, 600);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            
            // Create main menu
            var menuStrip = new MenuStrip();
            
            var fileMenu = new ToolStripMenuItem("&File");
            var startItem = new ToolStripMenuItem("&Start Services", null, async (s, e) => await StartServices_ClickAsync());
            var stopItem = new ToolStripMenuItem("S&top Services", null, async (s, e) => await StopServices_ClickAsync());
            var restartItem = new ToolStripMenuItem("&Restart Services", null, async (s, e) => await RestartServices_ClickAsync());
            fileMenu.DropDownItems.AddRange(new[] { startItem, stopItem, restartItem });
            fileMenu.DropDownItems.Add(new ToolStripSeparator());
            var exitItem = new ToolStripMenuItem("E&xit", null, (s, e) => Close());
            fileMenu.DropDownItems.Add(exitItem);
            
            var viewMenu = new ToolStripMenuItem("&View");
            var refreshItem = new ToolStripMenuItem("&Refresh", null, async (s, e) => await RefreshStatusAsync());
            var logsItem = new ToolStripMenuItem("&Logs", null, (s, e) => ShowLogs());
            viewMenu.DropDownItems.AddRange(new[] { refreshItem, logsItem });
            
            var helpMenu = new ToolStripMenuItem("&Help");
            var aboutItem = new ToolStripMenuItem("&About", null, (s, e) => ShowAbout());
            helpMenu.DropDownItems.Add(aboutItem);
            
            menuStrip.Items.AddRange(new[] { fileMenu, viewMenu, helpMenu });
            this.MainMenuStrip = menuStrip;
            
            // Create status bar
            var statusBar = new StatusStrip();
            lblStatus = new ToolStripStatusLabel("Initializing...");
            lblContainers = new ToolStripStatusLabel("Containers: --");
            lblUptime = new ToolStripStatusLabel("Uptime: --");
            statusBar.Items.AddRange(new[] { lblStatus, lblContainers, lblUptime });
            
            // Create main panel
            var mainPanel = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 2,
                Padding = new Padding(10)
            };
            mainPanel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            mainPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            
            // Service control panel
            var controlPanel = CreateControlPanel();
            mainPanel.Controls.Add(controlPanel, 0, 0);
            
            // Status panel
            var statusPanel = CreateStatusPanel();
            mainPanel.Controls.Add(statusPanel, 0, 1);
            
            this.Controls.Add(mainPanel);
            this.Controls.Add(menuStrip);
            this.Controls.Add(statusBar);
        }

        private Panel CreateControlPanel()
        {
            var panel = new FlowLayoutPanel
            {
                Dock = DockStyle.Top,
                AutoSize = true,
                FlowDirection = FlowDirection.LeftToRight,
                Padding = new Padding(5)
            };

            var btnStart = CreateActionButton("▶ Start", Color.FromArgb(16, 185, 129), 
                async (s, e) => await StartServices_ClickAsync());
            var btnStop = CreateActionButton("⏹ Stop", Color.FromArgb(239, 68, 68), 
                async (s, e) => await StopServices_ClickAsync());
            var btnRestart = CreateActionButton("⟳ Restart", Color.FromArgb(245, 158, 11), 
                async (s, e) => await RestartServices_ClickAsync());
            var btnRefresh = CreateActionButton("↻ Refresh", Color.FromArgb(99, 102, 241), 
                async (s, e) => await RefreshStatusAsync());
            var btnLogs = CreateActionButton("📋 View Logs", Color.FromArgb(100, 116, 139), 
                (s, e) => ShowLogs());

            panel.Controls.AddRange(new Control[] { btnStart, btnStop, btnRestart, btnRefresh, btnLogs });
            
            return panel;
        }

        private Button CreateActionButton(string text, Color color, EventHandler onClick)
        {
            var btn = new Button
            {
                Text = text,
                AutoSize = true,
                BackColor = color,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Margin = new Padding(5),
                MinimumSize = new Size(100, 35)
            };
            
            btn.FlatAppearance.BorderSize = 0;
            btn.Click += onClick;
            
            return btn;
        }

        private Panel CreateStatusPanel()
        {
            var panel = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 3,
                RowCount = 1,
                Padding = new Padding(5)
            };
            
            panel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33));
            panel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33));
            panel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33));
            
            // Container status card
            var containerCard = CreateStatusCard("Containers", "Running: --", "Total: --");
            panel.Controls.Add(containerCard, 0, 0);
            
            // API status card
            var apiCard = CreateStatusCard("Backend API", "Status: --", "Port: 8000");
            panel.Controls.Add(apiCard, 1, 0);
            
            // Frontend status card
            var frontendCard = CreateStatusCard("Frontend", "Status: --", "Port: 3000");
            panel.Controls.Add(frontendCard, 2, 0);
            
            return panel;
        }

        private GroupBox CreateStatusCard(string title, string line1, string line2)
        {
            var group = new GroupBox
            {
                Text = title,
                Dock = DockStyle.Fill,
                Padding = new Padding(10),
                Margin = new Padding(5)
            };
            
            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 2
            };
            
            var lbl1 = new Label { Text = line1, AutoSize = true, Dock = DockStyle.Top };
            var lbl2 = new Label { Text = line2, AutoSize = true, Dock = DockStyle.Top };
            
            layout.Controls.Add(lbl1, 0, 0);
            layout.Controls.Add(lbl2, 0, 1);
            
            group.Controls.Add(layout);
            
            return group;
        }

        private void InitializeTrayIcon()
        {
            _trayMenu = new ContextMenuStrip();
            _trayMenu.Items.Add("Show", null, (s, e) => {
                this.Show();
                this.WindowState = FormWindowState.Normal;
            });
            _trayMenu.Items.Add(new ToolStripSeparator());
            _trayMenu.Items.Add("Start Services", null, async (s, e) => await StartServices_ClickAsync());
            _trayMenu.Items.Add("Stop Services", null, async (s, e) => await StopServices_ClickAsync());
            _trayMenu.Items.Add(new ToolStripSeparator());
            _trayMenu.Items.Add("Exit", null, (s, e) => Close());
            
            _notifyIcon = new NotifyIcon
            {
                Icon = SystemIcons.Application,
                Text = "FOGNET-X Manager",
                Visible = true,
                ContextMenuStrip = _trayMenu
            };
            
            _notifyIcon.DoubleClick += (s, e) => {
                this.Show();
                this.WindowState = FormWindowState.Normal;
            };
        }

        private void InitializeRefreshTimer()
        {
            _refreshTimer = new System.Windows.Forms.Timer { Interval = 5000 }; // Refresh every 5 seconds
            _refreshTimer.Tick += async (s, e) => await RefreshStatusAsync();
            _refreshTimer.Start();
        }

        private async Task OnFormLoadAsync()
        {
            lblStatus.Text = "Connecting to Docker...";
            
            var connected = await _dockerService.ConnectAsync();
            
            if (connected)
            {
                lblStatus.Text = "Connected to Docker";
                await RefreshStatusAsync();
            }
            else
            {
                lblStatus.Text = "Docker not available";
                MessageBox.Show(this, 
                    "Cannot connect to Docker. Please ensure Docker Desktop is running.",
                    "Docker Connection Error",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task StartServices_ClickAsync()
        {
            try
            {
                lblStatus.Text = "Starting services...";
                var result = await _dockerService.StartServicesAsync();
                
                if (result)
                {
                    lblStatus.Text = "Services started successfully";
                    await RefreshStatusAsync();
                }
                else
                {
                    MessageBox.Show("Failed to start services", "Error", 
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting services");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task StopServices_ClickAsync()
        {
            try
            {
                lblStatus.Text = "Stopping services...";
                var result = await _dockerService.StopServicesAsync();
                
                if (result)
                {
                    lblStatus.Text = "Services stopped successfully";
                    await RefreshStatusAsync();
                }
                else
                {
                    MessageBox.Show("Failed to stop services", "Error", 
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping services");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task RestartServices_ClickAsync()
        {
            try
            {
                lblStatus.Text = "Restarting services...";
                var result = await _dockerService.RestartServicesAsync();
                
                if (result)
                {
                    lblStatus.Text = "Services restarted successfully";
                    await RefreshStatusAsync();
                }
                else
                {
                    MessageBox.Show("Failed to restart services", "Error", 
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restarting services");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task RefreshStatusAsync()
        {
            try
            {
                var status = await _dockerService.GetServiceStatusAsync();
                
                lblContainers.Text = $"Containers: {status.RunningContainers}/{status.TotalContainers}";
                
                if (status.IsRunning)
                {
                    lblStatus.Text = "✓ All services running";
                }
                else if (status.IsPartiallyRunning)
                {
                    lblStatus.Text = "⚠ Some services stopped";
                }
                else if (status.IsStopped)
                {
                    lblStatus.Text = "✗ All services stopped";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing status");
            }
        }

        private void ShowLogs()
        {
            var logsForm = new LogsForm(_dockerService);
            logsForm.Show();
        }

        private void ShowAbout()
        {
            MessageBox.Show(this, 
                "FOGNET-X Manager\nVersion 1.0.0\n\nFog Computing Platform for Industry 4.0\n\n© 2026 FOGNET-X Team",
                "About FOGNET-X",
                MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (e.CloseReason == CloseReason.UserClosing && _notifyIcon != null)
            {
                e.Cancel = true;
                this.Hide();
            }
            base.OnFormClosing(e);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _refreshTimer?.Stop();
                _refreshTimer?.Dispose();
                _notifyIcon?.Dispose();
            }
            base.Dispose(disposing);
        }

        // UI Controls
        private ToolStripStatusLabel lblStatus = null!;
        private ToolStripStatusLabel lblContainers = null!;
        private ToolStripStatusLabel lblUptime = null!;
    }
}
