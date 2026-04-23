-- ──────────────────────────────────────────────────────────────
-- GCT Hostel Link — Chat System SQL (run AFTER supabase_complete_v3.sql)
-- ──────────────────────────────────────────────────────────────

-- Conversations (one per teacher-student pair)
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_msg_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ,
  is_deleted      BOOLEAN     NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- Drop policies if re-running
DROP POLICY IF EXISTS "conversations_access" ON conversations;
DROP POLICY IF EXISTS "messages_access"      ON messages;

-- Conversations: teacher, student, or admin
CREATE POLICY "conversations_access" ON conversations
  FOR ALL TO authenticated
  USING (
    teacher_id = auth.uid()
    OR student_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    teacher_id = auth.uid()
    OR student_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Messages: participant in the conversation, or admin
CREATE POLICY "messages_access" ON messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
        AND (teacher_id = auth.uid() OR student_id = auth.uid())
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
        AND (teacher_id = auth.uid() OR student_id = auth.uid())
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
