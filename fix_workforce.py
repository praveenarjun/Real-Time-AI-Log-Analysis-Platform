import os

base_dir = "/Users/praveenchalla/Downloads/ai-log-analyzer"

def process_file(filepath, replacements):
    path = os.path.join(base_dir, filepath)
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        for old, new in replacements.items():
            content = content.replace(old, new)
        with open(path, 'w') as f:
            f.write(content)

def add_fmt_import(filepath):
    path = os.path.join(base_dir, filepath)
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        if '"fmt"' not in content:
            content = content.replace('import (', 'import (\n\t"fmt"\n')
        with open(path, 'w') as f:
            f.write(content)

replacements = {
    '"praveenchalla.local/ai-log-analyzer/internal/config"': '"praveenchalla.local/ai-log-analyzer/pkg/config"',
    '":" + cfg.Workforce.Port': 'fmt.Sprintf(":%d", cfg.Workforce.HTTPPort)',
    'cfg.Workforce.Port': 'cfg.Workforce.HTTPPort'
}

add_fmt_import("workforce-service/cmd/main.go")
process_file("workforce-service/cmd/main.go", replacements)

# Append DatabaseConfig and WorkforceConfig to config.go
config_path = os.path.join(base_dir, "pkg/config/config.go")
if os.path.exists(config_path):
    with open(config_path, "r") as f:
        content = f.read()
    
    # 1. Add fields to Config struct
    if 'Database DatabaseConfig' not in content:
        content = content.replace('Metrics       MetricsConfig       `yaml:"metrics"`\n}', 'Metrics       MetricsConfig       `yaml:"metrics"`\n\tDatabase      DatabaseConfig      `yaml:"database"`\n\tWorkforce     WorkforceConfig     `yaml:"workforce"`\n}')
    
    # 2. Add struct definitions
    structs = """\ntype DatabaseConfig struct {
\tURL string `yaml:"url"`
}

type WorkforceConfig struct {
\tHTTPPort int `yaml:"http_port"`
}\n"""
    if 'type DatabaseConfig' not in content:
        content = content + structs
        
    # 3. Add default values
    if 'config.Workforce.HTTPPort = ' not in content:
        content = content.replace('config.Gateway.AIServiceGRPC = "localhost:50051"', 'config.Gateway.AIServiceGRPC = "localhost:50051"\n\tconfig.Workforce.HTTPPort = 8082')

    with open(config_path, "w") as f:
        f.write(content)

print("Workforce main.go and config alignments resolved!")
