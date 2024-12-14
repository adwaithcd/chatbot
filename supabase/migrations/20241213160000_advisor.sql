CREATE TABLE IF NOT EXISTS message_advisors (
    advisor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    advisor_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    
    -- Add unique constraint to prevent duplicate advisors per message
    UNIQUE(message_id, advisor_type)
);

-- Create indexes
CREATE INDEX idx_message_advisors_message_id ON message_advisors(message_id);
CREATE INDEX idx_message_advisors_chat_id ON message_advisors(chat_id);
CREATE INDEX idx_message_advisors_user_id ON message_advisors(user_id);

-- Enable RLS
ALTER TABLE message_advisors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow users to view their own message advisors"
ON message_advisors
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert their own message advisors"
ON message_advisors
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_message_advisors_updated_at
    BEFORE UPDATE ON message_advisors
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();