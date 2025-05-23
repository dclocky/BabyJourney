-- Quick fix to create a test user for button testing
INSERT INTO users (username, email, password, "isPremium", "createdAt") 
VALUES ('demo', 'demo@test.com', '$2b$10$example', false, NOW())
ON CONFLICT (username) DO NOTHING;

-- Get the user ID for child creation
DO $$
DECLARE
    user_id INTEGER;
BEGIN
    SELECT id INTO user_id FROM users WHERE username = 'demo';
    
    -- Create a test child for this user
    INSERT INTO children (name, "userId", "dateOfBirth", gender, "createdAt")
    VALUES ('Baby Demo', user_id, '2024-01-01', 'other', NOW())
    ON CONFLICT DO NOTHING;
END $$;