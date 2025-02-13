/*
  # Fix users table RLS policies

  1. Changes
    - Add policy to allow inserting new users during registration
    - Keep existing policy for reading own data

  2. Security
    - Users can only insert their own data during registration
    - Users can only read their own data
*/

-- Add policy for user registration
CREATE POLICY "Users can insert their own data during registration"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);