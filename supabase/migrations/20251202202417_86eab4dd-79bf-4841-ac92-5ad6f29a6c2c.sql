-- Make message-media bucket public for easier media access
UPDATE storage.buckets SET public = true WHERE id = 'message-media';