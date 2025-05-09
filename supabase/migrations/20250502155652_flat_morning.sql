/*
  # Add saved_trips table

  1. New Tables
    - `saved_trips`: Stores user-saved trip itineraries
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `city` (text)
      - `categories` (text[])
      - `travel_style` (text)
      - `places` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

CREATE TABLE saved_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  city text NOT NULL,
  categories text[] NOT NULL,
  travel_style text NOT NULL,
  places jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own trips"
  ON saved_trips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own trips"
  ON saved_trips
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON saved_trips
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);