#!/usr/bin/env python3
import os
import zipfile
from pathlib import Path

def create_export_zip():
    print("Creating EXPORT.zip...")
    
    # Files and directories to include
    include = [
        'src',
        'addons',
        'dashboard',
        'test',
        'termux',
        'data',
        'CONFIG.example.json',
        'package.json',
        'ecosystem.config.js',
        'README.md',
        'AUDIT.md',
        '.gitignore'
    ]
    
    # Patterns to exclude
    exclude_patterns = [
        'node_modules',
        '.log',
        'test-results',
        'CONFIG.json',
        '__pycache__',
        '.pyc'
    ]
    
    def should_exclude(path):
        for pattern in exclude_patterns:
            if pattern in str(path):
                return True
        return False
    
    with zipfile.ZipFile('EXPORT.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
        for item in include:
            path = Path(item)
            
            if not path.exists():
                print(f"Warning: {item} not found, skipping...")
                continue
                
            if path.is_file():
                if not should_exclude(path):
                    print(f"Adding file: {path}")
                    zipf.write(path, path)
            elif path.is_dir():
                for root, dirs, files in os.walk(path):
                    for file in files:
                        file_path = Path(root) / file
                        if not should_exclude(file_path):
                            print(f"Adding: {file_path}")
                            zipf.write(file_path, file_path)
    
    size = os.path.getsize('EXPORT.zip')
    print(f"\n✓ EXPORT.zip created successfully ({size / 1024:.1f} KB)")
    print(f"  Location: {os.path.abspath('EXPORT.zip')}")

if __name__ == '__main__':
    create_export_zip()
