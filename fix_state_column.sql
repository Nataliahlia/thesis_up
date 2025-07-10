-- Fix the state column to handle Greek characters properly
USE thesis_up;

ALTER TABLE thesis_topic 
MODIFY COLUMN state VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;

-- Verify the change
DESCRIBE thesis_topic;
