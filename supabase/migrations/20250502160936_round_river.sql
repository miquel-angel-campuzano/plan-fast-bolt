/*
  # Add name field to saved_trips table

  1. Changes
    - Add `name` column to `saved_trips` table
    - Make `name` required for all trips
*/

ALTER TABLE saved_trips
ADD COLUMN name text NOT NULL;