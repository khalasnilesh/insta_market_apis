ALTER TABLE public.countries
    ADD COLUMN moltin_client_id text,
    ADD COLUMN moltin_client_secret text;


/* BR */
UPDATE public.countries
SET moltin_client_id = 'eDlPjoMabiu84tszlmr9gcpgm1YJXOJoSZxCBooYuW',
	moltin_client_secret = 'hqvxfSwzIz9RP3nTLP3SbDZUUDDpfMteRJtfm3rOv3'
WHERE id = 1;

/* UK */
UPDATE public.countries
SET moltin_client_id = 'OCQZ6BwRk8OMUk04C08DmJGWTgcnkXoO2TSaVyqJLa',
	moltin_client_secret = 'mkOFvvi3gJyuDU3ydONXFJbBzhO2Z4Npqg9CQjBRgw'
WHERE id = 3;

/* ES */
UPDATE public.countries
SET moltin_client_id = 'vRjgjoglo4FmoLeRFzIH0A1G8k1lSqL50YVupRPoga',
	moltin_client_secret = 'ZFK0c0zMWUYJx5IgMnNwhDLtKeUIcazZNVirbM8g9j'
WHERE id = 4;

commit;
