#!/bin/bash
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$INFRA_DIR/terraform"
LAMBDA_DIR="$INFRA_DIR/lambda"

echo -e "${BLUE}🏗️  Building OdisAI Infrastructure...${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        echo "Visit: https://learn.hashicorp.com/terraform/getting-started/install.html"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v zip &> /dev/null; then
        print_error "zip command is not available. Please install it first."
        exit 1
    fi
    
    print_status "All dependencies are installed"
}

# Clean previous builds
clean_build() {
    echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
    
    # Remove previous Lambda packages
    rm -f "$TERRAFORM_DIR"/*.zip
    rm -f "$LAMBDA_DIR"/*.zip
    
    # Remove Python cache
    find "$LAMBDA_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$LAMBDA_DIR" -name "*.pyc" -delete 2>/dev/null || true
    
    print_status "Clean completed"
}

# Build Lambda function package
build_lambda() {
    echo -e "${BLUE}📦 Building Lambda function package...${NC}"
    
    if [ ! -f "$LAMBDA_DIR/lambda_function.py" ]; then
        print_error "Lambda function file not found: $LAMBDA_DIR/lambda_function.py"
        exit 1
    fi
    
    # Navigate to lambda directory
    cd "$LAMBDA_DIR"
    
    # Create deployment package
    echo "  📝 Creating lambda_function.zip..."
    zip -q lambda_function.zip lambda_function.py
    
    # Move to terraform directory where it's expected
    mv lambda_function.zip "$TERRAFORM_DIR/"
    
    # Verify the package was created
    if [ -f "$TERRAFORM_DIR/lambda_function.zip" ]; then
        local size=$(du -h "$TERRAFORM_DIR/lambda_function.zip" | cut -f1)
        print_status "Lambda package created successfully ($size)"
    else
        print_error "Failed to create Lambda package"
        exit 1
    fi
}

# Validate Terraform configuration
validate_terraform() {
    echo -e "${BLUE}🔍 Validating Terraform configuration...${NC}"
    
    cd "$TERRAFORM_DIR"
    
    # Check if main.tf exists
    if [ ! -f "main.tf" ]; then
        print_error "main.tf not found in $TERRAFORM_DIR"
        exit 1
    fi
    
    # Validate Terraform syntax
    if terraform validate; then
        print_status "Terraform configuration is valid"
    else
        print_error "Terraform configuration validation failed"
        exit 1
    fi
}

# Initialize Terraform if needed
init_terraform() {
    echo -e "${BLUE}🚀 Initializing Terraform...${NC}"
    
    cd "$TERRAFORM_DIR"
    
    # Check if already initialized
    if [ ! -d ".terraform" ]; then
        echo "  📥 Downloading providers..."
        terraform init
        print_status "Terraform initialized"
    else
        echo "  ♻️  Terraform already initialized, upgrading..."
        terraform init -upgrade
        print_status "Terraform providers upgraded"
    fi
}

# Check AWS credentials
check_aws_credentials() {
    echo -e "${BLUE}🔐 Checking AWS credentials...${NC}"
    
    if ! command -v aws &> /dev/null; then
        print_warning "AWS CLI not installed, but that's okay for Terraform"
        return 0
    fi
    
    # Try to get AWS account info
    if aws sts get-caller-identity &> /dev/null; then
        local account_id=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
        local region=$(aws configure get region 2>/dev/null || echo "not set")
        print_status "AWS credentials configured (Account: $account_id, Region: $region)"
    else
        print_warning "AWS credentials not configured. Make sure to set them before deploying."
        echo "  Run: aws configure"
    fi
}

# Display build summary
build_summary() {
    echo ""
    echo -e "${GREEN}🎉 Build completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "  📁 Terraform directory: $TERRAFORM_DIR"
    echo "  📦 Lambda package: lambda_function.zip"
    echo "  🔧 Terraform status: Initialized and validated"
    echo ""
    echo -e "${BLUE}🚀 Next steps:${NC}"
    echo "  1. Deploy the infrastructure:"
    echo "     cd infrastructure/scripts"
    echo "     ./deploy.sh"
    echo ""
    echo "  2. Or run Terraform manually:"
    echo "     cd infrastructure/terraform"
    echo "     terraform plan"
    echo "     terraform apply"
}

# Main execution
main() {
    check_dependencies
    clean_build
    build_lambda
    init_terraform
    validate_terraform
    check_aws_credentials
    build_summary
}

# Run main function
main "$@"