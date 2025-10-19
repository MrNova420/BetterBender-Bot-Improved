#!/bin/bash

BACKUP_DIR="./data/civilization/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="./data/civilization/civilization.db"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
    echo "Backing up civilization database..."
    cp "$DB_FILE" "$BACKUP_DIR/civilization_$TIMESTAMP.db"
    echo "Backup created: $BACKUP_DIR/civilization_$TIMESTAMP.db"
    
    echo "Keeping last 10 backups..."
    ls -t "$BACKUP_DIR"/civilization_*.db | tail -n +11 | xargs -r rm
    
    echo "Backup complete!"
else
    echo "Database file not found: $DB_FILE"
    exit 1
fi
