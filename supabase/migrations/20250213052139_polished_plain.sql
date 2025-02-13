/*
  # Initial Schema Setup for CodeChase

  1. New Tables
    - users (extends auth.users)
      - id (uuid, primary key)
      - username (text)
      - points (integer)
      - current_level (integer)
    - rooms
      - id (uuid, primary key)
      - code (text, unique)
      - name (text)
      - status (text)
      - created_by (uuid, references users)
    - room_participants
      - id (uuid, primary key)
      - room_id (uuid, references rooms)
      - user_id (uuid, references users)
      - joined_at (timestamp)
    - levels
      - id (uuid, primary key)
      - room_id (uuid, references rooms)
      - title (text)
      - description (text)
      - initial_code (text)
      - test_cases (jsonb)
      - movie_reference (text)
      - difficulty (text)
    - submissions
      - id (uuid, primary key)
      - user_id (uuid, references users)
      - level_id (uuid, references levels)
      - code (text)
      - status (text)
      - points (integer)
      - submitted_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create tables
CREATE TABLE public.users (
  id uuid REFERENCES auth.users PRIMARY KEY,
  username text UNIQUE NOT NULL,
  points integer DEFAULT 0,
  current_level integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  created_by uuid REFERENCES public.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms NOT NULL,
  user_id uuid REFERENCES public.users NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  initial_code text NOT NULL,
  test_cases jsonb NOT NULL,
  movie_reference text NOT NULL,
  difficulty text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users NOT NULL,
  level_id uuid REFERENCES public.levels NOT NULL,
  code text NOT NULL,
  status text NOT NULL,
  points integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Anyone can read rooms"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can create rooms"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can view room details"
  ON public.room_participants
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_id = room_participants.room_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can join rooms"
  ON public.room_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can view levels"
  ON public.levels
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_id = levels.room_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can submit solutions"
  ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their submissions"
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);