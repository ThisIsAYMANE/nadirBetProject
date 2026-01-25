# Casino API Documentation - Slotegrator Game Aggregator

**Document Version:** 1.4.3  
**Last Updated:** 2025-07-14

## Important Notes

⚠️ **IP Whitelisting Required:** You must provide production server IP addresses after integration completion. Failure to provide all IPs (or notify after updates) may result in API unavailability.

## Overview

This document describes an HTTP/1.1 based API (RFC 2616) for integrating with the Slotegrator Game Aggregator platform.

**Standards:**
- HTTP/1.1 - RFC 2616
- Currency codes - ISO 4217
- Language codes - ISO 639-1
- Date and time format - ISO 8601

## Table of Contents

1. [Integration Data](#integration-data)
2. [Endpoints and Base API URL](#endpoints-and-base-api-url)
3. [Request/Response Format](#requestresponse-format)
4. [Security & Authentication](#security--authentication)
5. [Game Launch Flow](#game-launch-flow)
6. [API Endpoints](#api-endpoints)
7. [Integrator Callbacks](#integrator-callbacks)
8. [Additional Features](#additional-features)

---

## Integration Data

Provided by Game Aggregator:
1. **Merchant ID**
2. **Merchant Key**
3. **Base API URL**

## Endpoints and Base API URL

- **Base API URL:** `https://example.com/api/v1`
- **Endpoint:** `/games/lobby`
- **Full URL:** `https://example.com/api/v1/games/lobby`

## Request/Response Format

### Request Format
- Query parameters: `application/x-www-form-urlencoded`
- POST body: `application/x-www-form-urlencoded`

### Response Format
- Default: `JSON` with `Content-Type: application/json`

### HTTP Status Codes

| Code | Interpretation |
|------|----------------|
| 200 | OK. Everything worked as expected |
| 201 | Resource successfully created (POST). Location header contains URL |
| 204 | Success with no body content (DELETE) |
| 304 | Resource not modified (use cached version) |
| 400 | Bad request (invalid JSON, invalid parameters, etc.) |
| 401 | Authentication failed |
| 403 | User not allowed to access endpoint |
| 404 | Resource not found |
| 405 | Method not allowed |
| 415 | Unsupported media type |
| 422 | Data validation failed |
| 429 | Too many requests (rate limiting) |
| 500 | Internal server error |

### Error Response Format

```json
{
  "name": "Exception name",
  "message": "Exception message",
  "code": 0,
  "status": 404
}
```

### Collections & Pagination

Pagination metadata available via HTTP headers:

- `X-Pagination-Total-Count`: Total number of resources
- `X-Pagination-Page-Count`: Number of pages
- `X-Pagination-Current-Page`: Current page (1-based)
- `X-Pagination-Per-Page`: Resources per page
- `Link`: Navigational links for pagination

**Collection Response Example:**
```json
{
  "items": [...],
  "_links": {
    "self": {"href": "https://example.com/endpoint?page=1"},
    "next": {"href": "https://example.com/endpoint?page=2"},
    "last": {"href": "https://example.com/endpoint?page=50"}
  },
  "_meta": {
    "totalCount": 1000,
    "pageCount": 50,
    "currentPage": 1,
    "perPage": 20
  }
}
```

## Security & Authentication

### Authorization Headers

All requests (except game launch redirect) must include:

| Header | Description |
|--------|-------------|
| `X-Merchant-Id` | Merchant ID provided by integration manager |
| `X-Timestamp` | Request timestamp (expires if >30 seconds difference) |
| `X-Nonce` | Random string |
| `X-Sign` | SHA1 HMAC signature |

### X-Sign Calculation

1. Merge request parameters with authorization headers
2. Sort resulting array by key (ascending)
3. Generate URL-encoded query string
4. Use SHA1 HMAC with Merchant Key for signing

**PHP Example:**
```php
$merchantKey = 'Merchant Key provided by integration manager';
$headers = [
  'X-Merchant-Id' => 'value',
  'X-Timestamp' => time(),
  'X-Nonce' => md5(uniqid(mt_rand(), true)),
];
$requestParams = [
  'game_uuid' => 'abcd12345',
  'currency' => 'USD',
  'return_url' => 'https://someclient.com/somegamepage'
];
$mergedParams = array_merge($requestParams, $headers);
ksort($mergedParams);
$hashString = http_build_query($mergedParams);
$XSign = hash_hmac('sha1', $hashString, $merchantKey);
```

**X-Sign Validation (for incoming requests):**
```php
$merchantKey = 'Merchant Key provided by integration manager';
$headers = [
  'X-Merchant-Id' => 'Get header value',
  'X-Timestamp' => 'Get header value',
  'X-Nonce' => 'Get header value',
];
$XSign = 'Get header value';
$mergedParams = array_merge($_POST, $headers);
ksort($mergedParams);
$hashString = http_build_query($mergedParams);
$expectedSign = hash_hmac('sha1', $hashString, $merchantKey);
if ($XSign !== $expectedSign) {
  throw new \Exception('Invalid sign');
}
```

## Game Launch Flow

### Games Without Lobby
1. Call `/games/init`
2. Redirect player to provided URL

### Games With Lobby
1. Call `/games/lobby`
2. Call `/games/init` with provided `lobby_data`
3. Redirect player to provided URL

> **Note:** Games should be cached on client side after retrieval.

---

## API Endpoints

### Games

#### GET `/games` - Retrieve Games List

Returns collection of games available for your Merchant ID.

**Rate Limits:**
- Production: 1 request per second
- Staging/Demo: 100 requests per second
- Production returns max 50 games per page

⚠️ **Warning:** Games list data MUST be cached client-side, including static data like game images. It's forbidden to publish aggregator's image URLs in client front-end.

**Request Parameters:**
- `expand` (string, optional): Additional object expansions, comma-separated

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `uuid` | string | Game UUID (used in `/init` and `/lobby`) |
| `name` | string | Game name |
| `image` | string | Game image URL |
| `type` | string | Game type |
| `provider` | string | Game provider name |
| `provider_id` | integer | Game provider ID |
| `technology` | string | Game technology |
| `has_lobby` | integer | 1 or 0 - indicates if game has lobby |
| `is_mobile` | integer | 1 or 0 - indicates if game is for mobile devices |
| `has_freespins` | integer | 1 or 0 - indicates if game has freespins |
| `has_tables` | integer | 1 or 0 - indicates if game has game tables |
| `freespin_valid_until_full_day` | integer | 1 or 0 - indicates `valid_until` must have time 00:00:00 |
| `label` | string | Sub provider's label |

**Available Expansions:**
- `tags`: Assigned tags objects
- `parameters`: Additional game parameters
- `images`: Game images objects (including high-quality)
- `related_games`: Related games list

**Example Request:**
```
GET /games?expand=tags,parameters,images,related_games
```

**Example Response:**
```json
{
  "items": [
    {
      "uuid": "abcd12345",
      "name": "Book of Ra",
      "image": "https://static.game-aggregator.com/games/4694605316aa1ca969fe89227aabe51c1e8b091b.jpg",
      "type": "Slots",
      "provider": "abcd12345",
      "provider_id": 12345,
      "technology": "Flash",
      "has_lobby": 0,
      "is_mobile": 0,
      "has_freespins": 1,
      "has_tables": 0,
      "label": "Some Sub Provider Legal Name GmBH.",
      "tags": [
        {
          "code": "jackpots",
          "label": "Jackpots"
        }
      ],
      "parameters": {
        "rtp": 98.72,
        "volatility": "medium-high",
        "reels_count": "5+1",
        "lines_count": 20
      },
      "images": [
        {
          "name": "4694605316aa1ca969fe89227aabe51c1e8b091b.jpg",
          "file": "games/4694605316aa1ca969fe89227aabe51c1e8b091b.jpg",
          "url": "https://static.game-aggregator.com/games/4694605316aa1ca969fe89227aabe51c1e8b091b.jpg",
          "type": "regular"
        }
      ],
      "related_games": []
    }
  ],
  "_meta": {
    "totalCount": 1000,
    "pageCount": 50,
    "currentPage": 1,
    "perPage": 20
  }
}
```

### Game Tags

#### GET `/game-tags` - Retrieve Game Tags List

**Request Parameters:**
- `expand` (string, optional): Additional object expansion

**Response Fields:**
- `code` (string): Game tag code
- `label` (string): Game tag name

**Available Expansions:**
- `category`: Assigned tag category object

**Example Request:**
```
GET /game-tags?expand=category
```

**Example Response:**
```json
{
  "items": [
    {
      "code": "jackpots",
      "label": "Jackpots",
      "category": {
        "code": "financial",
        "label": "Financial"
      }
    }
  ]
}
```

### Lobby

#### GET `/games/lobby` - Get Lobby Tables

Returns list of tables for games with lobby.

**Request Parameters:**
- `game_uuid` (string, required): Game UUID from `/games`
- `currency` (string, required): Player currency
- `technology` (string, optional): Filter by technology ("html5" or "flash")

**Response Fields:**
- `lobby` (array): Contains lobby data with:
  - `lobbyData` (string): Data required for `/games/init` `lobby_data` parameter
  - `name` (string): Table name
  - `isOpen` (boolean): True if game is open
  - `openTime` (string): Lobby open time
  - `closeTime` (string): Lobby close time
  - `dealerName` (string): Dealer name
  - `dealerAvatar` (string): Dealer avatar URL
  - `technology` (string): "html5" or "flash"
  - `limits` (array): Table limits (some games return single limit object)
  - `tableId` (string): Table ID (used in `/freevouchers/set`)

**Example Request:**
```
GET /games/lobby?game_uuid=abc123&currency=USD
```

**Example Response:**
```json
{
  "lobby": {
    "lobbyData": "abcd12345",
    "name": "Baccarat",
    "isOpen": true,
    "openTime": "11:00:00",
    "closeTime": "12:00:00",
    "dealerName": "abcd12345",
    "dealerAvatar": "https://avatar-url.com",
    "technology": "html5",
    "limits": [
      {
        "currency": "USD",
        "min": 1,
        "max": 100
      }
    ]
  }
}
```

### Init

#### POST `/games/init` - Initialize Game Session

Prepares game for launch and returns final URL for player redirection.

> **Note:** Some providers allow launching different games after init phase (subsessions). In this case, seamless transactions may have different `game_uuid` but same `session_id`. Some providers may allow bet in mobile version but win in desktop version - in this case `session_id` differs but `round_id` is the same.

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `game_uuid` | string | Yes | Game UUID from `/games` |
| `player_id` | string | Yes | Unique player ID on integrator side |
| `player_name` | string | Yes | Player nickname |
| `currency` | string | Yes | Player currency |
| `session_id` | string | Yes | Unique game session ID on integrator side |
| `device` | string | No | Device type: "desktop" (default) or "mobile" |
| `return_url` | string | No | Redirect URL after game ends |
| `language` | string | No | Player language |
| `email` | string | No | Player email |
| `lobby_data` | string | No | Required for games with lobby (from `/lobby`) |

**Response:**
```json
{
  "url": "https://example.com/endpoint"
}
```

#### POST `/games/init-demo` - Initialize Demo Game Session

Initializes game in demo mode (only if provider supports demo mode).

**Request Parameters:**
- `game_uuid` (string, required): Game UUID from `/games`
- `device` (string, optional): "desktop" (default) or "mobile"
- `return_url` (string, optional): Redirect URL after game ends
- `language` (string, optional): Player language

**Response:**
```json
{
  "url": "https://example.com/endpoint"
}
```

### Limits

#### GET `/limits` - Get Merchant Limits

Returns list of limits for merchant.

**Response:**
```json
[
  {
    "amount": "1000.00",
    "currency": "USD",
    "providers": ["Provider1", "Provider2", "Provider3"]
  },
  {
    "amount": "1000.00",
    "currency": "EUR",
    "providers": ["Provider1"]
  }
]
```

#### GET `/limits/freespin` - Get Merchant Freespin Limits

Returns list of freespin limits for merchant.

**Response:**
```json
[
  {
    "quantity": 17,
    "currency": "USD",
    "providers": ["Provider1", "Provider2", "Provider3"]
  },
  {
    "quantity": 1000,
    "currency": "EUR",
    "providers": ["Provider1"]
  }
]
```

### Jackpots (LEGACY)

#### GET `/jackpots` - Get Jackpots List

Returns list of jackpots for game providers assigned to merchant. Cached for 60 seconds.

**Response:**
```json
[
  {
    "name": "jackpot name",
    "amount": "1000.00",
    "currency": "USD",
    "provider": "Provider1"
  },
  {
    "name": null,
    "amount": "1000.00",
    "currency": "EUR",
    "provider": "Provider2"
  }
]
```

### Balance Notification (LEGACY)

#### POST `/balance/notify` - Notify Balance Changes

Notifies game providers about player balance changes.

**Request Parameters:**
- `balance` (double, required): Updated player balance
- `session_id` (string): Unique integrator game session ID from `/games/init`

**Example Request:**
```
POST /balance/notify
balance=11.23&session_id=23456
```

**Response:**
```
HTTP/1.1 200 OK
```

### Freespins

#### GET `/freespins/bets` - Get Available Freespin Bets

Returns list of available freespin bets for chosen game and currency.

**Request Parameters:**
- `game_uuid` (string, required): Game UUID from `/games`
- `currency` (string, required): Player currency

**Response Fields:**
- `denominations` (array): Available denominations
- `bets` (array, optional): Available freespin bets
- `total_bets` (array, optional): Possible total bets values

**Bets Description:**
- `bet_id` (string): ID of bet in list
- `bet_per_line` (string/float): Bet amount per line, or "max"/"mid"/"min"
- `lines` (integer): Lines count

**Total Bets Description:**
- `bet_id` (integer): ID of bet in total_bets list
- `amount` (float): Free spin total bet amount per spin

**Example Response:**
```json
{
  "denominations": ["0.01", "0.1", "1"],
  "bets": [
    {
      "bet_id": "0",
      "bet_per_line": 1,
      "lines": 25
    },
    {
      "bet_id": "1",
      "bet_per_line": 2,
      "lines": 25
    }
  ],
  "total_bets": [
    {
      "bet_id": 0,
      "amount": 10.0
    },
    {
      "bet_id": 1,
      "amount": 25.0
    }
  ]
}
```

#### POST `/freespins/set` - Set Freespin Campaign

Sets a freespin campaign for player.

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `player_id` | string | Yes | Unique player ID |
| `player_name` | string | Yes | Player nickname |
| `currency` | string | Yes | Player currency |
| `quantity` | int | Yes | Number of freespin rounds |
| `valid_from` | int | Yes | Start date (timestamp) |
| `valid_until` | int | Yes | End date (timestamp) |
| `freespin_id` | string | Yes | Unique campaign identifier |
| `bet_id` | integer | Optional* | Bet ID from `/freespins/bets` |
| `total_bet_id` | integer | Optional* | Total bet ID |
| `denomination` | double | Optional* | Denomination from `/freespins/bets` |
| `game_uuid` | string | Yes | Game UUID from `/games` |

*One of `bet_id`, `denomination`, or `total_bet_id` is required.

**Response:**
```
HTTP/1.1 200 OK
```

#### GET `/freespins/get` - Get Freespin Campaign

Retrieves freespin campaign details.

**Request Parameters:**
- `freespin_id` (string, required): Unique campaign identifier

**Response Fields:**
- `player_id` (string): Unique player ID
- `currency` (string): Player currency
- `quantity` (int): Number of freespin rounds
- `quantity_left` (int): Rounds left
- `valid_from` (int): Start date (timestamp)
- `valid_until` (int): End date (timestamp)
- `freespin_id` (string): Campaign identifier
- `bet_id` (int): Bet ID
- `total_bet_id` (int): Total bet ID
- `denomination` (double): Denomination
- `game_uuid` (string): Game UUID
- `status` (string): Campaign status
- `is_canceled` (int): Is campaign canceled
- `total_win` (double): Total win

**Example Response:**
```json
{
  "player_id": "abcd12345",
  "currency": "USD",
  "quantity": 10,
  "quantity_left": 8,
  "freespin_id": "abcd12345"
}
```

#### POST `/freespins/cancel` - Cancel Freespin Campaign

Cancels freespin campaign for player.

**Request Parameters:**
- `freespin_id` (string, required): Unique campaign identifier

**Response:**
```
HTTP/1.1 200 OK
```

### Freevouchers

#### POST `/freevouchers/set` - Set Freevoucher Campaign

Sets a freevoucher campaign for player.

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `player_id` | string | Yes | Unique player ID |
| `title` | string | Yes | Human readable title (1-40 chars) |
| `currency` | string | Yes | Player currency |
| `initial_balance` | double | Yes | Initial voucher amount |
| `max_winnings` | double | Yes | Maximum winnings amount |
| `valid_until` | int | Yes | End date (timestamp) |
| `voucher_id` | string | Yes | Unique identifier on integrator side |
| `table_ids` | string[] | Yes | Table UUIDs from `/games/lobby` |
| `short_terms` | string | No | Short description of terms |
| `terms_and_conds` | string | No | URL with terms and conditions |

**Response:**
```
HTTP/1.1 200 OK
```

#### GET `/freevouchers/get` - Get Freevoucher Campaign

Retrieves freevoucher status and data.

**Request Parameters:**
- `voucher_id` (string, required): Unique identifier on integrator side

**Response Fields:**
- `player_id` (string): Unique player ID
- `currency` (string): Player currency
- `title` (string): Voucher title
- `state` (string): Campaign status
- `valid_from` (int): Start date (timestamp)
- `valid_until` (int): End date (timestamp)
- `voucher_id` (string): Voucher identifier
- `playable` (double): Remaining amount for betting
- `winnings` (double): Amount won using voucher

**Example Response:**
```json
{
  "player_id": "abcd12345",
  "voucher_id": "abcd12345",
  "currency": "USD",
  "valid_from": 1519610000,
  "valid_until": 1519810000,
  "title": "delight",
  "state": "Active",
  "playable": 50,
  "winnings": 12.5
}
```

#### POST `/freevouchers/cancel` - Cancel Freevoucher Campaign

Cancels freevoucher campaign for player.

**Request Parameters:**
- `voucher_id` (string, required): Unique identifier
- `reason` (string, required): Reason for cancellation
  - "Canceled" - Licensee canceled voucher
  - "Forfeited" - Licensee forfeited voucher

**Response:**
```
HTTP/1.1 200 OK
```

### Self Validation

#### POST `/self-validate` - Self Validation

Allows integrator to check if implementation is correct. Requires active game session (opened within 15 minutes).

**Response:**
```json
{
  "success": true,
  "log": [
    "Log message",
    "Log message"
  ]
}
```

---

## Integrator Callbacks

Game Aggregator sends POST requests to integrator endpoint during game sessions.

### Request Format
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded`
- Parameters passed in POST body

### Response Format
- Content-Type: `application/json`
- Status: `HTTP/1.1 200 OK`
- Format: JSON

⚠️ **Timeout:** Game Aggregator waits max 3 seconds for response. After timeout, requests are considered unsuccessful.

### Error Format

If error occurs, return:
```json
{
  "error_code": "ERROR_CODE",
  "error_description": "Human readable description"
}
```

**Error Codes:**
- `INSUFFICIENT_FUNDS`: Player has insufficient funds (bet action)
- `INTERNAL_ERROR`: Action not executed (player not found, database errors, etc.)

### Security

All Game Aggregator requests include authorization headers:
- `X-Merchant-Id`
- `X-Timestamp`
- `X-Nonce`
- `X-Sign`

Validate X-Sign using same algorithm as request signing.

### Callback Types

#### Balance

Game Aggregator calls to retrieve actual player balance.

**Request Parameters:**
- `action` (string): "balance"
- `player_id` (string): Unique player ID
- `currency` (string): Balance currency
- `session_id` (string): Session ID (if enabled)

**Response:**
```json
{
  "balance": 57.12
}
```

#### Bet

Called when player makes a bet.

**Bet Types:**
- `bet`: Default bet type
- `tip`: Tip for dealer
- `freespin`: Freespin

**Request Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | "bet" |
| `amount` | double | Bet amount |
| `currency` | string | Bet currency |
| `game_uuid` | string | Game UUID from `/games` |
| `player_id` | string | Unique player ID |
| `transaction_id` | string | Unique transaction ID (Game Aggregator) |
| `session_id` | string | Unique game session ID from `/games/init` |
| `type` | string | "bet", "tip", or "freespin" |
| `freespin_id` | string | Freespin campaign ID (if active) |
| `quantity` | int | Freespin rounds left (if active) |
| `round_id` | string | Current transaction round ID (optional) |
| `finished` | boolean | Is round finished (optional) |
| `transaction_datetime` | string | Timestamp with microseconds (optional) |
| `casino_request_retry_count` | int | Retry counter (optional, max 33) |

**Response:**
```json
{
  "balance": 27.18,
  "transaction_id": "abcd12345"
}
```

⚠️ **Important:** Bet with provided `transaction_id` should be processed only once. If already processed, return successful response with processed transaction ID.

#### Win

Called when player wins in game.

**Win Types:**
- `win`: Default win type
- `jackpot`: Player gets jackpot
- `freespin`: Freespin
- `bonus`: Pragmatic provider bonus
- `pragmatic_prize_drop`: Pragmatic prize drop
- `pragmatic_tournament`: Pragmatic tournament
- `promo`: Promotional activities (GameArt, BetGames, AmigoGaming)
- `prize_drop`: Prize drop (Endorphina, BGaming)
- `tournament`: Tournament (Endorphina)
- `unaccounted_promo`: Unaccounted promo (Spribe)
- `loyalty_win`: Loyalty win (BarbaraBang)

**Request Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | "win" |
| `amount` | double | Win amount |
| `currency` | string | Win currency |
| `game_uuid` | string | Game UUID from `/games` |
| `player_id` | string | Unique player ID |
| `transaction_id` | string | Unique transaction ID (Game Aggregator) |
| `session_id` | string | Unique game session ID |
| `type` | string | Win type (see above) |
| `freespin_id` | string | Freespin campaign ID (if active) |
| `quantity` | int | Freespin rounds left (if active) |
| `round_id` | string | Current transaction round ID (optional) |
| `finished` | boolean | Is round finished (optional) |
| `transaction_datetime` | string | Timestamp with microseconds (optional) |
| `casino_request_retry_count` | int | Retry counter (optional, max 33) |

**Response:**
```json
{
  "balance": 170.21,
  "transaction_id": "abcd12345"
}
```

⚠️ **Important:** 
- Win with provided `transaction_id` should be processed only once.
- `round_id` is not provided for freespin wins of ELK provider.

#### Refund

Cash back in case of bet problems. Cancel corresponding bet transaction and return funds to player. If bet doesn't exist, save refund transaction and respond with success.

**Request Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | "refund" |
| `amount` | double | Refund amount |
| `currency` | string | Refund currency |
| `game_uuid` | string | Game UUID from `/games` |
| `player_id` | string | Unique player ID |
| `transaction_id` | string | Unique transaction ID (Game Aggregator) |
| `session_id` | string | Unique game session ID |
| `type` | string | Transaction type: "bet", "tip", "freespin" (optional) |
| `bet_transaction_id` | string | Game Aggregator bet transaction ID to refund |
| `freespin_id` | string | Freespin campaign ID (if active) |
| `quantity` | int | Freespin rounds left (if active) |
| `round_id` | string | Current transaction round ID (optional) |
| `finished` | boolean | Is round finished (optional) |
| `transaction_datetime` | string | Timestamp with microseconds (optional) |
| `casino_request_retry_count` | int | Retry counter (optional, max 33) |

**Response:**
```json
{
  "balance": 27.18,
  "transaction_id": "abcd12345"
}
```

⚠️ **Important:** Bet with provided `bet_transaction_id` should be refunded only once. If already refunded, return processed refund transaction ID.

#### Rollback

Cancels whole round or part of session (if provider doesn't support rounds). Cancel corresponding bet, refund, and win transactions and update player balance. If transactions don't exist, save as "rollbacked" and respond with success.

⚠️ **Important:** Only cancel transactions from `rollback_transactions` list. Don't implement additional logic based on `provider_round_id` that would rollback other transactions.

**Request Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | "rollback" |
| `currency` | string | Rollback currency |
| `game_uuid` | string | Game UUID from `/games` |
| `player_id` | string | Unique player ID |
| `transaction_id` | string | Unique transaction ID (Game Aggregator) |
| `rollback_transactions` | array | List of round transactions |
| `rollback_transactions[].action` | string | "bet", "win", or "refund" |
| `rollback_transactions[].amount` | double | Transaction amount |
| `rollback_transactions[].transaction_id` | string | Transaction ID to rollback |
| `rollback_transactions[].type` | string | Type (see bet/win types) |
| `session_id` | string | Unique game session ID |
| `type` | string | "rollback" |
| `provider_round_id` | string | Game Aggregator round ID |
| `round_id` | string | Game Aggregator round ID |
| `transaction_datetime` | string | Timestamp with microseconds (optional) |
| `casino_request_retry_count` | int | Retry counter (optional, max 33) |

**Response:**
```json
{
  "balance": 27.18,
  "transaction_id": "12345",
  "rollback_transactions": ["12346", "12347"]
}
```

⚠️ **Important:** All transactions in `rollback_transactions` should be processed only once. If already processed, include `transaction_id` in response.

---

## Additional Notes

### Subsessions

Some providers allow launching different games after init phase (in game's interface/lobby). In this case:
- Seamless transactions may have different `game_uuid` but same `session_id`
- Some providers allow bet in mobile version but win in desktop version - `session_id` differs but `round_id` is the same

### Rate Limiting

- Production: 1 request per second for `/games`
- Staging/Demo: 100 requests per second for `/games`
- Production returns max 50 games per page

### Caching

- Games list MUST be cached client-side
- Static data (images) must be cached
- Forbidden to publish aggregator's image URLs in client front-end
- Jackpots list cached for 60 seconds

### Transaction Processing

- All transactions are idempotent - process only once
- If transaction already processed, return success with existing transaction ID
- Response timeout: 3 seconds
- Max retry count: 33

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.4.3 | 2025-07-14 | Latest version |
| 1.4.2 | 2025-03-11 | Added `device` parameter, subsessions explanation |
| 1.4.1 | 2024-11-21 | Added `loyalty_win` win type, seamless transaction fields |
| 1.4.0 | 2024-08-23 | Added `provider_id` to `/games` |
| 1.3.2 | 2024-07-29 | Added freevouchers |
| 1.3.1 | 2024-05-09 | Added win types: `prize_drop`, `tournament` |
| 1.3.0 | 2024-04-29 | Fixed win types for promo activities |
| 1.2.3 | 2023-03-30 | Added `total_bets` to freespins |
| 1.2.2 | 2023-01-30 | Added `expand` parameter and expansions |
| 1.2.1 | 2023-01-18 | Added win parameters: `bonus`, `pragmatic_prize_drop`, `pragmatic_tournament` |
| 1.2.0 | 2022-10-21 | Added refund parameters: `bet`, `tip`, `freespin` |
| 1.1.4 | 2020-11-25 | Rollback parameter `round_id` fixed |
| 1.1.3 | 2020-10-06 | Parameter `is_finished` changed to `finished` |
| 1.1.2 | 2020-08-25 | Added balance notifications |
| 1.1.1 | 2019-07-04 | Added freespins |
| 1.1.0 | 2018-02-22 | Added `game_uuid` and `player_id` to bet/win/refund |
| 1.0.8 | 2017-03-30 | Added `/jackpots` endpoint |
| 1.0.7 | 2017-03-21 | Updated `/limits` response |
| 1.0.6 | 2017-02-17 | Added demo mode |
| 1.0.5 | 2016-11-15 | Added `is_mobile` parameter |
| 1.0.4 | 2016-10-20 | Added limits and self-validate endpoints |
| 1.0.2 | 2016-09-15 | Games/init POST format specified |
| 1.0.1 | 2016-09-07 | Documentation initialized |
| 1.0.0 | 2016-09-01 | Initial version |

---

**End of Documentation**


