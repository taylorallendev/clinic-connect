-- Add key and description fields to templates table
ALTER TABLE templates
ADD COLUMN key text,
ADD COLUMN description text;

-- Create index on key field for faster lookups
CREATE INDEX idx_templates_key ON templates(key);

-- Add comment to templates table
COMMENT ON TABLE templates IS 'Stores templates for various use cases including email, SOAP notes, and other structured content';

-- Add comments to columns
COMMENT ON COLUMN templates.key IS 'Unique key to identify template programmatically';
COMMENT ON COLUMN templates.description IS 'Human-readable description of the template purpose';
COMMENT ON COLUMN templates.type IS 'Type of template (email, soap, structured, etc.)';