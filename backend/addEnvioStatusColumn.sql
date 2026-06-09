-- Add envio_status column to planos table
ALTER TABLE planos
ADD COLUMN IF NOT EXISTS envio_status VARCHAR(50) DEFAULT 'nao_enviado';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_planos_envio_status ON planos(envio_status);

-- Update existing records to have a default status
UPDATE planos 
SET envio_status = 'nao_enviado' 
WHERE envio_status IS NULL;
