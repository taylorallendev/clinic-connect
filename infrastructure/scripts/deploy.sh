#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying OdisAI Infrastructure...${NC}"

# Navigate to terraform directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")/terraform"
cd "$TERRAFORM_DIR"

# Run build first
echo -e "${BLUE}📦 Running build first...${NC}"
../scripts/build.sh

# Deploy with Terraform
echo -e "${BLUE}🏗️  Deploying with Terraform...${NC}"
terraform plan
terraform apply -auto-approve

# Show results
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Your API endpoint:${NC}"
terraform output api_endpoint