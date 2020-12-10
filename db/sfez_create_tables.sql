--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.3
-- Dumped by pg_dump version 9.6.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: calc_earth_dist(numeric, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION calc_earth_dist(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
delta_lat NUMERIC;
delta_lng NUMERIC;
a NUMERIC;
c NUMERIC;
d NUMERIC;
earth_radius NUMERIC;
BEGIN
delta_lat = radians(lat1) - radians(lat2);
delta_lng = radians(lng1) - radians(lng2);
earth_radius = 6371;

a = sin(delta_lat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lng/2)^2;
c = 2 * atan2(sqrt(a), sqrt(1 - a));
d = earth_radius * c;

return d;
END;
$$;


ALTER FUNCTION public.calc_earth_dist(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric) OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE admins (
    id integer NOT NULL,
    description text,
    photo text,
    phone text,
    super_admin boolean DEFAULT false,
    city text,
    state text,
    country text,
    user_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE admins_id_seq OWNED BY admins.id;


--
-- Name: checkin_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE checkin_history (
    id integer NOT NULL,
    unit_name text,
    unit_id integer,
    company_name text,
    company_id integer,
    user_id integer,
    service_cancellation_time timestamp with time zone,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    latitude double precision,
    longitude double precision,
    food_park_name text,
    food_park_id integer,
    note text,
    display_address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE checkin_history OWNER TO postgres;

--
-- Name: checkin_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE checkin_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE checkin_history_id_seq OWNER TO postgres;

--
-- Name: checkin_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE checkin_history_id_seq OWNED BY checkin_history.id;


--
-- Name: checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE checkins (
    id integer NOT NULL,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    latitude double precision,
    longitude double precision,
    display_address text,
    food_park_name text,
    note text,
    food_park_id integer,
    unit_id integer,
    company_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE checkins OWNER TO postgres;

--
-- Name: checkins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE checkins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE checkins_id_seq OWNER TO postgres;

--
-- Name: checkins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE checkins_id_seq OWNED BY checkins.id;


--
-- Name: commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE commissions (
    name text NOT NULL,
    value double precision NOT NULL,
    id integer NOT NULL
);


ALTER TABLE commissions OWNER TO postgres;

--
-- Name: commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE commissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE commissions_id_seq OWNER TO postgres;

--
-- Name: commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE commissions_id_seq OWNED BY commissions.id;

CREATE TABLE cart (
      id integer NOT NULL,
      userId text,
      productId text,
      price double precision,
      quantity integer,
      addons text,
      addonsPrice double precision,
      instructions text,
      note text,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
        payment_date timestamp with time zone,
        payment_status text,
        vendor_name text,
        vendor_id text,
        is_deleted boolean DEFAULT false,
);
ALTER TABLE cart OWNER TO postgres;
CREATE SEQUENCE cart_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE cart_id_seq OWNER TO postgres;
ALTER SEQUENCE cart_id_seq OWNED BY cart.id;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE cart TO sfez_rw;
GRANT ALL ON SEQUENCE cart_id_seq TO sfez_rw;
ALTER TABLE ONLY cart ALTER COLUMN id SET DEFAULT nextval('cart_id_seq'::regclass);




CREATE TABLE orderhistory (
      id integer NOT NULL,
      userId text,
      productId text,
      price double precision,
      quantity integer,
      addons text,
      addonsPrice double precision,
      instructions text,
      note text,
      status text DEFAULT 'process',
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
        payment_date timestamp with time zone,
        payment_status text,
        vendor_name text,
        vendor_id text,
        is_deleted boolean DEFAULT false;
);
ALTER TABLE orderhistory OWNER TO postgres;
CREATE SEQUENCE orderhistory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE orderhistory_id_seq OWNER TO postgres;
ALTER SEQUENCE orderhistory_id_seq OWNED BY cart.id;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE orderhistory TO sfez_rw;
GRANT ALL ON SEQUENCE orderhistory_id_seq TO sfez_rw;
ALTER TABLE ONLY orderhistory ALTER COLUMN id SET DEFAULT nextval('orderhistory_id_seq'::regclass);
--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE companies (
    id integer NOT NULL,
    name text NOT NULL,
    order_sys_id text,
    base_slug text,
    default_cat text,
    daily_special_cat_id text,
    daily_special_item_id text,
    delivery_chg_cat_id text,
    delivery_chg_item_id text,
    delivery_chg_amount text,
    description text,
    email text,
    phone text,
    facebook text,
    twitter text,
    instagram text,
    photo text,
    featured_dish text,
    thumbnail text,
    hours text,
    schedule text,
    business_address text,
    city text,
    state text,
    country text,
    country_id integer,
    taxband text,
    tags text,
    stub boolean,
    calculated_rating numeric,
    user_id integer,
    show_vendor_setup boolean DEFAULT true,
    default_unit integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    is_deleted boolean DEFAULT false,
    veritas_id text,
    latitude double precision,
    longitude double precision,
    distance_range integer
);


ALTER TABLE companies OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE companies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE companies_id_seq OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE companies_id_seq OWNED BY companies.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--
-- CREATE TABLE states (id integer NOT NULL,name text,is_enabled boolean DEFAULT false,country_id integer DEFAULT NULL);
CREATE TABLE states (
    id integer NOT NULL,
    name text,
    is_enabled boolean DEFAULT false,
    country_id integer DEFAULT NULL,
);

ALTER TABLE states OWNER TO postgres;
--
-- Name: states_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--
CREATE SEQUENCE states_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE states_id_seq OWNER TO postgres;
--
-- Name: states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE states TO sfez_rw;
GRANT ALL ON SEQUENCE states_id_seq TO sfez_rw;
ALTER SEQUENCE states_id_seq OWNED BY states.id;




CREATE TABLE countries (
    id integer NOT NULL,
    name text,
    is_enabled boolean DEFAULT false,
    currency_id text DEFAULT '1554615357396746864'::text,
    currency text DEFAULT 'BRL'::text,
    moltin_client_id text,
    moltin_client_secret text,
    default_payment text,
    currency_symbol text,
    country_code text
);


ALTER TABLE countries OWNER TO postgres;

--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE countries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE countries_id_seq OWNER TO postgres;

--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE countries_id_seq OWNED BY countries.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE customers (
    id integer NOT NULL,
    order_sys_id text,
    description text,
    apns_id text,
    gcm_id text,
    device_type text,
    fcm_id text,
    phone text,
    facebook text,
    twitter text,
    photo text,
    power_reviewer boolean DEFAULT false,
    city text,
    state text,
    country text,
    user_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    room_number integer,
    billing_responsible boolean DEFAULT false
);


ALTER TABLE customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE customers_id_seq OWNED BY customers.id;


--
-- Name: delivery_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE delivery_addresses (
    id integer NOT NULL,
    nickname text,
    address1 text,
    address2 text,
    title text,
    notes text,
    city text,
    state text,
    phone text,
    customer_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE delivery_addresses OWNER TO postgres;

--
-- Name: delivery_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE delivery_addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE delivery_addresses_id_seq OWNER TO postgres;

--
-- Name: delivery_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE delivery_addresses_id_seq OWNED BY delivery_addresses.id;


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE drivers (
    id integer NOT NULL,
    name text,
    phone text,
    available boolean DEFAULT false,
    unit_id integer,
    company_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    user_id integer,
    is_deleted boolean DEFAULT false
);


ALTER TABLE drivers OWNER TO postgres;

--
-- Name: drivers_foodpark; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE drivers_foodpark (
    food_park_id integer,
    user_id integer,
    available boolean DEFAULT false
);



ALTER TABLE drivers_foodpark OWNER TO postgres;

--
-- Name: drivers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE drivers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE drivers_id_seq OWNER TO postgres;

--
-- Name: drivers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE drivers_id_seq OWNED BY drivers.id;


--
-- Name: event_guests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE event_guests (
    guest integer NOT NULL,
    event integer NOT NULL
);


ALTER TABLE event_guests OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE events (
    id integer NOT NULL,
    name text NOT NULL,
    ticketed boolean DEFAULT false,
    start_date date NOT NULL,
    end_date date NOT NULL,
    schedule json[],
    manager integer NOT NULL,
    social_media json,
    latitude real,
    longitude real,
    image text,
    sponsors json[],
    description text,
    count integer,
    venue_name text,
    ticket_price double precision,
    ticket_items jsonb[]
);


ALTER TABLE events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE events_id_seq OWNED BY events.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE favorites (
    customer_id integer NOT NULL,
    unit_id integer NOT NULL,
    company_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE favorites OWNER TO postgres;

--
-- Name: food_park_management; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE food_park_management (
    id integer NOT NULL,
    food_park_id integer NOT NULL,
    unit_id integer NOT NULL
);


ALTER TABLE food_park_management OWNER TO postgres;

--
-- Name: food_park_management_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE food_park_management_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE food_park_management_id_seq OWNER TO postgres;

--
-- Name: food_park_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE food_park_management_id_seq OWNED BY food_park_management.id;


--
-- Name: food_park_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE food_park_types (
    name text
);


ALTER TABLE food_park_types OWNER TO postgres;

--
-- Name: food_parks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE food_parks (
    id integer NOT NULL,
    name text NOT NULL,
    photo text,
    territory_id integer,
    city text,
    state text,
    postal_code text,
    country text,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    is_deleted boolean DEFAULT false,
    foodpark_mgr_id integer,
    foodpark_mgr integer,
    type text,
    address text
);


ALTER TABLE food_parks OWNER TO postgres;

--
-- Name: food_parks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE food_parks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE food_parks_id_seq OWNER TO postgres;

--
-- Name: food_parks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE food_parks_id_seq OWNED BY food_parks.id;


--
-- Name: gen_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE gen_state (
    id integer NOT NULL,
    order_sys_order_id text,
    step_name text,
    step_status text,
    api_call text,
    param_string text,
    error_info text,
    info text
);


ALTER TABLE gen_state OWNER TO postgres;

--
-- Name: gen_state_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE gen_state_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE gen_state_id_seq OWNER TO postgres;

--
-- Name: gen_state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE gen_state_id_seq OWNED BY gen_state.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE locations (
    id integer NOT NULL,
    name text NOT NULL,
    type text,
    main_loc_text text,
    secondary_loc_text text,
    regex_seed text,
    hitcount integer,
    territory_id integer,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE locations_id_seq OWNED BY locations.id;


--
-- Name: loyalty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE loyalty (
    id integer NOT NULL,
    balance integer,
    customer_id integer,
    company_id integer,
    eligible_five boolean DEFAULT false,
    eligible_ten boolean DEFAULT false,
    eligible_fifteen boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE loyalty OWNER TO postgres;

--
-- Name: loyalty_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE loyalty_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE loyalty_id_seq OWNER TO postgres;

--
-- Name: loyalty_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE loyalty_id_seq OWNED BY loyalty.id;


--
-- Name: loyalty_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE loyalty_packages (
    company_id integer NOT NULL,
    tier text NOT NULL,
    package_id integer,
    id integer NOT NULL
);


ALTER TABLE loyalty_packages OWNER TO postgres;

--
-- Name: loyalty_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE loyalty_packages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE loyalty_packages_id_seq OWNER TO postgres;

--
-- Name: loyalty_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE loyalty_packages_id_seq OWNED BY loyalty_packages.id;


--
-- Name: loyalty_rewards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE loyalty_rewards (
    id integer NOT NULL,
    company_id integer,
    gold_reward_item text,
    silver_reward_item text,
    bronze_reward_item text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE loyalty_rewards OWNER TO postgres;

--
-- Name: loyalty_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE loyalty_rewards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE loyalty_rewards_id_seq OWNER TO postgres;

--
-- Name: loyalty_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE loyalty_rewards_id_seq OWNED BY loyalty_rewards.id;


--
-- Name: loyalty_used; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE loyalty_used (
    id integer NOT NULL,
    amount_redeemed integer,
    customer_id integer,
    company_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE loyalty_used OWNER TO postgres;

--
-- Name: loyalty_used_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE loyalty_used_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE loyalty_used_id_seq OWNER TO postgres;

--
-- Name: loyalty_used_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE loyalty_used_id_seq OWNED BY loyalty_used.id;


--
-- Name: manual_redeem_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE manual_redeem_packages (
    redeem_code text,
    package_codes text[] NOT NULL
);


ALTER TABLE manual_redeem_packages OWNER TO postgres;

--
-- Name: order_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE group_payment (
    id integer NOT NULL,
    order_id text,
    user_id integer,
    payment_type text DEFAULT '',
    is_initiator boolean DEFAULT false,
    amount_paid double precision DEFAULT 0,
    order_amount double precision NOT NULL,
    payment_status text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
);

ALTER TABLE group_payment OWNER TO postgres;

CREATE SEQUENCE group_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE group_payment_id_seq OWNER TO postgres;

ALTER SEQUENCE group_payment_id_seq OWNED BY group_payment.id;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE group_payment TO sfez_rw;
GRANT ALL ON SEQUENCE group_payment_id_seq TO sfez_rw;

ALTER TABLE ONLY group_payment ALTER COLUMN id SET DEFAULT nextval('group_payment_id_seq'::regclass);



CREATE TABLE order_history (
    id integer NOT NULL,
    order_sys_order_id text,
    amount text,
    initiation_time timestamp with time zone,
    payment_time timestamp with time zone,
    actual_pickup_time timestamp with time zone,
    desired_pickup_time timestamp with time zone,
    prep_notice_time timestamp with time zone,
    status jsonb,
    messages text,
    qr_code text,
    manual_pickup boolean DEFAULT false,
    for_delivery boolean DEFAULT false,
    desired_delivery_time timestamp with time zone,
    delivery_address_id integer,
    delivery_address_details jsonb,
    driver_id integer,
    driver_name text,
    contact text,
    order_detail jsonb,
    checkin_id integer,
    customer_name text,
    customer_id integer,
    unit_id integer,
    company_name text,
    company_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    context text,
    commission_type text,
    is_payment_received_by_driver boolean DEFAULT false,
    priority text
);


ALTER TABLE order_history OWNER TO postgres;


--
-- Name: order_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE order_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_history_id_seq OWNER TO postgres;

--
-- Name: order_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE order_history_id_seq OWNED BY order_history.id;


--
-- Name: order_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE users_groups (
    id integer NOT NULL,
    initiator_id integer,
    participant_id text [],
    group_name text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
);

ALTER TABLE users_groups OWNER TO postgres;

CREATE SEQUENCE users_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE users_groups_id_seq OWNER TO postgres;

ALTER SEQUENCE users_groups_id_seq OWNED BY users_groups.id;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE users_groups TO sfez_rw;
GRANT ALL ON SEQUENCE users_groups_id_seq TO sfez_rw;

ALTER TABLE ONLY users_groups ALTER COLUMN id SET DEFAULT nextval('users_groups_id_seq'::regclass);



CREATE TABLE driver_wages (
    id integer NOT NULL,
    driver_id integer,
    unit_id integer,
    company_name text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    per_hour_price integer,
    work_time integer,
    work_date timestamp with time zone
);

ALTER TABLE driver_wages OWNER TO postgres;

CREATE SEQUENCE driver_wages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE driver_wages_id_seq OWNER TO postgres;

ALTER SEQUENCE driver_wages_id_seq OWNED BY driver_wages.id;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE driver_wages TO sfez_rw;
GRANT ALL ON SEQUENCE driver_wages_id_seq TO sfez_rw;

ALTER TABLE ONLY driver_wages ALTER COLUMN id SET DEFAULT nextval('driver_wages_id_seq'::regclass);



CREATE TABLE driver_task (
    id integer NOT NULL,
    actual_pickup_time timestamp with time zone,
    desired_pickup_time timestamp with time zone,
    delivery_address_id integer,
    driver_id integer,
    unit_id integer,
    company_name text,
    company_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    priority text
);

ALTER TABLE driver_task OWNER TO postgres;

CREATE SEQUENCE driver_task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE driver_task_id_seq OWNER TO postgres;

ALTER SEQUENCE driver_task_id_seq OWNED BY driver_task.id;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE driver_task TO sfez_rw;
GRANT ALL ON SEQUENCE driver_task_id_seq TO sfez_rw;

ALTER TABLE ONLY driver_task ALTER COLUMN id SET DEFAULT nextval('driver_task_id_seq'::regclass);




CREATE TABLE order_state (
    id integer NOT NULL,
    order_id integer,
    order_requested_step boolean DEFAULT false,
    order_accepted_step boolean DEFAULT false,
    order_pay_fail boolean DEFAULT false,
    order_paid_step boolean DEFAULT false,
    order_in_queue_step boolean DEFAULT false,
    order_cooking_step boolean DEFAULT false,
    order_ready_step boolean DEFAULT false,
    order_dispatched_step boolean DEFAULT false,
    order_picked_up_step boolean DEFAULT false,
    order_no_show_step boolean DEFAULT false,
    order_delivered_step boolean DEFAULT false,
    apicall text,
    paramstring text,
    errorinfo text,
    callinfo text
);


ALTER TABLE order_state OWNER TO postgres;

--
-- Name: order_state_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE order_state_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_state_id_seq OWNER TO postgres;

--
-- Name: order_state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE order_state_id_seq OWNED BY order_state.id;


--
-- Name: package_given; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE package_given (
    gifted_user integer NOT NULL,
    package integer NOT NULL,
    quantity integer NOT NULL,
    qr_code text,
    id integer NOT NULL
);


ALTER TABLE package_given OWNER TO postgres;

--
-- Name: package_given_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE package_given_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE package_given_id_seq OWNER TO postgres;

--
-- Name: package_given_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE package_given_id_seq OWNED BY package_given.id;


--
-- Name: packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE packages (
    id integer NOT NULL,
    name text,
    items jsonb[] NOT NULL,
    company integer NOT NULL,
    available boolean DEFAULT true,
    description text
);


ALTER TABLE packages OWNER TO postgres;

--
-- Name: packages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE packages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE packages_id_seq OWNER TO postgres;

--
-- Name: packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE packages_id_seq OWNED BY packages.id;


--
-- Name: prepay_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE prepay_history (
    date timestamp without time zone NOT NULL,
    transaction_id integer,
    type text
);


ALTER TABLE prepay_history OWNER TO postgres;

--
-- Name: prepay_recharges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE prepay_recharges (
    user_id integer NOT NULL,
    unit_id integer NOT NULL,
    amount double precision NOT NULL,
    id integer NOT NULL,
    granuo_transaction_id text
);


ALTER TABLE prepay_recharges OWNER TO postgres;

--
-- Name: prepay_recharges_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE prepay_recharges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE prepay_recharges_id_seq OWNER TO postgres;

--
-- Name: prepay_recharges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE prepay_recharges_id_seq OWNED BY prepay_recharges.id;


--
-- Name: review_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE review_approvals (
    id integer NOT NULL,
    review_id integer,
    reviewer_id integer,
    status text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE review_approvals OWNER TO postgres;

--
-- Name: review_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE review_approvals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE review_approvals_id_seq OWNER TO postgres;

--
-- Name: review_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE review_approvals_id_seq OWNED BY review_approvals.id;


--
-- Name: review_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE review_states (
    id integer NOT NULL,
    name text NOT NULL,
    allowed_transitions integer[]
);


ALTER TABLE review_states OWNER TO postgres;

--
-- Name: review_states_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE review_states_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE review_states_id_seq OWNER TO postgres;

--
-- Name: review_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE review_states_id_seq OWNED BY review_states.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE reviews (
    id integer NOT NULL,
    comment text,
    rating numeric,
    answers json,
    customer_id integer,
    company_id integer,
    unit_id integer,
    status text,
    power_reviewer boolean DEFAULT false,
    power_title text,
    reviewer_name text,
    review_photo text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE reviews_id_seq OWNED BY reviews.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE roles (
    id integer NOT NULL,
    type text NOT NULL
);


ALTER TABLE roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE roles_id_seq OWNED BY roles.id;


--
-- Name: search_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE search_preferences (
    id integer NOT NULL,
    customer_id integer,
    territory_id integer,
    distance double precision,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


ALTER TABLE search_preferences OWNER TO postgres;

--
-- Name: search_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE search_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE search_preferences_id_seq OWNER TO postgres;

--
-- Name: search_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE search_preferences_id_seq OWNED BY search_preferences.id;


--
-- Name: square_unit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE square_unit (
    unit_id integer,
    location_id text
);


ALTER TABLE square_unit OWNER TO postgres;

--
-- Name: square_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE square_user (
    access_token text,
    expires_at date,
    merchant_id text,
    user_id integer
);


ALTER TABLE square_user OWNER TO postgres;

--
-- Name: territories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE territories (
    id integer NOT NULL,
    city text,
    territory text,
    state text,
    country text,
    country_id integer,
    timezone text,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    is_deleted boolean DEFAULT false
);


ALTER TABLE territories OWNER TO postgres;

--
-- Name: territories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE territories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE territories_id_seq OWNER TO postgres;

--
-- Name: territories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE territories_id_seq OWNED BY territories.id;


--
-- Name: unit_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE unit_types (
    id integer NOT NULL,
    type text NOT NULL
);


ALTER TABLE unit_types OWNER TO postgres;

--
-- Name: unit_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE unit_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE unit_types_id_seq OWNER TO postgres;

--
-- Name: unit_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE unit_types_id_seq OWNED BY unit_types.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE units (
    id integer NOT NULL,
    name text NOT NULL,
    number integer,
    type text,
    customer_order_window integer,
    prep_notice integer,
    delivery boolean DEFAULT false,
    delivery_time_offset integer,
    delivery_chg_amount text,
    delivery_radius integer,
    description text,
    username text,
    password text,
    qr_code text,
    phone text,
    apns_id text,
    fcm_id text,
    gcm_id text,
    device_type text,
    unit_order_sys_id text,
    territory_id integer,
    
    food_park_id integer,
    from_city text,
    from_state text,
    from_zip text,
    from_country text,
    from_street text,

    serviceType text[],
    longitude text,
    latitude text,
    company_id integer,
    unit_mgr_id integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    currency_id text DEFAULT '1554615357396746864'::text,
    currency text DEFAULT 'BRL'::text,
    payment text DEFAULT 'SumUp'::text,
    is_deleted boolean DEFAULT false,
    room_service boolean DEFAULT false,
    cash_on_delivery boolean DEFAULT false,
    prepay boolean DEFAULT false
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    company_id integer,
    unit_id integer,
    customer_id integer,
    offer_id integer,
    request_name character varying(225),
    request_photo text,
    cash_offer numeric(8,4),
    buy_back_amount numeric(8,4),
    tax_amount numeric(8,4),
    term_months integer,
    qr_code character varying(225),
    offer_approved boolean DEFAULT true,
    status boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);

grant all on contracts to sfez_rw;

CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    request_id integer,
    request_name character varying(225),
    company_id integer,
    pawn_poc character varying(225),
    pawn_name character varying(225),
    pawn_address text,
    pawn_phone character varying(15),
    unit_id integer,
    cash_offer numeric(10,4) DEFAULT '0'::numeric,
    buy_back_amount numeric(10,4) DEFAULT '0'::numeric,
    tax_amount numeric(10,4) DEFAULT '0'::numeric,
    offer_term integer,
    offer_accepted boolean DEFAULT false,
    total_redemption numeric(10,4) DEFAULT '0'::numeric,
    maturity_date timestamp without time zone,
    interest_rate numeric(6,4) DEFAULT '0'::numeric,
    rating numeric(6,4) DEFAULT '0'::numeric,
    distance numeric(6,4) DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT timezone('UTC'::text, CURRENT_TIMESTAMP),
    modified_at timestamp without time zone DEFAULT timezone('UTC'::text, CURRENT_TIMESTAMP),
    is_deleted boolean DEFAULT false
);

grant all on offers to sfez_rw;

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category character varying(125)
);

grant all on categories to sfez_rw;


CREATE TABLE requests (
    id integer NOT NULL,
    customer_id integer,
    request_name text,
    request_photo text,
    category_id integer,
    latitude numeric(8,4),
    longitude numeric(8,4),
    created_at timestamp without time zone DEFAULT timezone('UTC'::text, now()),
    modified_at timestamp without time zone DEFAULT timezone('UTC'::text, now()),
    is_deleted boolean DEFAULT false,
    request_description text,
    condition character varying(100),
    buy_back_term character varying(225),
    country character varying(100),
    state character varying(100),
    territory character varying(100),
    category character varying(125),
    category_photo text,
    request_photo2 text,
    request_photo3 text,
    customer character varying(32)
);

grant all on requests to sfez_rw;

ALTER TABLE units OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE units_id_seq OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE units_id_seq OWNED BY units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    first_name text,
    last_name text,
    role text,
    vendor_name text,
    territory_id integer,
    country_id integer,
    state_id integer,
    city text,
    phone text,
    image text,
    provider text,
    provider_id text,
    provider_data text,
    fbid text,
    fb_token text,
    fb_login boolean,
    googleid text,
    google_token text,
    google_login boolean,
    default_language text DEFAULT 'en'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    is_deleted boolean DEFAULT false,
    custom_id jsonb DEFAULT '{}'::jsonb
    -- google_api_key text,
    -- google_sheet_url text,
    -- google_sheet_tab_name text,
);


ALTER TABLE users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY admins ALTER COLUMN id SET DEFAULT nextval('admins_id_seq'::regclass);


--
-- Name: checkin_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkin_history ALTER COLUMN id SET DEFAULT nextval('checkin_history_id_seq'::regclass);


--
-- Name: checkins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkins ALTER COLUMN id SET DEFAULT nextval('checkins_id_seq'::regclass);


--
-- Name: commissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY commissions ALTER COLUMN id SET DEFAULT nextval('commissions_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY companies ALTER COLUMN id SET DEFAULT nextval('companies_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY countries ALTER COLUMN id SET DEFAULT nextval('countries_id_seq'::regclass);
ALTER TABLE ONLY states ALTER COLUMN id SET DEFAULT nextval('states_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customers ALTER COLUMN id SET DEFAULT nextval('customers_id_seq'::regclass);


--
-- Name: delivery_addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY delivery_addresses ALTER COLUMN id SET DEFAULT nextval('delivery_addresses_id_seq'::regclass);


--
-- Name: drivers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY drivers ALTER COLUMN id SET DEFAULT nextval('drivers_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY events ALTER COLUMN id SET DEFAULT nextval('events_id_seq'::regclass);


--
-- Name: food_park_management id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_park_management ALTER COLUMN id SET DEFAULT nextval('food_park_management_id_seq'::regclass);


--
-- Name: food_parks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_parks ALTER COLUMN id SET DEFAULT nextval('food_parks_id_seq'::regclass);


--
-- Name: gen_state id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY gen_state ALTER COLUMN id SET DEFAULT nextval('gen_state_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY locations ALTER COLUMN id SET DEFAULT nextval('locations_id_seq'::regclass);


--
-- Name: loyalty id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty ALTER COLUMN id SET DEFAULT nextval('loyalty_id_seq'::regclass);


--
-- Name: loyalty_packages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_packages ALTER COLUMN id SET DEFAULT nextval('loyalty_packages_id_seq'::regclass);


--
-- Name: loyalty_rewards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_rewards ALTER COLUMN id SET DEFAULT nextval('loyalty_rewards_id_seq'::regclass);


--
-- Name: loyalty_used id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_used ALTER COLUMN id SET DEFAULT nextval('loyalty_used_id_seq'::regclass);


--
-- Name: order_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history ALTER COLUMN id SET DEFAULT nextval('order_history_id_seq'::regclass);


--
-- Name: order_state id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_state ALTER COLUMN id SET DEFAULT nextval('order_state_id_seq'::regclass);


--
-- Name: package_given id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY package_given ALTER COLUMN id SET DEFAULT nextval('package_given_id_seq'::regclass);


--
-- Name: packages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY packages ALTER COLUMN id SET DEFAULT nextval('packages_id_seq'::regclass);


--
-- Name: prepay_recharges id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY prepay_recharges ALTER COLUMN id SET DEFAULT nextval('prepay_recharges_id_seq'::regclass);


--
-- Name: review_approvals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY review_approvals ALTER COLUMN id SET DEFAULT nextval('review_approvals_id_seq'::regclass);


--
-- Name: review_states id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY review_states ALTER COLUMN id SET DEFAULT nextval('review_states_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY reviews ALTER COLUMN id SET DEFAULT nextval('reviews_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY roles ALTER COLUMN id SET DEFAULT nextval('roles_id_seq'::regclass);


--
-- Name: search_preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY search_preferences ALTER COLUMN id SET DEFAULT nextval('search_preferences_id_seq'::regclass);


--
-- Name: territories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY territories ALTER COLUMN id SET DEFAULT nextval('territories_id_seq'::regclass);


--
-- Name: unit_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY unit_types ALTER COLUMN id SET DEFAULT nextval('unit_types_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY units ALTER COLUMN id SET DEFAULT nextval('units_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('users_id_seq', 11536, true);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: checkin_history checkin_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkin_history
    ADD CONSTRAINT checkin_history_pkey PRIMARY KEY (id);


--
-- Name: checkins checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkins
    ADD CONSTRAINT checkins_pkey PRIMARY KEY (id);


--
-- Name: commissions commissions_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY commissions
    ADD CONSTRAINT commissions_id_key UNIQUE (id);


--
-- Name: commissions commissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY commissions
    ADD CONSTRAINT commissions_name_key UNIQUE (name);


--
-- Name: companies companies_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY companies
    ADD CONSTRAINT companies_name_key UNIQUE (name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_addresses delivery_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY delivery_addresses
    ADD CONSTRAINT delivery_addresses_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: event_guests event_guests_guest_event_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event_guests
    ADD CONSTRAINT event_guests_guest_event_key UNIQUE (guest, event);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (customer_id, unit_id, company_id);


--
-- Name: food_park_management food_park_management_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_park_management
    ADD CONSTRAINT food_park_management_pkey PRIMARY KEY (id);


--
-- Name: food_park_types food_park_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_park_types
    ADD CONSTRAINT food_park_types_name_key UNIQUE (name);


--
-- Name: food_parks food_parks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_parks
    ADD CONSTRAINT food_parks_pkey PRIMARY KEY (id);


--
-- Name: gen_state gen_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY gen_state
    ADD CONSTRAINT gen_state_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: loyalty_packages loyalty_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_packages
    ADD CONSTRAINT loyalty_packages_pkey PRIMARY KEY (id);


--
-- Name: loyalty loyalty_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty
    ADD CONSTRAINT loyalty_pkey PRIMARY KEY (id);


--
-- Name: loyalty_rewards loyalty_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_rewards
    ADD CONSTRAINT loyalty_rewards_pkey PRIMARY KEY (id);


--
-- Name: loyalty_used loyalty_used_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_used
    ADD CONSTRAINT loyalty_used_pkey PRIMARY KEY (id);


--
-- Name: manual_redeem_packages manual_redeem_packages_redeem_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY manual_redeem_packages
    ADD CONSTRAINT manual_redeem_packages_redeem_code_key UNIQUE (redeem_code);


--
-- Name: order_history order_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history
    ADD CONSTRAINT order_history_pkey PRIMARY KEY (id);


--
-- Name: order_state order_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_state
    ADD CONSTRAINT order_state_pkey PRIMARY KEY (id);


--
-- Name: package_given package_given_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY package_given
    ADD CONSTRAINT package_given_id_key UNIQUE (id);


--
-- Name: package_given package_given_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY package_given
    ADD CONSTRAINT package_given_qr_code_key UNIQUE (qr_code);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: prepay_recharges prepay_recharges_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY prepay_recharges
    ADD CONSTRAINT prepay_recharges_id_key UNIQUE (id);


--
-- Name: review_approvals review_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY review_approvals
    ADD CONSTRAINT review_approvals_pkey PRIMARY KEY (id);


--
-- Name: review_states review_states_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY review_states
    ADD CONSTRAINT review_states_name_key UNIQUE (name);


--
-- Name: review_states review_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY review_states
    ADD CONSTRAINT review_states_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY roles
    ADD CONSTRAINT roles_type_key UNIQUE (type);


--
-- Name: search_preferences search_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY search_preferences
    ADD CONSTRAINT search_preferences_pkey PRIMARY KEY (id);


--
-- Name: territories territories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY territories
    ADD CONSTRAINT territories_pkey PRIMARY KEY (id);


--
-- Name: loyalty_packages uc_company_tier; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_packages
    ADD CONSTRAINT uc_company_tier UNIQUE (company_id, tier);


--
-- Name: unit_types unit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY unit_types
    ADD CONSTRAINT unit_types_pkey PRIMARY KEY (id);


--
-- Name: unit_types unit_types_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY unit_types
    ADD CONSTRAINT unit_types_type_key UNIQUE (type);


--
-- Name: units units_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY units
    ADD CONSTRAINT units_name_key UNIQUE (name);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: admins admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY admins
    ADD CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: checkin_history checkin_history_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkin_history
    ADD CONSTRAINT checkin_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: checkin_history checkin_history_food_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkin_history
    ADD CONSTRAINT checkin_history_food_park_id_fkey FOREIGN KEY (food_park_id) REFERENCES food_parks(id);


--
-- Name: checkin_history checkin_history_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkin_history
    ADD CONSTRAINT checkin_history_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id);


--
-- Name: checkin_history checkin_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkin_history
    ADD CONSTRAINT checkin_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: checkins checkins_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkins
    ADD CONSTRAINT checkins_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: checkins checkins_food_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkins
    ADD CONSTRAINT checkins_food_park_id_fkey FOREIGN KEY (food_park_id) REFERENCES food_parks(id);


--
-- Name: checkins checkins_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY checkins
    ADD CONSTRAINT checkins_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id);


--
-- Name: companies companies_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY companies
    ADD CONSTRAINT companies_country_id_fkey FOREIGN KEY (country_id) REFERENCES countries(id);


--
-- Name: companies companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY companies
    ADD CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: delivery_addresses delivery_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY delivery_addresses
    ADD CONSTRAINT delivery_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);


--
-- Name: drivers drivers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY drivers
    ADD CONSTRAINT drivers_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: drivers_foodpark drivers_foodpark_food_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY drivers_foodpark
    ADD CONSTRAINT drivers_foodpark_food_park_id_fkey FOREIGN KEY (food_park_id) REFERENCES food_parks(id);


--
-- Name: drivers_foodpark drivers_foodpark_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY drivers_foodpark
    ADD CONSTRAINT drivers_foodpark_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: drivers drivers_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY drivers
    ADD CONSTRAINT drivers_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id);


--
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: event_guests event_guests_event_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event_guests
    ADD CONSTRAINT event_guests_event_fkey FOREIGN KEY (event) REFERENCES events(id);


--
-- Name: event_guests event_guests_guest_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event_guests
    ADD CONSTRAINT event_guests_guest_fkey FOREIGN KEY (guest) REFERENCES users(id);


--
-- Name: events events_manager_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY events
    ADD CONSTRAINT events_manager_fkey FOREIGN KEY (manager) REFERENCES users(id);


--
-- Name: favorites favorites_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY favorites
    ADD CONSTRAINT favorites_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: favorites favorites_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY favorites
    ADD CONSTRAINT favorites_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);


--
-- Name: favorites favorites_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY favorites
    ADD CONSTRAINT favorites_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id);


--
-- Name: order_history fk_commission; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history
    ADD CONSTRAINT fk_commission FOREIGN KEY (commission_type) REFERENCES commissions(name);


--
-- Name: order_history fk_users; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history
    ADD CONSTRAINT fk_users FOREIGN KEY (driver_id) REFERENCES users(id);


--
-- Name: food_park_management food_park_management_food_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_park_management
    ADD CONSTRAINT food_park_management_food_park_id_fkey FOREIGN KEY (food_park_id) REFERENCES food_parks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: food_park_management food_park_management_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_park_management
    ADD CONSTRAINT food_park_management_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: food_parks food_parks_foodpark_mgr_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_parks
    ADD CONSTRAINT food_parks_foodpark_mgr_fkey FOREIGN KEY (foodpark_mgr) REFERENCES users(id);


--
-- Name: food_parks food_parks_foodpark_mgr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_parks
    ADD CONSTRAINT food_parks_foodpark_mgr_id_fkey FOREIGN KEY (foodpark_mgr_id) REFERENCES users(id);


--
-- Name: food_parks food_parks_territory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_parks
    ADD CONSTRAINT food_parks_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES territories(id);


--
-- Name: food_parks food_parks_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY food_parks
    ADD CONSTRAINT food_parks_type_fkey FOREIGN KEY (type) REFERENCES food_park_types(name);


--
-- Name: locations locations_territory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY locations
    ADD CONSTRAINT locations_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES territories(id);


--
-- Name: loyalty loyalty_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty
    ADD CONSTRAINT loyalty_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: loyalty loyalty_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty
    ADD CONSTRAINT loyalty_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);


--
-- Name: loyalty_packages loyalty_packages_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_packages
    ADD CONSTRAINT loyalty_packages_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: loyalty_packages loyalty_packages_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_packages
    ADD CONSTRAINT loyalty_packages_package_id_fkey FOREIGN KEY (package_id) REFERENCES packages(id);


--
-- Name: loyalty_rewards loyalty_rewards_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_rewards
    ADD CONSTRAINT loyalty_rewards_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: loyalty_used loyalty_used_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_used
    ADD CONSTRAINT loyalty_used_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: loyalty_used loyalty_used_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY loyalty_used
    ADD CONSTRAINT loyalty_used_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);


--
-- Name: order_history order_history_checkin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history
    ADD CONSTRAINT order_history_checkin_id_fkey FOREIGN KEY (checkin_id) REFERENCES checkins(id);


--
-- Name: order_history order_history_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history
    ADD CONSTRAINT order_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: order_history order_history_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history
    ADD CONSTRAINT order_history_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);


--
-- Name: order_history order_history_delivery_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history
    ADD CONSTRAINT order_history_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES delivery_addresses(id);


--
-- Name: order_history order_history_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_history
    ADD CONSTRAINT order_history_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id);


--
-- Name: order_state order_state_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY order_state
    ADD CONSTRAINT order_state_order_id_fkey FOREIGN KEY (order_id) REFERENCES order_history(id);


--
-- Name: package_given package_given_gifted_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY package_given
    ADD CONSTRAINT package_given_gifted_user_fkey FOREIGN KEY (gifted_user) REFERENCES users(id);


--
-- Name: package_given package_given_package_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY package_given
    ADD CONSTRAINT package_given_package_fkey FOREIGN KEY (package) REFERENCES packages(id);


--
-- Name: packages packages_company_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY packages
    ADD CONSTRAINT packages_company_fkey FOREIGN KEY (company) REFERENCES companies(id);


--
-- Name: prepay_recharges prepay_recharges_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY prepay_recharges
    ADD CONSTRAINT prepay_recharges_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id);


--
-- Name: prepay_recharges prepay_recharges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY prepay_recharges
    ADD CONSTRAINT prepay_recharges_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: review_approvals review_approvals_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY review_approvals
    ADD CONSTRAINT review_approvals_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES admins(id);


--
-- Name: reviews reviews_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY reviews
    ADD CONSTRAINT reviews_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);


--
-- Name: reviews reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY reviews
    ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);


--
-- Name: reviews reviews_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY reviews
    ADD CONSTRAINT reviews_status_fkey FOREIGN KEY (status) REFERENCES review_states(name);


--
-- Name: reviews reviews_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY reviews
    ADD CONSTRAINT reviews_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id);


--
-- Name: search_preferences search_preferences_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY search_preferences
    ADD CONSTRAINT search_preferences_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);


--
-- Name: search_preferences search_preferences_territory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY search_preferences
    ADD CONSTRAINT search_preferences_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES territories(id);


--
-- Name: territories territories_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY territories
    ADD CONSTRAINT territories_country_id_fkey FOREIGN KEY (country_id) REFERENCES countries(id);


--
-- Name: units units_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY units
    ADD CONSTRAINT units_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;


--
-- Name: units units_territory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY units
    ADD CONSTRAINT units_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES territories(id);


--
-- Name: units units_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY units
    ADD CONSTRAINT units_type_fkey FOREIGN KEY (type) REFERENCES unit_types(type);


--
-- Name: units units_unit_mgr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY units
    ADD CONSTRAINT units_unit_mgr_id_fkey FOREIGN KEY (unit_mgr_id) REFERENCES users(id);


--
-- Name: users users_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_role_fkey FOREIGN KEY (role) REFERENCES roles(type);

ALTER TABLE ONLY users
    ADD CONSTRAINT state_id_fkey FOREIGN KEY (state_id) REFERENCES states(id);
--
-- Name: calc_earth_dist(numeric, numeric, numeric, numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION calc_earth_dist(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric) TO sfez_rw;


SET search_path = pg_catalog;

--
-- Name: pg_constraint; Type: ACL; Schema: pg_catalog; Owner: postgres
--

GRANT SELECT ON TABLE pg_constraint TO sfez_rw;


SET search_path = public, pg_catalog;

--
-- Name: admins; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE admins TO sfez_rw;


--
-- Name: admins_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE admins_id_seq TO sfez_rw;


--
-- Name: checkin_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE checkin_history TO sfez_rw;


--
-- Name: checkin_history_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE checkin_history_id_seq TO sfez_rw;


--
-- Name: checkins; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE checkins TO sfez_rw;


--
-- Name: checkins_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE checkins_id_seq TO sfez_rw;


--
-- Name: commissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE commissions TO sfez_rw;


--
-- Name: commissions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE commissions_id_seq TO sfez_rw;


--
-- Name: companies; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE companies TO sfez_rw;


--
-- Name: companies_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE companies_id_seq TO sfez_rw;


--
-- Name: countries; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE countries TO sfez_rw;


--
-- Name: countries_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE countries_id_seq TO sfez_rw;


--
-- Name: customers; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE customers TO sfez_rw;


--
-- Name: customers_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE customers_id_seq TO sfez_rw;


--
-- Name: delivery_addresses; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE delivery_addresses TO sfez_rw;


--
-- Name: delivery_addresses_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE delivery_addresses_id_seq TO sfez_rw;


--
-- Name: drivers; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE drivers TO sfez_rw;


--
-- Name: drivers_foodpark; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE drivers_foodpark TO sfez_rw;


--
-- Name: drivers_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE drivers_id_seq TO sfez_rw;


--
-- Name: event_guests; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE event_guests TO sfez_rw;


--
-- Name: events; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE events TO sfez_rw;


--
-- Name: events_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE events_id_seq TO sfez_rw;


--
-- Name: favorites; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE favorites TO sfez_rw;


--
-- Name: food_park_management; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE food_park_management TO sfez_rw;


--
-- Name: food_park_management_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE food_park_management_id_seq TO sfez_rw;


--
-- Name: food_parks; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE food_parks TO sfez_rw;


--
-- Name: food_parks_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE food_parks_id_seq TO sfez_rw;


--
-- Name: gen_state_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE gen_state_id_seq TO sfez_rw;


--
-- Name: locations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE locations TO sfez_rw;


--
-- Name: locations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE locations_id_seq TO sfez_rw;


--
-- Name: loyalty; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE loyalty TO sfez_rw;


--
-- Name: loyalty_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE loyalty_id_seq TO sfez_rw;


--
-- Name: loyalty_packages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE loyalty_packages TO sfez_rw;


--
-- Name: loyalty_packages_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE loyalty_packages_id_seq TO sfez_rw;


--
-- Name: loyalty_rewards; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE loyalty_rewards TO sfez_rw;


--
-- Name: loyalty_rewards_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE loyalty_rewards_id_seq TO sfez_rw;


--
-- Name: loyalty_used; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE loyalty_used TO sfez_rw;


--
-- Name: loyalty_used_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE loyalty_used_id_seq TO sfez_rw;


--
-- Name: manual_redeem_packages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE manual_redeem_packages TO sfez_rw;


--
-- Name: order_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE order_history TO sfez_rw;


--
-- Name: order_history_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE order_history_id_seq TO sfez_rw;


--
-- Name: order_state; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE order_state TO sfez_rw;


--
-- Name: order_state_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE order_state_id_seq TO sfez_rw;


--
-- Name: package_given; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE package_given TO sfez_rw;


--
-- Name: package_given_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE package_given_id_seq TO sfez_rw;


--
-- Name: packages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE packages TO sfez_rw;


--
-- Name: packages_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE packages_id_seq TO sfez_rw;


--
-- Name: prepay_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE prepay_history TO sfez_rw;


--
-- Name: prepay_recharges; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE prepay_recharges TO sfez_rw;


--
-- Name: prepay_recharges_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE prepay_recharges_id_seq TO sfez_rw;


--
-- Name: review_approvals; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE review_approvals TO sfez_rw;


--
-- Name: review_approvals_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE review_approvals_id_seq TO sfez_rw;


--
-- Name: review_states; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE review_states TO sfez_rw;


--
-- Name: review_states_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE review_states_id_seq TO sfez_rw;


--
-- Name: reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE reviews TO sfez_rw;


--
-- Name: reviews_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE reviews_id_seq TO sfez_rw;


--
-- Name: roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE roles TO sfez_rw;


--
-- Name: roles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE roles_id_seq TO sfez_rw;


--
-- Name: search_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE search_preferences TO sfez_rw;


--
-- Name: search_preferences_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE search_preferences_id_seq TO sfez_rw;


--
-- Name: square_unit; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE square_unit TO sfez_rw;


--
-- Name: square_user; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE square_user TO sfez_rw;


--
-- Name: territories; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE territories TO sfez_rw;


--
-- Name: territories_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE territories_id_seq TO sfez_rw;


--
-- Name: unit_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE unit_types TO sfez_rw;


--
-- Name: unit_types_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE unit_types_id_seq TO sfez_rw;


--
-- Name: units; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE units TO sfez_rw;


--
-- Name: units_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE units_id_seq TO sfez_rw;


--
-- Name: users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE users TO sfez_rw;


--
-- Name: users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE users_id_seq TO sfez_rw;


--
-- PostgreSQL database dump complete
--


