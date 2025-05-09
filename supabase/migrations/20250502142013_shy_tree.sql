/*
  # Add name field to profiles table

  1. Changes
    - Add `name` column to `profiles` table
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name text;