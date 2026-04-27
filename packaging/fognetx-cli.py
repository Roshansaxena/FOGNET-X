#!/usr/bin/env python3
# =============================================================================
# FOGNET-X Management CLI
# =============================================================================
# Command-line interface for managing FOGNET-X installations
# Usage: fognetx [command] [options]
# =============================================================================

import argparse
import subprocess
import sys
import os
from pathlib import Path

# Colors
class Colors:
    BLUE = '\033[0;34m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'

def log_info(msg):
    print(f"{Colors.BLUE}[INFO]{Colors.NC} {msg}")

def log_success(msg):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.NC} {msg}")

def log_warning(msg):
    print(f"{Colors.YELLOW}[WARNING]{Colors.NC} {msg}")

def log_error(msg):
    print(f"{Colors.RED}[ERROR]{Colors.NC} {msg}")

def run_command(cmd, shell=False, check=True):
    """Run a shell command"""
    try:
        result = subprocess.run(
            cmd,
            shell=shell,
            check=check,
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        if check:
            log_error(f"Command failed: {e}")
            sys.exit(1)
        return None

def get_install_dir():
    """Get FOGNET-X installation directory"""
    if os.name == 'nt':
        return Path(r"C:\FOGNET-X")
    else:
        return Path("/opt/fognetx")

def get_config_dir():
    """Get FOGNET-X config directory"""
    if os.name == 'nt':
        return get_install_dir() / "config"
    else:
        return Path("/etc/fognetx")

def cmd_status(args):
    """Show FOGNET-X service status"""
    log_info("Checking FOGNET-X status...")
    
    # Check systemd service (Linux)
    if os.name != 'nt':
        run_command("systemctl status fognetx", shell=True, check=False)
    
    # Check Docker containers
    print("\nDocker Containers:")
    run_command("docker ps --filter name=fognetx", shell=True)
    
    # Check services health
    print("\nService Health:")
    config_dir = get_config_dir()
    if config_dir.exists():
        os.chdir(config_dir)
        run_command("docker-compose ps", shell=True)

def cmd_start(args):
    """Start FOGNET-X services"""
    log_info("Starting FOGNET-X...")
    
    if os.name == 'nt':
        run_command("net start FOGNET-X", shell=True)
    else:
        run_command("systemctl start fognetx", shell=True)
    
    log_success("FOGNET-X started")

def cmd_stop(args):
    """Stop FOGNET-X services"""
    log_info("Stopping FOGNET-X...")
    
    if os.name == 'nt':
        run_command("net stop FOGNET-X", shell=True)
    else:
        run_command("systemctl stop fognetx", shell=True)
    
    log_success("FOGNET-X stopped")

def cmd_restart(args):
    """Restart FOGNET-X services"""
    log_info("Restarting FOGNET-X...")
    
    if os.name == 'nt':
        run_command("net stop FOGNET-X && net start FOGNET-X", shell=True)
    else:
        run_command("systemctl restart fognetx", shell=True)
    
    log_success("FOGNET-X restarted")

def cmd_logs(args):
    """View FOGNET-X logs"""
    config_dir = get_config_dir()
    if not config_dir.exists():
        log_error("Configuration directory not found")
        sys.exit(1)
    
    os.chdir(config_dir)
    
    if args.follow:
        run_command("docker-compose logs -f", shell=True, check=False)
    else:
        run_command(f"docker-compose logs --tail={args.lines}", shell=True)

def cmd_ps(args):
    """List FOGNET-X processes"""
    config_dir = get_config_dir()
    if not config_dir.exists():
        log_error("Configuration directory not found")
        sys.exit(1)
    
    os.chdir(config_dir)
    run_command("docker-compose ps", shell=True)

def cmd_config(args):
    """Edit configuration"""
    config_file = get_config_dir() / ".env"
    
    if not config_file.exists():
        log_error("Configuration file not found")
        sys.exit(1)
    
    log_info(f"Opening configuration file: {config_file}")
    
    if os.name == 'nt':
        os.startfile(config_file)
    else:
        editor = os.environ.get('EDITOR', 'nano')
        run_command(f"{editor} {config_file}", shell=True, check=False)

def cmd_backup(args):
    """Backup FOGNET-X data"""
    backup_dir = Path(args.output) if args.output else Path("./fognetx-backup")
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    log_info(f"Backing up to {backup_dir}...")
    
    # Backup database
    db_path = Path("/var/lib/fognetx/fognetx.db")
    if db_path.exists():
        import shutil
        shutil.copy(db_path, backup_dir / "fognetx.db")
        log_success("Database backed up")
    
    # Backup configuration
    config_dir = get_config_dir()
    if config_dir.exists():
        import shutil
        shutil.copytree(config_dir, backup_dir / "config", dirs_exist_ok=True)
        log_success("Configuration backed up")
    
    log_success(f"Backup completed: {backup_dir}")

def cmd_restore(args):
    """Restore FOGNET-X from backup"""
    backup_dir = Path(args.input)
    
    if not backup_dir.exists():
        log_error(f"Backup directory not found: {backup_dir}")
        sys.exit(1)
    
    log_info(f"Restoring from {backup_dir}...")
    
    # Stop services
    cmd_stop(args)
    
    # Restore database
    db_backup = backup_dir / "fognetx.db"
    if db_backup.exists():
        import shutil
        db_path = Path("/var/lib/fognetx/fognetx.db")
        db_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(db_backup, db_path)
        log_success("Database restored")
    
    # Restore configuration
    config_backup = backup_dir / "config"
    if config_backup.exists():
        import shutil
        config_dir = get_config_dir()
        config_dir.mkdir(parents=True, exist_ok=True)
        shutil.copytree(config_backup, config_dir, dirs_exist_ok=True)
        log_success("Configuration restored")
    
    # Start services
    cmd_start(args)
    
    log_success("Restore completed")

def cmd_update(args):
    """Update FOGNET-X to latest version"""
    log_info("Updating FOGNET-X...")
    
    install_dir = get_install_dir()
    
    if not install_dir.exists():
        log_error("FOGNET-X not installed")
        sys.exit(1)
    
    # Pull latest images
    config_dir = get_config_dir()
    if config_dir.exists():
        os.chdir(config_dir)
        log_info("Pulling latest Docker images...")
        run_command("docker-compose pull", shell=True)
        
        # Restart with new images
        log_info("Restarting services...")
        run_command("docker-compose up -d", shell=True)
    
    log_success("FOGNET-X updated")

def cmd_doctor(args):
    """Diagnose FOGNET-X installation"""
    log_info("Running diagnostics...\n")
    
    issues = []
    
    # Check Docker
    log_info("Checking Docker...")
    docker_version = run_command("docker --version", shell=True, check=False)
    if docker_version:
        log_success(f"  ✓ {docker_version}")
    else:
        issues.append("Docker not installed")
        log_error("  ✗ Docker not found")
    
    # Check Docker Compose
    log_info("Checking Docker Compose...")
    compose_version = run_command("docker-compose --version", shell=True, check=False)
    if compose_version:
        log_success(f"  ✓ {compose_version}")
    else:
        issues.append("Docker Compose not installed")
        log_error("  ✗ Docker Compose not found")
    
    # Check installation directory
    log_info("Checking installation...")
    install_dir = get_install_dir()
    if install_dir.exists():
        log_success(f"  ✓ Installation directory exists")
    else:
        issues.append("Installation directory missing")
        log_error("  ✗ Installation directory not found")
    
    # Check configuration
    log_info("Checking configuration...")
    config_dir = get_config_dir()
    env_file = config_dir / ".env"
    if env_file.exists():
        log_success(f"  ✓ Configuration file exists")
    else:
        issues.append("Configuration file missing")
        log_error("  ✗ .env file not found")
    
    # Check services
    log_info("Checking services...")
    if config_dir.exists():
        os.chdir(config_dir)
        containers = run_command("docker-compose ps -q", shell=True, check=False)
        if containers:
            log_success(f"  ✓ Containers running")
        else:
            issues.append("No containers running")
            log_warning("  ⚠ No active containers")
    
    # Summary
    print("\n" + "="*60)
    if issues:
        log_warning(f"Found {len(issues)} issue(s):")
        for issue in issues:
            print(f"  - {issue}")
        print("\nRun 'fognetx repair' to attempt automatic repairs")
    else:
        log_success("All checks passed! ✓")

def cmd_repair(args):
    """Repair FOGNET-X installation"""
    log_info("Attempting repairs...\n")
    
    # Recreate networks
    config_dir = get_config_dir()
    if config_dir.exists():
        os.chdir(config_dir)
        
        log_info("Recreating Docker networks...")
        run_command("docker-compose down", shell=True, check=False)
        run_command("docker-compose up -d", shell=True)
        
        log_success("Services recreated")
    
    log_success("Repair completed")

def main():
    parser = argparse.ArgumentParser(
        description="FOGNET-X Management CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  fognetx status          Show service status
  fognetx start           Start all services
  fognetx logs -f         Follow logs
  fognetx config          Edit configuration
  fognetx backup          Create backup
  fognetx doctor          Run diagnostics
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Status command
    p_status = subparsers.add_parser('status', help='Show service status')
    p_status.set_defaults(func=cmd_status)
    
    # Start command
    p_start = subparsers.add_parser('start', help='Start services')
    p_start.set_defaults(func=cmd_start)
    
    # Stop command
    p_stop = subparsers.add_parser('stop', help='Stop services')
    p_stop.set_defaults(func=cmd_stop)
    
    # Restart command
    p_restart = subparsers.add_parser('restart', help='Restart services')
    p_restart.set_defaults(func=cmd_restart)
    
    # Logs command
    p_logs = subparsers.add_parser('logs', help='View logs')
    p_logs.add_argument('-f', '--follow', action='store_true', help='Follow logs')
    p_logs.add_argument('--lines', type=int, default=100, help='Number of lines')
    p_logs.set_defaults(func=cmd_logs)
    
    # PS command
    p_ps = subparsers.add_parser('ps', help='List processes')
    p_ps.set_defaults(func=cmd_ps)
    
    # Config command
    p_config = subparsers.add_parser('config', help='Edit configuration')
    p_config.set_defaults(func=cmd_config)
    
    # Backup command
    p_backup = subparsers.add_parser('backup', help='Backup data')
    p_backup.add_argument('-o', '--output', help='Output directory')
    p_backup.set_defaults(func=cmd_backup)
    
    # Restore command
    p_restore = subparsers.add_parser('restore', help='Restore from backup')
    p_restore.add_argument('input', help='Backup directory')
    p_restore.set_defaults(func=cmd_restore)
    
    # Update command
    p_update = subparsers.add_parser('update', help='Update installation')
    p_update.set_defaults(func=cmd_update)
    
    # Doctor command
    p_doctor = subparsers.add_parser('doctor', help='Run diagnostics')
    p_doctor.set_defaults(func=cmd_doctor)
    
    # Repair command
    p_repair = subparsers.add_parser('repair', help='Repair installation')
    p_repair.set_defaults(func=cmd_repair)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        sys.exit(0)
    
    args.func(args)

if __name__ == '__main__':
    main()
