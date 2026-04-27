using System;
using System.Windows.Forms;
using FOGNETX.Manager.Services;

namespace FOGNETX.Manager
{
    /// <summary>
    /// Form to display FOGNET-X logs
    /// </summary>
    public partial class LogsForm : Form
    {
        private readonly DockerService _dockerService;
        private TextBox txtLogs = null!;
        private Button btnRefresh = null!;
        private Button btnCopy = null!;
        private Button btnSave = null!;

        public LogsForm(DockerService dockerService)
        {
            _dockerService = dockerService;
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "FOGNET-X Logs";
            this.Size = new System.Drawing.Size(900, 600);
            this.StartPosition = FormStartPosition.CenterParent;
            this.Font = new System.Drawing.Font("Consolas", 9F);

            // Main panel
            var mainPanel = new TableLayoutPanel
            {
                Dock = System.Windows.Forms.DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 2,
                Padding = new Padding(10)
            };
            mainPanel.RowStyles.Add(new RowStyle(System.Windows.Forms.SizeType.Percent, 100));
            mainPanel.RowStyles.Add(new RowStyle(System.Windows.Forms.SizeType.AutoSize));

            // Logs text box
            txtLogs = new TextBox
            {
                Multiline = true,
                ScrollBars = ScrollBars.Vertical,
                Dock = System.Windows.Forms.DockStyle.Fill,
                ReadOnly = true,
                Font = new System.Drawing.Font("Consolas", 9F),
                BackColor = SystemColors.Window
            };

            // Button panel
            var buttonPanel = new FlowLayoutPanel
            {
                Dock = System.Windows.Forms.DockStyle.Bottom,
                AutoSize = true,
                FlowDirection = FlowDirection.RightToLeft,
                Padding = new Padding(5)
            };

            btnClose = new Button
            {
                Text = "Close",
                AutoSize = true,
                MinimumSize = new System.Drawing.Size(80, 30)
            };
            btnClose.Click += (s, e) => Close();

            btnSave = new Button
            {
                Text = "Save Logs...",
                AutoSize = true,
                MinimumSize = new System.Drawing.Size(100, 30)
            };
            btnSave.Click += async (s, e) => await SaveLogsAsync();

            btnCopy = new Button
            {
                Text = "Copy to Clipboard",
                AutoSize = true,
                MinimumSize = new System.Drawing.Size(120, 30)
            };
            btnCopy.Click += (s, e) => CopyToClipboard();

            btnRefresh = new Button
            {
                Text = "↻ Refresh",
                AutoSize = true,
                MinimumSize = new System.Drawing.Size(80, 30)
            };
            btnRefresh.Click += async (s, e) => await LoadLogsAsync();

            buttonPanel.Controls.AddRange(new Control[] { btnClose, btnSave, btnCopy, btnRefresh });

            mainPanel.Controls.Add(txtLogs, 0, 0);
            mainPanel.Controls.Add(buttonPanel, 0, 1);

            this.Controls.Add(mainPanel);

            // Load logs on open
            this.Load += async (s, e) => await LoadLogsAsync();
        }

        private async System.Threading.Tasks.Task LoadLogsAsync()
        {
            btnRefresh.Enabled = false;
            btnRefresh.Text = "Loading...";

            try
            {
                var logs = await _dockerService.GetLogsAsync(200);
                txtLogs.Text = logs;
                txtLogs.SelectionStart = txtLogs.Text.Length;
                txtLogs.ScrollToCaret();
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, 
                    $"Error loading logs: {ex.Message}", 
                    "Error", 
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                btnRefresh.Enabled = true;
                btnRefresh.Text = "↻ Refresh";
            }
        }

        private void CopyToClipboard()
        {
            if (!string.IsNullOrEmpty(txtLogs.Text))
            {
                Clipboard.SetText(txtLogs.Text);
                MessageBox.Show(this, "Logs copied to clipboard", "Success", 
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private async System.Threading.Tasks.Task SaveLogsAsync()
        {
            if (string.IsNullOrEmpty(txtLogs.Text))
                return;

            var saveDialog = new SaveFileDialog
            {
                Filter = "Text Files (*.txt)|*.txt|All Files (*.*)|*.*",
                FileName = $"fognetx-logs-{DateTime.Now:yyyyMMdd-HHmmss}.txt"
            };

            if (saveDialog.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    await System.IO.File.WriteAllTextAsync(saveDialog.FileName, txtLogs.Text);
                    MessageBox.Show(this, "Logs saved successfully", "Success", 
                        MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show(this, 
                        $"Error saving logs: {ex.Message}", 
                        "Error", 
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
        }

        private Button btnClose = null!;
    }
}
