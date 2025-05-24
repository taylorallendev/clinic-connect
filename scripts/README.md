# Development Scripts

This directory contains utility scripts for development workflows.

## Supabase Type Generation

The `run-codegen.sh` script helps generate TypeScript type definitions from your Supabase database schema.

### Usage

You can run the script in two ways:

1. Using npm script:
   ```bash
   npm run codegen:local
   ```

2. Directly running the script:
   ```bash
   ./scripts/run-codegen.sh
   ```

This will:
1. Check if the Supabase CLI is installed
2. Install it if necessary
3. Generate TypeScript types based on your Supabase project schema
4. Save them to `database.types.ts` in the project root

### Updating Types After Schema Changes

Run this script whenever you make changes to your Supabase database schema to keep your TypeScript types in sync with your database.

### Project ID Configuration

The script uses the Supabase project ID (`nndjdbdnhnhxkasjgxqk`) configured in the `package.json` file. If you need to change your Supabase project, update the project ID in the `codegen` script in `package.json`.