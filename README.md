# SFEZ Server
#
## Synopsis

The SFEZ server is a MEAN-based implementation that serves the relationship services for StreetFood EZ. Basic services include reviews, favorites, checkins, loyalty, social media.

## Code Example

REST services of the form:

GET favorites/customers/{customerId}
GET favorites/companies/{companyId}

## Motivation

Provides relationship services between customer and food truck company.

## Requirements

- node: >= 7.0.0
- docker: >= 1.13.0
- docker-compose: >= 1.10

## Installation

**Note: See docker section first**

Dependencies: 
1. Postgres installed
2. NodeJS installed
3. SFEZ_server git repo cloned locally

Start up the DB, and create the development database:
From root of /opt/SFEZ_server:

Install new schema

    :~$ cd db
    :~$ ./create_sfezdb.sh

Then install test data

    :~$ psql -U postgres sfezdb < sfez_create_test_data.dmp


Run the server (in development mode)

    :~$ export NODE_ENV=test
    :~$ nodemon server.js

Specific files can be turned on for debug via

    :~$ export DEBUG=auth,rest_options

See the debug file name in each file's requires block. For example:

    var debug   = require('debug')('auth');

Go to http://localhost:1337/auth/login to login and obtain a JWT

Go to http://localhost:1337/api/v1/rel/companies (for example) to hit a specific endpoint.

## API Reference

See the Service Catalog for endpoint and payload documentation.

### GET /foodparks/:foodParkId/checkins

List all units that have made checkin in a specific Food Park.

### GET /foodparks/:foodParkId/units

List all units managed by the Food Park specified.

### POST /foodparks/:foodParkId/units

Add a unit to a Food Park.

JSON Body message

```javascript
{
  "unit_id": 1
}
```

### GET /foodparks/:foodParkId/units/active_orders

List all units with their actives orders.

JSON Response Body
```javascript
[
  {
    "id": 2000
    "name": "Classy Cuban Truck",
    "type": "TRUCK",
    "company_id": 110022,
    "orders": [
      {
        "id", 123,
        "amount": "R$35.00",
        .
        .
        .
      }
    ]
  }
]
```

### GET /foodparks/:foodParkId/orders/:orderId/drivers/:driverId

Get all orders that belongs to a driver

JSON Response Body

Array of objects

### PUT /foodparks/:foodParkId/orders/:orderId

Add an order to a driver

JSON Body Message

```javascript
{"driver_id": 2000}
```
### DELETE /foodparks/:foodParkId/units/:unitId

Remove a specified unit from Food Park.

### GET /request/:request_id

List all offers related to a request by request id

### GET /customers/:customer_id/requests

List all offers related to a customer by customer id

### POST /requests

Create Request
params: customer_id, request_name, request_photo, category_id, latitude, longitude, country, state, territory, request_description
condition, buy_back_term

### GET /requests

List all requests and their corressponsding offers

## DELETE request/:request_id

Deletes a single request for the request_id passed

## PUT request/:request_id

Updates a single request for the request_id passed
customer_id ,request_name ,request_photo ,category_id , latitude ,longitude,description ,condition ,buy_back_term

Pass the params to be updated for the request

## GET companies/:company_id/offers

List all offers along with request according to the company id passed

## POST /Offers
Create an offer
Required Params:  request_id, request_name, company_id, unit_id, cash_offer
Optional Params:  buy_back_amount, tax_amount, offer_term, offer_accepted
                  total_redemptionm, rating, distance

{
    "message": "request created",
    "data": [   
        {
            "id": 5,
            "request_id": 4,
            "request_name": "Test Name 1",
            "company_id": 1005,
            "pawn_poc": "Test ",
            "pawn_name": null,
            "pawn_address": null,
            "pawn_phone": null,
            "unit_id": 1,
            "cash_offer": "123.5600",
            "buy_back_amount": "123.5600",
            "tax_amount": "0.0000",
            "offer_term": null,
            "offer_accepted": false,
            "total_redemption": "143.3450",
            "maturity_date": null,
            "interest_rate": "0.0000",
            "rating": "0.0000",
            "distance": "0.0000",
            "created_at": "2018-04-19T04:13:49.739Z",
            "modified_at": "2018-04-19T04:13:49.739Z",
            "is_deleted": false
        }
    ]
}

## PUT offers/:offer_id
Update an offer
request_id, request_name, company_id, pawn_poc, unit_id, cash_offer, pawn_name, pawn_address, 
pawn_phone, buy_back_amount, tax_amount, offer_term, offer_accepted, total_redemptionm, maturity_date, interest_rate, rating, distance

## DELETE /offers/:offer_id
Delete an Offer

{
    "success": true
}

## GET companies/:company_id/units/:unit_id/Offers
Get Offers By Company Id & Unit ID

## GET contracts/:contract_id
Get Contract Details By contract id

## GET customers/:customer_id/contracts
Get Contract Details By Customer id

## GET companies/:company_id/contracts?offer_approved=true
=> offer_approved : optional parameter to reterive all contracts with offer_approved flag true
Get Contract Details By Company id

## DELETE contracts/:contract_id
Delete a contract, only if offer_accepted flag for the contract is false

## GET count/*
Get Count for the cotext passed
/count/requests/{id}/offers 
/count/customers/{id}/contracts

## GET /mapsearch/pawnshops?latitude=-20.777182&longitude=-35.200323&distance=10
Get Pawnshop List within the distance radius of the lat. and long. passed

## POST /contracts
Create Contract
Required Param: company_id, unit_id, customer_id, offer_id, request_name, request_photo
Optional : cash_offer, buy_back_amount, tax_amount, term_months

## GET contracts/qrcode/:qr_code
Get Contract Details by QR Code

## Tests

1. Install mocha
2. Execute all tests from root of SFEZ_server: mocha
3. Execute specific test suite example: mocha test/authentication.server.test.js

## Contribution

* Setup editor: http://editorconfig.org/

## Docker

If you want to use docker to up and running the service, follow the steps below.

First you need to install docker and docker-compose in your machine, follow the resources
to install:

[Docker](https://docs.docker.com/engine/installation)

[Docker Compose](https://docs.docker.com/engine/installation)

With all the components installed follow the steps below:

```bash
$ cd docker/base-images
$ docker-compose build
```

This will install all the docker base images necessary to run the project, when finish
the download process, check the images:

```bash
$ docker images | grep sfez*
sfez/postgres-client   9.5-stretch-slim
sfez/node              8.9.1-slim
sfez/postgres-server   9.5.6
```
Now is possible to create the services that we need to run the project, the first one
and the main service is the database infrastructure. Follow the steps below:

```bash
$ cd docker/database
$ docker-compose up -d
```

To check if the services are running, type:

```bash
$ docker ps -a | grep sfez*
* * * * * * sfez-pgclient
* * * * * * sfez-pgserver
```

Now is time to load data into database, type:

```bash
$ ./run
```

this will load all fake data into database:

To test the database, type:

```bash
$ docker-compose exec sfez-pgclient pgcli -d sfezdb
```

and querying some data.

After that we need to install our restapi and make some requests.

```bash
$ cd docker/webservice
$ docke-compose up -d && docker-compose logs -f
```

To check if the rest api is running, type:

```bash
$ docker ps -a | grep
* * * * * * sfez-webservice
```

with that you are able to change source code and make requests to the service.

To stop the services change to the path where the docker-compose.yml file resides
and type:

```bash
$ docker-compose down
```

## Contributors

SFEZ CODERS ONLY!!

## License
