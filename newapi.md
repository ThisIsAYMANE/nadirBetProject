# Best practices

Our API provides well-structured responses with strictly typed entities, such as statistics and lineups. This page provides best practices for using our data effectively in sports applications.

## Initial data load & syncing strategy

Most of our endpoints support pagination, so you’ll often need multiple requests to retrieve full datasets. To streamline this, we provide features and patterns designed for scalability and consistency.

**Bulk fetch with `filters=populate`**

* Use `filters=populate` on endpoints to disable all includes. This ensures the response payload is minimal (no extra nested data) and enables a **page size of 1000** records, reducing the total number of pages.
* Because includes are disabled, you'll fetch only the base entity fields (no heavy relational joins).
* **Pro tip**: For your initial sync, use `filters=populate` to bootstrap your dataset quickly and with fewer API calls.

**Incremental sync with `idAfter`**

Once your initial dataset is established, keep your database up to date using the `idAfter` filter:

* Use a parameter like `filters=idAfter:12345` to fetch only those records whose IDs are **greater than** the last known ID.
* Combine this with `filters=populate` to keep responses lightweight.
* This strategy ensures you're only pulling new entries, not re-fetching old ones.

**Developer notes & examples**

* **Concurrent paging**: After fetching page 1 with `idAfter` & `populate`, you can fetch pages 2, 3, etc., in parallel (within your rate-limit constraints) to speed up initial sync.
* **Example (pseudocode for bulk + incremental)**:

```javascript
// Step 1: bulk load all via pages
for (let page = 1; ; page++) {
  let resp = await fetchEndpoint({
    include: null,
    filters: `populate;page:${page}`
  })
  if (!resp.data.length) break
  saveToDb(resp.data)
}

// Step 2: start incremental sync loop
let lastMaxId = getMaxIdFromDb()
setInterval(async () => {
  let resp = await fetchEndpoint({
    include: null,
    filters: `populate;idAfter:${lastMaxId}`
  })
  if (resp.data.length) {
    saveToDb(resp.data)
    lastMaxId = getMaxIdFromDb()
  }
}, pollIntervalMs)
```

* **Edge case (out-of-order IDs)**: In rare cases, data might arrive with IDs not strictly increasing (e.g. a delayed update or backfill). It’s good to *also* run periodic full sync (snapshot) of reference entities to catch anomalies.
* **Empty result handling**: If your `idAfter` call returns no data (empty), don’t panic, it means there’s nothing new. But if you see long streaks with nothing, consider switching to a slower polling or check connectivity.

**Pitfalls & tips**

* **Watch for rate limits**: Bulk + parallel requests can accidentally hit your limits. Always space out your calls or batch smartly.
* **New vs updated vs deleted**: `idAfter` only handles *new* records (or records with new IDs). It does not detect updates to existing ones or deletions. Use other filters (e.g. `IsDeleted` or “latest update” endpoints) to catch those.
* **Combine strategies**: Use multiple sync strategies in tandem, initial bulk, incremental fetch, “latest updated” polls, and occasional full snapshot reconciliation.
* **Monitoring**: Log how many new records you get per sync, and detect decreasing yields (i.e. when little new data is arriving), that may indicate everything is in sync.

## Reducing includes and response data

Our API supports optional **includes** (nested related entities) to enrich responses. But excessive includes increase payload size, latency, and bandwidth usage. To optimize performance, we strongly recommend caching certain entities on your side so you can avoid requesting includes unnecessarily.

**Entities we recommend caching**

These are entities that rarely change and are safe to cache:

* States
* Types
* Continents
* Countries
* Regions
* Cities

By caching these, you can often eliminate half or more of your includes, trimming response size and speeding your requests.

**How to use cached entities instead of includes**

1. **At startup or periodically**, fetch and store the full lists of the above entities from endpoints like `/states`, `/types`, `/countries`, etc.
2. In your application logic, when you receive an object with a `type_id`, `region_id`, etc., look it up in your local cache instead of asking the API to include the full object.
3. Only request includes when you need deep details (e.g. nested objects or rarely updated relations).

**Example: caching “Types” to skip includes**

Suppose a match entity has a field `type_id` pointing to a “match type” (e.g. league, cup, friendly). You can do this:

* During app startup (or daily), call `/types` and cache all type records (ID → full type object).
* When fetching fixtures or matches, **omit** `include=type` (or remove it) and rely on your local cache to resolve `type_id` to the developer\_name of the type.&#x20;
* Only if you see a `type_id` not in your cache, you can fetch `/types/{id}` once to update your cache.

This avoids bloating every match response with full type objects.

**Developer tips & caveats**

* **TTL & refresh strategy:** Since these entities change rarely, you can assign a long TTL (e.g. a few hours or a day) and refresh them periodically (cron job, background task).
* **Invalidation:** If your cache has stale entries (e.g. a country name changes), you should detect and refresh. A simple strategy: always check for unknown IDs or version mismatches and fetch fresh data when needed.
* **Fallback includes:** In edge cases (e.g. a new region not yet in cache), you can still request the include for that one record to fill your cache.
* **Monitor cache hit rate:** Track how often your cached lookup resolves vs missing. A high hit rate means your design is effective.
* **Size limits:** These entities are generally small (hundreds to a few thousands of records), so caching them in memory or fast stores (Redis, in-app store) is cheap.

**Impact & benefits**

* **Reduced bandwidth & latency**: Smaller JSON payloads travel over the wire faster.
* **Lower API load**: You reduce work on the server by omitting heavy joins/includes.
* **Simpler client logic**: You have control over which related data you load and when.

## CORS (Cross-Origin Resource Sharing)

When building client-side (browser) applications that call the Sportmonks API, you may see an error like:

> “Request from origin <https://your\\_domain.com> has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource”

This happens because browsers enforce the **same-origin policy**, which prevents JavaScript from making requests to a different domain unless explicitly allowed. You are calling the API directly from the front end, and since it is a different origin, the API must permit it.

#### Why this is risky + best practice

Direct frontend integration may expose sensitive data, especially your API token to end users. To avoid this risk and to handle CORS properly, use a **middleware layer** (backend or proxy) as an intermediary:

* The frontend sends requests to your middleware.
* The middleware attaches your API token securely and forwards the request to the Sportmonks API.
* The middleware returns the API response to the frontend, with correct CORS headers.
* This setup ensures your token is never exposed in client-side code.

Using such a proxy makes it much harder for malicious actors to access your credentials or misuse your API.

#### How CORS works in brief

1. The browser adds an `Origin` header in requests to indicate where the request is coming from.
2. For certain methods or headers, the browser first sends a **preflight OPTIONS** request.
3. The server must respond with appropriate headers like `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`.
4. If those headers permit the request, the browser proceeds; otherwise it blocks it.

#### Developer tips & examples

**Specifying allowed origins**

Do **not** use `*` (wildcard) in `Access-Control-Allow-Origin` once in production if your API uses credentials (cookies, auth headers). Instead, allow specific origins:

```http
Access-Control-Allow-Origin: https://my-frontend.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization

```

If you allow credentials (`Access-Control-Allow-Credentials: true`), the `Allow-Origin` must be an explicit origin, not `*`.

**Handling preflight (OPTIONS) requests**

For any non-simple request (e.g. custom headers or methods like PUT), the browser first sends an OPTIONS request. Your server (or middleware) needs to correctly answer:

```http
OPTIONS /api/endpoint HTTP/1.1
Origin: https://my-frontend.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, Authorization
```

Response should include:

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://my-frontend.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

That tells the browser it is safe to send the actual request.

#### Common pitfalls & security notes

* Avoid using `*` for `Access-Control-Allow-Origin` in production, especially when credentials are involved.
* Ensure even error responses include proper CORS headers, if they don’t, the browser may hide error details.
* Regularly audit which origins you allow. As your app evolves, remove unused or outdated domains.
* Remember: CORS is enforced by browsers only. Non-browser clients (e.g. mobile apps, server-to-server) are not restricted by CORS.

## **Rate Limiting**

To ensure fair usage and maintain optimal performance for all users, adhere to our rate limiting policies:

* Familiarise yourself with our API’s rate limits and throttle your requests to avoid exceeding them. Exceeding limits may lead to temporary restrictions or suspension of access.
* Implement client-side rate limiting to prevent bursts of requests from overwhelming our servers. By observing reasonable request frequencies, you help maintain a smooth experience for all.

Below are deeper explanations, patterns, and examples to help you build an effective rate-limiting layer.

**Why client-side rate limiting matters**

Even though the API enforces limits, relying solely on that enforcement results in:

* Unexpected `429 Too Many Requests` errors
* Jitter or latency spikes
* Poor predictability under load

By proactively controlling your request velocity, you reduce failed calls and improve stability. Many systems use client-side throttling for exactly this reason.&#x20;

**Common rate-limiting algorithms**

Choosing the right algorithm affects how smooth your request pattern is. [Some standard approaches](https://www.sportmonks.com/glossary/api-rate-limit/):

* **Fixed window**: Count requests per fixed time interval (e.g. max 100 per minute). Simple, but bursty at window boundaries.&#x20;
* **Sliding window**: Keeps a rolling window of time, smoothing out burst edges.
* **Token bucket**: Tokens are refilled at a steady rate; each request “costs” a token. Allows bursts if tokens are available.&#x20;
* **Leaky bucket**: Requests queue up and are processed at a constant rate; excess requests “leak” out or are dropped.&#x20;

Often a token bucket or sliding window is a good fit for API clients.

**Handling `429` and backoff**

Even with client-side throttling, you may still hit rate limits (e.g. under concurrency or traffic shifts). Handle `429` responses gracefully:

* Check for a `Retry-After` header, if provided, and wait that duration.
* Use **exponential backoff** (with jitter) on repeated failures: e.g. wait 0.5s, then 1s, then 2s, etc.
* Cap the maximum backoff delay and eventually give up or notify the user.
* After backing off, resume a conservative request rate rather than jumping back to full speed.

**Best practices & tips**

* Use analytics / monitoring to track how often you hit the rate limit, to tune your client-side throttling thresholds.
* If your app makes multiple types of API calls (e.g. livescores vs historical data), allocate separate rate buckets or priorities.
* During low traffic periods, you can increase throughput; during peaks, be conservative.
* Log request metadata (endpoint, timestamp) to help debugging when limits are hit.
* Use jitter (random small variation) in backoff timing to avoid synchronized retries across many clients.

## **Optimised querying & filtering**

You should aim to retrieve *just what you need,* not entire datasets with lots of unused fields. Using filters and caching intelligently can yield more efficient, faster, and cheaper requests.

**Using filters effectively**

* Whenever possible, apply server-side filtering over retrieving everything and filtering client-side. This reduces response size and network waste.
* Use field filters (e.g. `status=active`, `season_id=2025`) or property filters (e.g. `score_gt`, `date_lt`) if supported.
* Combine filters to narrow results (logical AND) rather than fetching then discarding.
* Be cautious when using filters around boundary values (dates, times), test edge cases (e.g. matches exactly at midnight).
* Consider ordering your filters so the “cheapest / most selective” ones run first (i.e. filter by competition before filtering by team, etc.)

**Caching query results & lookups**

Because many queries are repetitive or stable over time, you can cache responses or lookup tables to avoid re-fetching the same data.

* **Cache lookups of commonly accessed entities** (e.g. teams, types, leagues). If your data model has `team_id` or `type_id`, you can resolve it locally rather than requesting `include=team` or `include=type` each time.
* **Cache entire query responses** for endpoints that don’t change often (e.g. historical stats, standings).
* Use a **cache-aside** or **lazy caching** model: on a cache miss, fetch from the API, store it, then respond.
* Set sensible TTLs (time-to-live) depending on how often that data really changes.
* Invalidate or refresh caches when you know an underlying change occurred (for example, via webhooks or scheduled refreshes).

**Example scenario**

Imagine your UI shows standings for a season. Rather than:

1. Fetch `/standings?season=2025&include=league,team` every refresh
2. Parse and re-resolve team names each time

You could:

* On first request, call `/standings?season=2025&include=league,team`
* Cache the `league` and `team` lookups locally
* For subsequent requests (especially within a short timeframe), call `/standings?season=2025` (no includes) and use your cache to resolve teams and league metadata

This approach reduces payload size and speeds up responses.

**Trade-offs and caveats**

* **Stale cache risk**: If the underlying data changes (e.g. a team name update), your cache may serve obsolete data. Mitigate this by TTL, invalidation logic, or periodic refreshes.
* **Cache memory / storage constraints**: Don’t cache everything. Focus on frequently used, relatively stable data.
* **Over-caching dynamic endpoints**: Avoid caching endpoints with highly volatile data (live scores, events) unless on very short TTLs.
* **Partial includes**: Sometimes it’s useful to include only subfields rather than the full object to reduce payload.

**Best practices summary**

* Prioritise server-side filters over client-side filtering
* Cache entity lookups (teams, types, etc.) aggressively
* Cache query results only when data stability permits
* Use lazy loading / cache-aside patterns
* Choose TTLs appropriate to data volatility
* Include invalidation / refresh mechanisms
* Monitor cache hit rates and misses to guide tuning

### Master the tools: Request options deep dive

These best practices rely on mastering one essential skill: using request options effectively. If you haven't already, dive deep into the **Request Options** documentation to understand:

* How to use **includes** to enrich your responses without making multiple API calls
* How to **filter data** on the server-side (not client-side) for better performance
* How to **select specific fields** to minimize payload size and improve response times
* How to **order and sort** results the way your application needs them

By combining these request options with the best practices above, caching strategies, rate limit awareness, and efficient data retrieval, you'll build applications that are faster, cheaper, and more scalable.

[Master Request Options →](https://docs.sportmonks.com/football/api/request-options)

# Making your first request

{% hint style="info" %}
Before being able to make a request, you need to create your account in [MySportmonks](https://www.my.sportmonks.com). Here you can create your personal API token, which you need to [authenticate](https://docs.sportmonks.com/v3/welcome/authentication) your requests. You can use the free plan or choose one of the various plans and data features of Sportmonks.&#x20;
{% endhint %}

## Build the request&#x20;

The request consists of the following components:&#x20;

* The base URL&#x20;
* A path parameter, in this example, we use *fixtures*
* Optional: Query string parameters, to filter on enrich your requests.
* And finally, your API token

### The base URL

In this example we're using the [fixtures endpoint](https://docs.sportmonks.com/v3/endpoints-and-entities/endpoints/fixtures). The base URL of the fixtures endpoint is:

<pre class="language-javascript"><code class="lang-javascript"><strong>https://api.sportmonks.com/v3/football
</strong></code></pre>

### Your API token

We offer two different options for passing your API token. You are free to choose between the authentication methods. You can also use both of them at the same time. Please note that both methods count towards the same [rate-limiting.](https://docs.sportmonks.com/v3/api/rate-limit)

**Authenticate using a query parameter:**\
You can pass your API token by passing 'api\_token' in your request parameters, like so: \
`https://api.sportmonks.com/v3/football?api_token=YOUR_TOKEN`

**Authenticate using a request header:**\
You can also pass your token via an 'Authorization' header, like so:

<table><thead><tr><th>Header</th><th>Value</th></tr></thead><tbody><tr><td>Authorization</td><td><pre><code>YOUR_TOKEN
</code></pre></td></tr></tbody></table>

For example, this can results in the below request and response:

```javascript
https://api.sportmonks.com/v3/football/fixtures?api_token=YOUR_TOKEN
```

<details>

<summary>Basic response</summary>

```javascript
{
  "data": [
    {
      "id": 17948776,
      "sport_id": 1,
      "league_id": 271,
      "season_id": 17328,
      "stage_id": 77448541,
      "group_id": null,
      "aggregate_id": null,
      "round_id": 240936,
      "state_id": 5,
      "venue_id": 339977,
      "name": "AGF vs Randers",
      "starting_at": "2021-04-22 15:45:00",
      "result_info": null,
      "leg": "1/1",
      "details": null,
      "length": 90,
      "placeholder": false,
      "last_processed_at": "2023-01-13 14:16:47",
      "starting_at_timestamp": 1619106300
    },
    {
      "id": 217802,
      "sport_id": 1,
      "league_id": 271,
      "season_id": 1282,
      "stage_id": 1095,
      "group_id": null,
      "aggregate_id": null,
      "round_id": 23491,
      "state_id": 5,
      "venue_id": 5599,
      "name": "Vestsjaelland vs AaB",
      "starting_at": "2014-09-22 17:00:00",
      "result_info": null,
      "leg": "1/1",
      "details": null,
      "length": 90,
      "placeholder": false,
      "last_processed_at": "2023-01-13 13:21:22",
      "starting_at_timestamp": 1411405200
    },
    // and more
```

</details>

The example above was the most basic request you can create, while our highly flexible football API 3.0 can handle way more advanced requests. Our API's data will enable you to create excellent and specialized applications.

Let’s make another request, and add an include to get more information. The includes can be found on the specific endpoint page. In our case, [fixtures](https://docs.sportmonks.com/v3/endpoints-and-entities/endpoints/fixtures).&#x20;

{% code overflow="wrap" %}

```javascript
https://api.sportmonks.com/v3/football/fixtures?api_token=YOUR_TOKEN&include=statistics
```

{% endcode %}

You are getting the hang of it now. Let’s make one more request with multiple includes.

{% code overflow="wrap" %}

```javascript
https://api.sportmonks.com/v3/football/fixtures?apitoken=YOUR_TOKEN&include=statistics;events
```

{% endcode %}

{% hint style="info" %}
Are you interested in seeing the difference in response when you use includes vs when you don't? Check the below response examples.&#x20;

<details>

<summary>Response without includes</summary>

```javascript
{
  "data": [
    {
      "id": 17948776,
      "sport_id": 1,
      "league_id": 271,
      "season_id": 17328,
      "stage_id": 77448541,
      "group_id": null,
      "aggregate_id": null,
      "round_id": 240936,
      "state_id": 5,
      "venue_id": 339977,
      "name": "AGF vs Randers",
      "starting_at": "2021-04-22 15:45:00",
      "result_info": null,
      "leg": "1/1",
      "details": null,
      "length": 90,
      "placeholder": false,
      "last_processed_at": "2023-01-13 14:16:47",
      "starting_at_timestamp": 1619106300
    },
    {
      "id": 217802,
      "sport_id": 1,
      "league_id": 271,
      "season_id": 1282,
      "stage_id": 1095,
      "group_id": null,
      "aggregate_id": null,
      "round_id": 23491,
      "state_id": 5,
      "venue_id": 5599,
      "name": "Vestsjaelland vs AaB",
      "starting_at": "2014-09-22 17:00:00",
      "result_info": null,
      "leg": "1/1",
      "details": null,
      "length": 90,
      "placeholder": false,
      "last_processed_at": "2023-01-13 13:21:22",
      "starting_at_timestamp": 1411405200
    },

        // and more
```

</details>

<details>

<summary>Response with includes</summary>

```javascript
{
  "data": [
    {
      "id": 17948776,
      "sport_id": 1,
      "league_id": 271,
      "season_id": 17328,
      "stage_id": 77448541,
      "group_id": null,
      "aggregate_id": null,
      "round_id": 240936,
      "state_id": 5,
      "venue_id": 339977,
      "name": "AGF vs Randers",
      "starting_at": "2021-04-22 15:45:00",
      "result_info": null,
      "leg": "1/1",
      "details": null,
      "length": 90,
      "placeholder": false,
      "last_processed_at": "2023-01-13 14:16:47",
      "starting_at_timestamp": 1619106300,
      "statistics": [
        {
          "id": 297194,
          "fixture_id": 17948776,
          "type_id": 43,
          "participant_id": 2905,
          "data": {
            "value": 108
          },
          "location": "home"
        },
        {
          "id": 297195,
          "fixture_id": 17948776,
          "type_id": 43,
          "participant_id": 2356,
          "data": {
            "value": 112
          },
          "location": "away"
        },
        {
          "id": 297196,
          "fixture_id": 17948776,
          "type_id": 44,
          "participant_id": 2905,
          "data": {
            "value": 57
          },
          "location": "home"
        },
        {
          "id": 297197,
          "fixture_id": 17948776,
          "type_id": 44,
          "participant_id": 2356,
          "data": {
            "value": 42
          },
          "location": "away"
        },
// and more!        
```

</details>
{% endhint %}

## API Syntax

Great, now you have used the first part of API 3.0’s [syntax.](https://docs.sportmonks.com/v3/api/syntax) A quick overview of the new syntax:

<table><thead><tr><th>Syntax</th><th width="211">Usage</th><th>Example</th></tr></thead><tbody><tr><td><code>&#x26;select=</code></td><td>Select specific fields on the base entity</td><td><code>&#x26;select=name</code></td></tr><tr><td><code>&#x26;include=</code></td><td>Include relations</td><td><code>&#x26;include=lineups</code></td></tr><tr><td><code>&#x26;filters=</code></td><td>Filter your request</td><td><code>&#x26;filters=eventTypes:15</code></td></tr><tr><td><code>;</code></td><td>Mark end of (nested) relation. You can start including other relations from here</td><td><code>&#x26;include=lineups;events;participants</code></td></tr><tr><td><code>:</code></td><td>Mark field selection</td><td><code>&#x26;include=lineups:player_name;events:player_name,related_player_name,minute</code></td></tr><tr><td><code>,</code></td><td>Used as separation to select or filter on more ids</td><td><code>&#x26;include=events:player_name,related_player_name,minute&#x26;filters=eventTypes:15</code></td></tr></tbody></table>

### **Request: use multiple include**

For example, you want the teams and events of a certain fixture. In this case, you would use `participants;events`

{% code overflow="wrap" %}

```javascript
https://api.sportmonks.com/v3/football/fixtures?api_token=YOUR_TOKEN&include=participants;events
```

{% endcode %}

<details>

<summary>Response</summary>

```javascript
{
  "data": [
    {
      "id": 17948776,
      "sport_id": 1,
      "league_id": 271,
      "season_id": 17328,
      "stage_id": 77448541,
      "group_id": null,
      "aggregate_id": null,
      "round_id": 240936,
      "state_id": 5,
      "venue_id": 339977,
      "name": "AGF vs Randers",
      "starting_at": "2021-04-22 15:45:00",
      "result_info": null,
      "leg": "1/1",
      "details": null,
      "length": 90,
      "placeholder": false,
      "last_processed_at": "2023-01-13 14:16:47",
      "starting_at_timestamp": 1619106300,
      "participants": [
        {
          "id": 2905,
          "sport_id": 1,
          "country_id": 320,
          "venue_id": 1708,
          "gender": "male",
          "name": "AGF",
          "short_code": "AGF",
          "image_path": "https://cdn.sportmonks.com/images/soccer/teams/25/2905.png",
          "founded": 1902,
          "type": "domestic",
          "placeholder": false,
          "last_played_at": "2023-01-19 14:00:00",
          "meta": {
            "location": "home"
          }
        },
        {
          "id": 2356,
          "sport_id": 1,
          "country_id": 320,
          "venue_id": 318820,
          "gender": "male",
          "name": "Randers",
          "short_code": "RDF",
          "image_path": "https://cdn.sportmonks.com/images/soccer/teams/20/2356.png",
          "founded": 2003,
          "type": "domestic",
          "placeholder": false,
          "last_played_at": "2022-11-13 19:00:00",
          "meta": {
            "location": "away"
          }
        }
      ],
      "events": [
        {
          "id": 2255893,
          "fixture_id": 17948776,
          "period_id": 20128,
          "participant_id": 2905,
          "type_id": 18,
          "section": "event",
          "player_id": 84471,
          "related_player_id": 151549,
          "player_name": "Alexander Munksgaard",
          "related_player_name": "Alex Gersbach",
          "result": null,
          "info": null,
          "addition": null,
          "minute": 32,
          "extra_minute": null,
          "injured": true,
          "on_bench": false,
          "coach_id": null,
          "sub_type_id": null
        },
  //and more!      
```

</details>

### Request: only select a specific field

One of our new additions to API 3.0 is a name field on the fixtures. The name field contains a textual representation of the participants playing the fixture. Without selecting a specific field, the API request and response would look like this:

```javascript
https://api.sportmonks.com/v3/football/fixtures/18535517?api_token=YOUR_TOKEN
```

<details>

<summary>Response</summary>

```javascript
{
  "data": {
    "id": 18535517,
    "sport_id": 1,
    "league_id": 501,
    "season_id": 19735,
    "stage_id": 77457866,
    "group_id": null,
    "aggregate_id": null,
    "round_id": 274719,
    "state_id": 5,
    "venue_id": 8909,
    "name": "Celtic vs Rangers",
    "home_score": 4,
    "away_score": 0,
    "starting_at": "2022-09-03 11:30:00",
    "result_info": "Celtic won after full-time.",
    "leg": "1/1",
    "details": null,
    "length": 90,
    "placeholder": false,
    "starting_at_timestamp": 1662204600
  },
```

</details>

As you can see, the API response is rather large if you're only interested in the fixture's name. Let's select that API field to reduce the response length and size.&#x20;

We're using the [fixtures endpoint](https://docs.sportmonks.com/v3/endpoints-and-entities/endpoints/fixtures). This means we can select on all the fields of the [fixtures entity.](https://docs.sportmonks.com/v3/endpoints-and-entities/entities/fixture#fixture) You can do this by adding `&select=`{specific fields on the base [entity](https://docs.sportmonks.com/v3/endpoints-and-entities/entities)}.&#x20;

In our example, this would result in the below API request and response:

{% code overflow="wrap" %}

```javascript
https://api.sportmonks.com/v3/football/fixtures/18535517?api_token=YOUR_TOKEN&select=name
```

{% endcode %}

<details>

<summary>Response</summary>

```javascript
{
  "data": {
    "name": "Celtic vs Rangers",
    "id": 18535517,
    "sport_id": 1,
    "round_id": 274719,
    "stage_id": 77457866,
    "group_id": null,
    "aggregate_id": null,
    "league_id": 501,
    "season_id": 19735,
    "venue_id": 8909,
    "state_id": 5,
    "starting_at_timestamp": null
  },
```

</details>

As you can see in the example response above, the 'name' field is only returned for the fixture.

{% hint style="info" %}
Please note that the fields that have relations are also automatically included for technical reasons.
{% endhint %}

### Request: filter your request

Next to selecting specific fields on the base entity or includes, it’s possible to filter your request.

Let’s say you want to request all the events of a specific fixture, like Celtic vs Rangers. Your request would look like this:

{% code overflow="wrap" %}

```javascript
https://api.sportmonks.com/v3/football/fixtures/18535517?api_token=YOUR_TOKEN&include=events
```

{% endcode %}

<details>

<summary>Response</summary>

```javascript
{
  "data": {
    "id": 18535517,
    "sport_id": 1,
    "league_id": 501,
    "season_id": 19735,
    "stage_id": 77457866,
    "group_id": null,
    "aggregate_id": null,
    "round_id": 274719,
    "state_id": 5,
    "venue_id": 8909,
    "name": "Celtic vs Rangers",
    "home_score": 4,
    "away_score": 0,
    "starting_at": "2022-09-03 11:30:00",
    "result_info": "Celtic won after full-time.",
    "leg": "1/1",
    "details": null,
    "length": 90,
    "placeholder": false,
    "starting_at_timestamp": 1662204600,
    "events": [
      {
        "id": 42645216,
        "fixture_id": 18535517,
        "period_id": 4295921,
        "participant_id": 53,
        "type_id": 18,
        "section": "event",
        "player_id": 108471,
        "related_player_id": 460810,
        "player_name": "Georgios Giakoumakis",
        "related_player_name": "Kyogo Furuhashi",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 5,
        "extra_minute": null,
        "injured": true,
        "on_bench": false
      },
      {
        "id": 42666547,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 62,
        "type_id": 18,
        "section": "event",
        "player_id": 172985,
        "related_player_id": 10504,
        "player_name": "Scott Wright",
        "related_player_name": "Glen Kamara",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 46,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42646477,
        "fixture_id": 18535517,
        "period_id": 4295921,
        "participant_id": 53,
        "type_id": 14,
        "section": "event",
        "player_id": 9939171,
        "related_player_id": null,
        "player_name": "Liel Abada",
        "related_player_name": null,
        "result": "1-0",
        "info": "Shot",
        "addition": "1st Goal",
        "minute": 8,
        "extra_minute": null,
        "injured": null,
        "on_bench": false
      },
      {
        "id": 42657121,
        "fixture_id": 18535517,
        "period_id": 4295921,
        "participant_id": 53,
        "type_id": 19,
        "section": "event",
        "player_id": 1712,
        "related_player_id": null,
        "player_name": "Cameron Carter-Vickers",
        "related_player_name": null,
        "result": null,
        "info": "Foul",
        "addition": "3rd Yellow Card",
        "minute": 44,
        "extra_minute": null,
        "injured": null,
        "on_bench": false
      },
      {
        "id": 42656106,
        "fixture_id": 18535517,
        "period_id": 4295921,
        "participant_id": 53,
        "type_id": 14,
        "section": "event",
        "player_id": 9939171,
        "related_player_id": 1494712,
        "player_name": "Liel Abada",
        "related_player_name": "Matt O'Riley",
        "result": "3-0",
        "info": "Shot",
        "addition": "3rd Goal",
        "minute": 40,
        "extra_minute": null,
        "injured": null,
        "on_bench": false
      },
  },
```

</details>

As you can see in the response, you will receive all match events. But what if you’re only interested in a specific event like goals, cards or substitutions? **You can filter on the specific data you're interested in:**&#x20;

{% code overflow="wrap" %}

```javascript
https://api.sportmonks.com/v3/football/fixtures/18535517?api_token=YOUR_TOKEN&include=events&filters=eventTypes:18
```

{% endcode %}

<details>

<summary>Response</summary>

```javascript
{
  "data": {
    "id": 18535517,
    "sport_id": 1,
    "league_id": 501,
    "season_id": 19735,
    "stage_id": 77457866,
    "group_id": null,
    "aggregate_id": null,
    "round_id": 274719,
    "state_id": 5,
    "venue_id": 8909,
    "name": "Celtic vs Rangers",
    "home_score": 4,
    "away_score": 0,
    "starting_at": "2022-09-03 11:30:00",
    "result_info": "Celtic won after full-time.",
    "leg": "1/1",
    "details": null,
    "length": 90,
    "placeholder": false,
    "starting_at_timestamp": 1662204600,
    "events": [
      {
        "id": 42645216,
        "fixture_id": 18535517,
        "period_id": 4295921,
        "participant_id": 53,
        "type_id": 18,
        "section": "event",
        "player_id": 108471,
        "related_player_id": 460810,
        "player_name": "Georgios Giakoumakis",
        "related_player_name": "Kyogo Furuhashi",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 5,
        "extra_minute": null,
        "injured": true,
        "on_bench": false
      },
      {
        "id": 42666547,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 62,
        "type_id": 18,
        "section": "event",
        "player_id": 172985,
        "related_player_id": 10504,
        "player_name": "Scott Wright",
        "related_player_name": "Glen Kamara",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 46,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42687449,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 62,
        "type_id": 18,
        "section": "event",
        "player_id": 172394,
        "related_player_id": 3262,
        "player_name": "Ryan Jack",
        "related_player_name": "John Lundstram",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 78,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42688034,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 62,
        "type_id": 18,
        "section": "event",
        "player_id": 1452870,
        "related_player_id": 3387,
        "player_name": "Fashion Sakala",
        "related_player_name": "Ryan Kent",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 78,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42675143,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 62,
        "type_id": 18,
        "section": "event",
        "player_id": 92276,
        "related_player_id": 32026,
        "player_name": "Alfredo Morelos",
        "related_player_name": "Antonio Colak",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 60,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42675290,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 62,
        "type_id": 18,
        "section": "event",
        "player_id": 1442,
        "related_player_id": 23277869,
        "player_name": "Scott Arfield",
        "related_player_name": "Malik Tillman",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 60,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42682889,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 53,
        "type_id": 18,
        "section": "event",
        "player_id": 173160,
        "related_player_id": 1494712,
        "player_name": "David Turnbull",
        "related_player_name": "Matt O'Riley",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 72,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42683195,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 53,
        "type_id": 18,
        "section": "event",
        "player_id": 319282,
        "related_player_id": 9939171,
        "player_name": "Daizen Maeda",
        "related_player_name": "Liel Abada",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 73,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42683644,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 53,
        "type_id": 18,
        "section": "event",
        "player_id": 3298,
        "related_player_id": 10966261,
        "player_name": "Aaron Mooy",
        "related_player_name": "Reo Hatate",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 73,
        "extra_minute": null,
        "injured": false,
        "on_bench": false
      },
      {
        "id": 42673138,
        "fixture_id": 18535517,
        "period_id": 4296154,
        "participant_id": 53,
        "type_id": 18,
        "section": "event",
        "player_id": 1494701,
        "related_player_id": 190919,
        "player_name": "Moritz Jenz",
        "related_player_name": "Carl Starfelt",
        "result": null,
        "info": null,
        "addition": null,
        "minute": 56,
        "extra_minute": null,
        "injured": true,
        "on_bench": false
      }
    ]
  },
```

</details>

### Next steps: Optimise your requests

You've made your first API request, great start! But there's much more you can do to make your requests more powerful and efficient.

Right now, you're getting all the data available for that endpoint. In the real world, you'll often want to:

* **Get only the data you need** (reduce response size and speed)
* **Filter results** (only matches from a specific league, date range, etc.)
* **Include related data** (player info, match events, statistics, all in one request)
* **Sort and organise** results exactly how your app needs them

Learn how to do all of this and more with our comprehensive **Request Options** guide. It shows you exactly how to fine-tune every API call to retrieve precisely what your application needs.

[Explore Request Options →](https://docs.sportmonks.com/football/api/request-options)




the api key: QR6SlN85OYDt0KgiQw7Lu0u9T653Vx5q5kWWgSxOChaL0TM0909iYptqPWAC

https://api.sportmonks.com/v3/football/fixtures?api_token=YOUR_TOKEN
https://api.sportmonks.com/v3/football/fixtures?api_token=YOUR_TOKEN&include=statistics
https://api.sportmonks.com/v3/football/fixtures?apitoken=YOUR_TOKEN&include=statistics;events


request example :
https://api.sportmonks.com/v3/football/fixture/19427161

{
  "data": {
    "id": 19427161,
    "sport_id": 1,
    "league_id": 8,
    "season_id": 25583,
    "stage_id": 77476879,
    "group_id": null,
    "aggregate_id": null,
    "round_id": 372145,
    "state_id": 5,
    "venue_id": 230,
    "name": "Liverpool vs West Ham United",
    "starting_at": "2026-02-28 15:00:00",
    "result_info": "Liverpool won after full-time.",
    "leg": "1/1",
    "details": null,
    "length": 90,
    "placeholder": false,
    "has_odds": true,
    "has_premium_odds": true,
    "starting_at_timestamp": 1772290800,

// Teams are now included in the request.
// You can view details such as names, country, home or away information and more.

    "participants": [
      {
        "id": 8,
        "sport_id": 1,
        "country_id": 462,
        "venue_id": 230,
        "gender": "male",
        "name": "Liverpool",
        "short_code": "LIV",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/8/8.png",
        "founded": 1892,
        "type": "domestic",
        "placeholder": false,
        "last_played_at": "2026-03-03 20:15:00",
        "meta": {
          "location": "home",
          "winner": true,
          "position": 6
        }
      },
      {
        "id": 1,
        "sport_id": 1,
        "country_id": 462,
        "venue_id": 214,
        "gender": "male",
        "name": "West Ham United",
        "short_code": "WHU",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/1/1.png",
        "founded": 1895,
        "type": "domestic",
        "placeholder": false,
        "last_played_at": "2026-03-04 19:30:00",
        "meta": {
          "location": "away",
          "winner": false,
          "position": 18
        }
      }
    ],

// Odds data provides details from different bookmakers and markets about the two teams.
// This includes details like odds, markets, and bookmakers.

    "odds": [
      {
        "id": 220928353093,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 1,
        "label": "Away",
        "value": "6.25",
        "name": "Away",
        "sort_order": 3,
        "market_description": "Match Winner",
        "probability": "16%",
        "dp3": "6.250",
        "fractional": "25/4",
        "american": "525",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:44:06",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928353090,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 1,
        "label": "Draw",
        "value": "4.75",
        "name": "Draw",
        "sort_order": 2,
        "market_description": "Match Winner",
        "probability": "21.05%",
        "dp3": "4.750",
        "fractional": "19/4",
        "american": "375",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:44:06",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928353077,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 1,
        "label": "Home",
        "value": "1.43",
        "name": "Home",
        "sort_order": 1,
        "market_description": "Match Winner",
        "probability": "69.93%",
        "dp3": "1.430",
        "fractional": "10/7",
        "american": "-233",
        "winning": true,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:44:06",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928353116,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 16,
        "label": "Away",
        "value": "7.10",
        "name": "Away",
        "sort_order": 3,
        "market_description": "Match Winner",
        "probability": "14.08%",
        "dp3": "7.100",
        "fractional": "71/10",
        "american": "610",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:39:26",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928353107,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 16,
        "label": "Draw",
        "value": "5.15",
        "name": "Draw",
        "sort_order": 2,
        "market_description": "Match Winner",
        "probability": "19.42%",
        "dp3": "5.150",
        "fractional": "67/13",
        "american": "415",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:39:26",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928353105,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 16,
        "label": "Home",
        "value": "1.42",
        "name": "Home",
        "sort_order": 1,
        "market_description": "Match Winner",
        "probability": "70.42%",
        "dp3": "1.420",
        "fractional": "27/19",
        "american": "-239",
        "winning": true,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:39:26",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928356524,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 1,
        "label": "Away",
        "value": "2.95",
        "name": "Away",
        "sort_order": 3,
        "market_description": "Team To Score Last",
        "probability": "33.9%",
        "dp3": "2.950",
        "fractional": "56/19",
        "american": "195",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 05:37:44",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356522,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 1,
        "label": "Draw",
        "value": "23.00",
        "name": "Draw",
        "sort_order": 2,
        "market_description": "Team To Score Last",
        "probability": "4.35%",
        "dp3": "23.000",
        "fractional": "23",
        "american": "2200",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 05:37:44",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356514,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 1,
        "label": "Home",
        "value": "1.42",
        "name": "Home",
        "sort_order": 1,
        "market_description": "Team To Score Last",
        "probability": "70.42%",
        "dp3": "1.420",
        "fractional": "27/19",
        "american": "-239",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 05:37:44",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356527,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 16,
        "label": "Away",
        "value": "3.22",
        "name": "Away",
        "sort_order": 3,
        "market_description": "Team To Score Last",
        "probability": "31.06%",
        "dp3": "3.220",
        "fractional": "29/9",
        "american": "222",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:31:59",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356526,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 16,
        "label": "Draw",
        "value": "22.00",
        "name": "Draw",
        "sort_order": 2,
        "market_description": "Team To Score Last",
        "probability": "4.55%",
        "dp3": "22.000",
        "fractional": "22",
        "american": "2100",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:31:59",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356525,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 16,
        "label": "Home",
        "value": "1.37",
        "name": "Home",
        "sort_order": 1,
        "market_description": "Team To Score Last",
        "probability": "72.99%",
        "dp3": "1.370",
        "fractional": "37/27",
        "american": "-271",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:31:59",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928354512,
        "fixture_id": 19427161,
        "market_id": 14,
        "bookmaker_id": 1,
        "label": "No",
        "value": "2.25",
        "name": "No",
        "sort_order": 2,
        "market_description": "Both Teams To Score",
        "probability": "44.44%",
        "dp3": "2.250",
        "fractional": "9/4",
        "american": "125",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:44:06",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 14,
          "legacy_id": 976105,
          "name": "Both Teams To Score",
          "developer_name": "BOTH_TEAMS_TO_SCORE",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928354511,
        "fixture_id": 19427161,
        "market_id": 14,
        "bookmaker_id": 1,
        "label": "Yes",
        "value": "1.60",
        "name": "Yes",
        "sort_order": 1,
        "market_description": "Both Teams To Score",
        "probability": "62.5%",
        "dp3": "1.600",
        "fractional": "8/5",
        "american": "-167",
        "winning": true,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:44:06",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 14,
          "legacy_id": 976105,
          "name": "Both Teams To Score",
          "developer_name": "BOTH_TEAMS_TO_SCORE",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928354522,
        "fixture_id": 19427161,
        "market_id": 14,
        "bookmaker_id": 16,
        "label": "No",
        "value": "2.17",
        "name": "No",
        "sort_order": 2,
        "market_description": "Both Teams To Score",
        "probability": "46.08%",
        "dp3": "2.170",
        "fractional": "76/35",
        "american": "117",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:59:37",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 14,
          "legacy_id": 976105,
          "name": "Both Teams To Score",
          "developer_name": "BOTH_TEAMS_TO_SCORE",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928354520,
        "fixture_id": 19427161,
        "market_id": 14,
        "bookmaker_id": 16,
        "label": "Yes",
        "value": "1.61",
        "name": "Yes",
        "sort_order": 1,
        "market_description": "Both Teams To Score",
        "probability": "62.11%",
        "dp3": "1.610",
        "fractional": "29/18",
        "american": "-164",
        "winning": true,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:59:37",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 14,
          "legacy_id": 976105,
          "name": "Both Teams To Score",
          "developer_name": "BOTH_TEAMS_TO_SCORE",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220928356503,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 1,
        "label": "Away",
        "value": "2.95",
        "name": "Away",
        "sort_order": 3,
        "market_description": "Team To Score First",
        "probability": "33.9%",
        "dp3": "2.950",
        "fractional": "56/19",
        "american": "195",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 05:37:44",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356493,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 1,
        "label": "Draw",
        "value": "23.00",
        "name": "Draw",
        "sort_order": 2,
        "market_description": "Team To Score First",
        "probability": "4.35%",
        "dp3": "23.000",
        "fractional": "23",
        "american": "2200",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 05:37:44",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356491,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 1,
        "label": "Home",
        "value": "1.42",
        "name": "Home",
        "sort_order": 1,
        "market_description": "Team To Score First",
        "probability": "70.42%",
        "dp3": "1.420",
        "fractional": "27/19",
        "american": "-239",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 05:37:44",
        "bookmaker": {
          "id": 1,
          "legacy_id": 1,
          "name": "10Bet"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356508,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 16,
        "label": "Away",
        "value": "3.28",
        "name": "Away",
        "sort_order": 3,
        "market_description": "Team To Score First",
        "probability": "30.49%",
        "dp3": "3.280",
        "fractional": "59/18",
        "american": "227",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:54:03",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356506,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 16,
        "label": "Draw",
        "value": "22.00",
        "name": "Draw",
        "sort_order": 2,
        "market_description": "Team To Score First",
        "probability": "4.55%",
        "dp3": "22.000",
        "fractional": "22",
        "american": "2100",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:54:03",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 220928356505,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 16,
        "label": "Home",
        "value": "1.36",
        "name": "Home",
        "sort_order": 1,
        "market_description": "Team To Score First",
        "probability": "73.53%",
        "dp3": "1.360",
        "fractional": "34/25",
        "american": "-278",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-22T01:41:12.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 06:54:03",
        "bookmaker": {
          "id": 16,
          "legacy_id": 36,
          "name": "Marathonbet"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 218840432419,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 2,
        "label": "Away",
        "value": "6.50",
        "name": null,
        "sort_order": 2,
        "market_description": "Full Time Result",
        "probability": "15.38%",
        "dp3": "6.500",
        "fractional": "13/2",
        "american": "550",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-12T09:42:16.000000Z",
        "original_label": "2",
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 218840432418,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 2,
        "label": "Draw",
        "value": "5.00",
        "name": null,
        "sort_order": 1,
        "market_description": "Full Time Result",
        "probability": "20%",
        "dp3": "5.000",
        "fractional": "5",
        "american": "400",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-12T09:42:16.000000Z",
        "original_label": "Draw",
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 218840432416,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 2,
        "label": "Home",
        "value": "1.42",
        "name": null,
        "sort_order": 0,
        "market_description": "Full Time Result",
        "probability": "70.42%",
        "dp3": "1.420",
        "fractional": "27/19",
        "american": "-239",
        "winning": true,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-12T09:42:16.000000Z",
        "original_label": "1",
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 220365632330,
        "fixture_id": 19427161,
        "market_id": 1,
        "bookmaker_id": 2,
        "label": "Tie",
        "value": "5.00",
        "name": null,
        "sort_order": 1,
        "market_description": "Money Line 3-way",
        "probability": "20%",
        "dp3": "5.000",
        "fractional": "5",
        "american": "400",
        "winning": false,
        "stopped": true,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-19T15:22:43.000000Z",
        "original_label": "Tie",
        "latest_bookmaker_update": "2026-02-20 07:53:56",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 1,
          "legacy_id": 1,
          "name": "Fulltime Result",
          "developer_name": "FULLTIME_RESULT",
          "has_winning_calculations": true
        }
      },
      {
        "id": 218897661158,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 2,
        "label": "1",
        "value": "1.40",
        "name": null,
        "sort_order": 0,
        "market_description": "Last Team to Score",
        "probability": "71.43%",
        "dp3": "1.400",
        "fractional": "7/5",
        "american": "-251",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": "",
        "participants": null,
        "created_at": "2026-02-12T15:23:10.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 218897661163,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 2,
        "label": "2",
        "value": "2.87",
        "name": null,
        "sort_order": 2,
        "market_description": "Last Team to Score",
        "probability": "34.78%",
        "dp3": "2.875",
        "fractional": "23/8",
        "american": "187",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": "",
        "participants": null,
        "created_at": "2026-02-12T15:23:10.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 218897661161,
        "fixture_id": 19427161,
        "market_id": 11,
        "bookmaker_id": 2,
        "label": "No Goal",
        "value": "21.00",
        "name": null,
        "sort_order": 1,
        "market_description": "Last Team to Score",
        "probability": "4.76%",
        "dp3": "21.000",
        "fractional": "21",
        "american": "2000",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": "",
        "participants": null,
        "created_at": "2026-02-12T15:23:10.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 11,
          "legacy_id": 75,
          "name": "Last Team To Score",
          "developer_name": "LAST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 218840432459,
        "fixture_id": 19427161,
        "market_id": 14,
        "bookmaker_id": 2,
        "label": "No",
        "value": "2.10",
        "name": null,
        "sort_order": 1,
        "market_description": "Both Teams to Score",
        "probability": "47.62%",
        "dp3": "2.100",
        "fractional": "21/10",
        "american": "110",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-12T09:42:16.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 14,
          "legacy_id": 976105,
          "name": "Both Teams To Score",
          "developer_name": "BOTH_TEAMS_TO_SCORE",
          "has_winning_calculations": true
        }
      },
      {
        "id": 218840432457,
        "fixture_id": 19427161,
        "market_id": 14,
        "bookmaker_id": 2,
        "label": "Yes",
        "value": "1.66",
        "name": null,
        "sort_order": 0,
        "market_description": "Both Teams to Score",
        "probability": "60.02%",
        "dp3": "1.666",
        "fractional": "5/3",
        "american": "-151",
        "winning": true,
        "stopped": false,
        "total": null,
        "handicap": null,
        "participants": null,
        "created_at": "2026-02-12T09:42:16.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 14,
          "legacy_id": 976105,
          "name": "Both Teams To Score",
          "developer_name": "BOTH_TEAMS_TO_SCORE",
          "has_winning_calculations": true
        }
      },
      {
        "id": 218905057026,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 2,
        "label": "1",
        "value": "1.40",
        "name": null,
        "sort_order": 0,
        "market_description": "First Team to Score",
        "probability": "71.43%",
        "dp3": "1.400",
        "fractional": "7/5",
        "american": "-251",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": "",
        "participants": null,
        "created_at": "2026-02-12T16:10:16.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 218905057030,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 2,
        "label": "2",
        "value": "2.87",
        "name": null,
        "sort_order": 2,
        "market_description": "First Team to Score",
        "probability": "34.78%",
        "dp3": "2.875",
        "fractional": "23/8",
        "american": "187",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": "",
        "participants": null,
        "created_at": "2026-02-12T16:10:16.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      },
      {
        "id": 218905057028,
        "fixture_id": 19427161,
        "market_id": 247,
        "bookmaker_id": 2,
        "label": "No Goals",
        "value": "21.00",
        "name": null,
        "sort_order": 1,
        "market_description": "First Team to Score",
        "probability": "4.76%",
        "dp3": "21.000",
        "fractional": "21",
        "american": "2000",
        "winning": false,
        "stopped": false,
        "total": null,
        "handicap": "",
        "participants": null,
        "created_at": "2026-02-12T16:10:16.000000Z",
        "original_label": null,
        "latest_bookmaker_update": "2026-02-28 16:44:38",
        "bookmaker": {
          "id": 2,
          "legacy_id": 2,
          "name": "bet365"
        },
        "market": {
          "id": 247,
          "legacy_id": 69,
          "name": "First Team To Score",
          "developer_name": "FIRST_TEAM_TO_SCORE",
          "has_winning_calculations": false
        }
      }
    ],

// You can now identify the league for this fixture.
// This includes details like country, name, image_path, and more.

    "league": {
      "id": 8,
      "sport_id": 1,
      "country_id": 462,
      "name": "Premier League",
      "active": true,
      "short_code": "UK PL",
      "image_path": "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      "type": "league",
      "sub_type": "domestic",
      "last_played_at": "2026-03-05 20:00:00",
      "category": 1,
      "has_jerseys": false
    },

// You can now view the various predictions our API has generated for this match.

    "predictions": [
      {
        "id": 25128209,
        "fixture_id": 19427161,
        "predictions": {
          "home_home": 47.99,
          "home_away": 1.47,
          "home_draw": 3.94,
          "away_home": 3.87,
          "away_away": 6.48,
          "away_draw": 3.67,
          "draw_draw": 9.53,
          "draw_home": 18.41,
          "draw_away": 4.63
        },
        "type_id": 232,
        "type": {
          "id": 232,
          "name": "Half Time/Full Time Probability",
          "code": "half-time-full-time-probability",
          "developer_name": "HTFT_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128216,
        "fixture_id": 19427161,
        "predictions": {
          "home": 67.81,
          "away": 27.25,
          "draw": 4.94
        },
        "type_id": 238,
        "type": {
          "id": 238,
          "name": "Team To Score First Probability",
          "code": "team_to_score_first-probability",
          "developer_name": "TEAM_TO_SCORE_FIRST_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128253,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 80.5,
          "no": 12.24,
          "equal": 7.26
        },
        "type_id": 1686,
        "type": {
          "id": 1686,
          "name": "Corners Over/Under 7 Probability",
          "code": "corners-over-under-7-probability",
          "developer_name": "CORNERS_OVER_UNDER_7_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128213,
        "fixture_id": 19427161,
        "predictions": {
          "home": 69.91,
          "away": 12.03,
          "draw": 18.06
        },
        "type_id": 237,
        "type": {
          "id": 237,
          "name": "Fulltime Result Probability",
          "code": "fulltime-result-probability",
          "developer_name": "FULLTIME_RESULT_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128249,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 93.06,
          "no": 3.48,
          "equal": 3.46
        },
        "type_id": 1683,
        "type": {
          "id": 1683,
          "name": "Corners Over/Under 5 Probability",
          "code": "corners-over-under-5-probability",
          "developer_name": "CORNERS_OVER_UNDER_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128251,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 87.76,
          "no": 6.94,
          "equal": 5.3
        },
        "type_id": 1685,
        "type": {
          "id": 1685,
          "name": "Corners Over/Under 6 Probability",
          "code": "corners-over-under-6-probability",
          "developer_name": "CORNERS_OVER_UNDER_6_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128263,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 40.06,
          "no": 49.53,
          "equal": 10.41
        },
        "type_id": 1684,
        "type": {
          "id": 1684,
          "name": "Corners Over/Under 11 Probability",
          "code": "corners-over-under-11-probability",
          "developer_name": "CORNERS_OVER_UNDER_11_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128212,
        "fixture_id": 19427161,
        "predictions": {
          "home": 50.3,
          "away": 15.6,
          "draw": 34.09
        },
        "type_id": 233,
        "type": {
          "id": 233,
          "name": "First Half Winner Probability",
          "code": "first-half-winner",
          "developer_name": "FIRST_HALF_WINNER_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128259,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 50.47,
          "no": 38.8,
          "equal": 10.73
        },
        "type_id": 1688,
        "type": {
          "id": 1688,
          "name": "Corners Over/Under 10 Probability",
          "code": "corners-over-under-10-probability",
          "developer_name": "CORNERS_OVER_UNDER_10_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128230,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 26.15,
          "no": 73.85
        },
        "type_id": 1679,
        "type": {
          "id": 1679,
          "name": "Over/Under 4.5 Probability",
          "code": "over-under-4_5-probability",
          "developer_name": "OVER_UNDER_4_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128205,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 50.87,
          "no": 49.13
        },
        "type_id": 231,
        "type": {
          "id": 231,
          "name": "Both Teams To Score Probability",
          "code": "both-teams-to-score-probability",
          "developer_name": "BTTS_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128236,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 39.49,
          "no": 60.51
        },
        "type_id": 330,
        "type": {
          "id": 330,
          "name": "Home Over/Under 2.5 Probability",
          "code": "home-over-under-2_5_probability",
          "developer_name": "HOME_OVER_UNDER_2_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128244,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 4.56,
          "no": 95.44
        },
        "type_id": 328,
        "type": {
          "id": 328,
          "name": "Away Over/Under 2.5 Probability",
          "code": "away-over-under-2_5_probability",
          "developer_name": "AWAY_OVER_UNDER_2_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128246,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 1.11,
          "no": 98.89
        },
        "type_id": 327,
        "type": {
          "id": 327,
          "name": "Away Over/Under 3.5 Probability",
          "code": "away-over-under-3_5_probability",
          "developer_name": "AWAY_OVER_UNDER_3_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128261,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 50.47,
          "no": 49.53,
          "equal": null
        },
        "type_id": 1585,
        "type": {
          "id": 1585,
          "name": "Corners Over/Under 10.5 Probability",
          "code": "corners-over-under-10_5-probability",
          "developer_name": "CORNERS_OVER_UNDER_10_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128227,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 59.46,
          "no": 40.54
        },
        "type_id": 235,
        "type": {
          "id": 235,
          "name": "Over/Under 2.5 Probability",
          "code": "over-under-2_5-probability",
          "developer_name": "OVER_UNDER_2_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128224,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 80.6,
          "no": 19.4
        },
        "type_id": 234,
        "type": {
          "id": 234,
          "name": "Over/Under 1.5 Probability",
          "code": "over-under-1_5-probability",
          "developer_name": "OVER_UNDER_1_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128218,
        "fixture_id": 19427161,
        "predictions": {
          "draw_home": 87.97,
          "draw_away": 30.089999999999996,
          "home_away": 81.94
        },
        "type_id": 239,
        "type": {
          "id": 239,
          "name": "Double Chance Probability",
          "code": "double_chance-probability",
          "developer_name": "DOUBLE_CHANCE_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128228,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 38.27,
          "no": 61.73
        },
        "type_id": 236,
        "type": {
          "id": 236,
          "name": "Over/Under 3.5 Probability",
          "code": "over-under-3_5_probability",
          "developer_name": "OVER_UNDER_3_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128239,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 45,
          "no": 55
        },
        "type_id": 333,
        "type": {
          "id": 333,
          "name": "Away Over/Under 0.5 Probability",
          "code": "away-over-under-0_5_probability",
          "developer_name": "AWAY_OVER_UNDER_0_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128237,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 19.63,
          "no": 80.37
        },
        "type_id": 326,
        "type": {
          "id": 326,
          "name": "Home Over/Under 3.5 Probability",
          "code": "home-over-under-3_5_probability",
          "developer_name": "HOME_OVER_UNDER_3_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128241,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 16.64,
          "no": 83.36
        },
        "type_id": 332,
        "type": {
          "id": 332,
          "name": "Away Over/Under 1.5 Probability",
          "code": "away-over-under-1_5_probability",
          "developer_name": "AWAY_OVER_UNDER_1_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128257,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 61.2,
          "no": 28.53,
          "equal": 10.26
        },
        "type_id": 1687,
        "type": {
          "id": 1687,
          "name": "Corners Over/Under 9 Probability",
          "code": "corners-over-under-9-probability",
          "developer_name": "CORNERS_OVER_UNDER_9_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128255,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 71.47,
          "no": 19.5,
          "equal": 9.03
        },
        "type_id": 1689,
        "type": {
          "id": 1689,
          "name": "Corners Over/Under 8 Probability",
          "code": "corners-over-under-8-probability",
          "developer_name": "CORNERS_OVER_UNDER_8_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128232,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 88.69,
          "no": 11.31
        },
        "type_id": 334,
        "type": {
          "id": 334,
          "name": "Home Over/Under 0.5 Probability",
          "code": "home-over-under-0_5_probability",
          "developer_name": "HOME_OVER_UNDER_0_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128234,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 65.3,
          "no": 34.7
        },
        "type_id": 331,
        "type": {
          "id": 331,
          "name": "Home Over/Under 1.5 Probability",
          "code": "home-over-under-1_5_probability",
          "developer_name": "HOME_OVER_UNDER_1_5_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128221,
        "fixture_id": 19427161,
        "predictions": {

// To check live scores, refer to CURRENT
// Want details for different phases? Use 1ST-HALF, 2ND-HALF, or PENALTIES for the other scores.

          "scores": {
            "0-0": 4.94,
            "0-1": 3.69,
            "0-2": 1.54,
            "0-3": 0.16,
            "1-0": 10.77,
            "1-1": 8.17,
            "1-2": 3.36,
            "1-3": 1.09,
            "2-0": 11.44,
            "2-1": 9.32,
            "2-2": 3.84,
            "2-3": 1.21,
            "3-0": 8.35,
            "3-1": 7.18,
            "3-2": 3.34,
            "3-3": 0.99,
            "Other_1": 19.5,
            "Other_2": 0.98,
            "Other_X": 0.13
          }
        },
        "type_id": 240,
        "type": {
          "id": 240,
          "name": "Correct Score Probability",
          "code": "correct-score-probability",
          "developer_name": "CORRECT_SCORE_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      },
      {
        "id": 25128247,
        "fixture_id": 19427161,
        "predictions": {
          "yes": 96.52,
          "no": 1.49,
          "equal": 1.99
        },
        "type_id": 1690,
        "type": {
          "id": 1690,
          "name": "Corners Over/Under 4 Probability",
          "code": "corners-over-under-4-probability",
          "developer_name": "CORNERS_OVER_UNDER_4_PROBABILITY",
          "model_type": "prediction",
          "stat_group": null
        }
      }
    ],

// Includes details like name, address, capacity, and more for the venue of the fixture.

    "venue": {
      "id": 230,
      "country_id": 462,
      "city_id": 51090,
      "name": "Anfield",
      "address": "Anfield Road",
      "zipcode": null,
      "latitude": "53.430833",
      "longitude": "-2.960833",
      "capacity": 61276,
      "image_path": "https://cdn.sportmonks.com/images/soccer/venues/6/230.png",
      "city_name": "Liverpool",
      "surface": "grass",
      "national_team": false
    },
    "scores": [
      {
        "id": 19498211,
        "fixture_id": 19427161,
        "type_id": 1525,
        "participant_id": 8,
        "score": {
          "goals": 5,
          "participant": "home"
        },
        "description": "CURRENT"
      },
      {
        "id": 19498212,
        "fixture_id": 19427161,
        "type_id": 1525,
        "participant_id": 1,
        "score": {
          "goals": 2,
          "participant": "away"
        },
        "description": "CURRENT"
      },
      {
        "id": 19498219,
        "fixture_id": 19427161,
        "type_id": 2,
        "participant_id": 8,
        "score": {
          "goals": 5,
          "participant": "home"
        },
        "description": "2ND_HALF"
      },
      {
        "id": 19498215,
        "fixture_id": 19427161,
        "type_id": 1,
        "participant_id": 8,
        "score": {
          "goals": 3,
          "participant": "home"
        },
        "description": "1ST_HALF"
      },
      {
        "id": 19501583,
        "fixture_id": 19427161,
        "type_id": 48996,
        "participant_id": 1,
        "score": {
          "goals": 2,
          "participant": "away"
        },
        "description": "2ND_HALF_ONLY"
      },
      {
        "id": 19501582,
        "fixture_id": 19427161,
        "type_id": 48996,
        "participant_id": 8,
        "score": {
          "goals": 2,
          "participant": "home"
        },
        "description": "2ND_HALF_ONLY"
      },
      {
        "id": 19498216,
        "fixture_id": 19427161,
        "type_id": 1,
        "participant_id": 1,
        "score": {
          "goals": 0,
          "participant": "away"
        },
        "description": "1ST_HALF"
      },
      {
        "id": 19498220,
        "fixture_id": 19427161,
        "type_id": 2,
        "participant_id": 1,
        "score": {
          "goals": 2,
          "participant": "away"
        },
        "description": "2ND_HALF"
      }
    ],

// The state include returns information about the state the fixture is in like “Full-time”, “Not started” and many more.

    "state": {
      "id": 5,
      "state": "FT",
      "name": "Full Time",
      "short_name": "FT",
      "developer_name": "FT"
    },

// Access goals, assists, cards, and substitutions throughout the match.
// Note: Substitutions are not shown in the visual due to display limitations.

    "events": [
      {
        "id": 156082278,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 8,
        "type_id": 18,
        "section": "event",
        "player_id": 8403182,
        "related_player_id": 1453,
        "player_name": "Jeremie Frimpong",
        "related_player_name": "Joe Gomez",
        "result": null,
        "info": null,
        "addition": "3rd Substitution",
        "minute": 77,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 3
      },
      {
        "id": 156082653,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 8,
        "type_id": 15,
        "section": "event",
        "player_id": 100385,
        "related_player_id": 8403182,
        "player_name": "Axel Disasi",
        "related_player_name": "Jeremie Frimpong",
        "result": "5-2",
        "info": "Left foot shot",
        "addition": "1st Own Goal",
        "minute": 82,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": 1521,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 7
      },
      {
        "id": 156083176,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 1,
        "type_id": 18,
        "section": "event",
        "player_id": 37675130,
        "related_player_id": 80655,
        "player_name": "Mohamadou Kanté",
        "related_player_name": "Tomáš Souček",
        "result": null,
        "info": null,
        "addition": "5th Substitution",
        "minute": 90,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 5
      },
      {
        "id": 156083196,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 1,
        "type_id": 18,
        "section": "event",
        "player_id": 37672209,
        "related_player_id": 37685630,
        "player_name": "Ezra Mayers",
        "related_player_name": "El Hadji Malick Diouf",
        "result": null,
        "info": null,
        "addition": "6th Substitution",
        "minute": 90,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 6
      },
      {
        "id": 156077580,
        "fixture_id": 19427161,
        "period_id": 6816395,
        "participant_id": 8,
        "type_id": 14,
        "section": "event",
        "player_id": 37288979,
        "related_player_id": 5270462,
        "player_name": "Hugo Ekitiké",
        "related_player_name": "Ryan Gravenberch",
        "result": "1-0",
        "info": "Right foot shot",
        "addition": "1st Goal",
        "minute": 5,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": 1522,
        "detailed_period_id": 6816395,
        "rescinded": null,
        "sort_order": 1
      },
      {
        "id": 156078652,
        "fixture_id": 19427161,
        "period_id": 6816395,
        "participant_id": 8,
        "type_id": 14,
        "section": "event",
        "player_id": 1743,
        "related_player_id": 785998,
        "player_name": "Virgil van Dijk",
        "related_player_name": "Dominik Szoboszlai",
        "result": "2-0",
        "info": "Header",
        "addition": "2nd Goal",
        "minute": 24,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": 1694,
        "detailed_period_id": 6816395,
        "rescinded": null,
        "sort_order": 2
      },
      {
        "id": 156082277,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 1,
        "type_id": 18,
        "section": "event",
        "player_id": 4241,
        "related_player_id": 37585962,
        "player_name": "Adama Traoré",
        "related_player_name": "Soungoutou Magassa",
        "result": null,
        "info": null,
        "addition": "2nd Substitution",
        "minute": 76,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 2
      },
      {
        "id": 156079828,
        "fixture_id": 19427161,
        "period_id": 6816395,
        "participant_id": 8,
        "type_id": 14,
        "section": "event",
        "player_id": 216612,
        "related_player_id": 37288979,
        "player_name": "Alexis Mac Allister",
        "related_player_name": "Hugo Ekitiké",
        "result": "3-0",
        "info": "Right foot shot",
        "addition": "3rd Goal",
        "minute": 43,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": 1522,
        "detailed_period_id": 6816395,
        "rescinded": null,
        "sort_order": 3
      },
      {
        "id": 156080767,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 1,
        "type_id": 14,
        "section": "event",
        "player_id": 80655,
        "related_player_id": 37685630,
        "player_name": "Tomáš Souček",
        "related_player_name": "El Hadji Malick Diouf",
        "result": "3-1",
        "info": "Right foot shot",
        "addition": "4th Goal",
        "minute": 49,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": 1522,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 4
      },
      {
        "id": 156079942,
        "fixture_id": 19427161,
        "period_id": 6816395,
        "participant_id": 1,
        "type_id": 19,
        "section": "event",
        "player_id": 37585962,
        "related_player_id": null,
        "player_name": "Soungoutou Magassa",
        "related_player_name": null,
        "result": null,
        "info": "Foul",
        "addition": "1st Yellowcard",
        "minute": 45,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6816395,
        "rescinded": false,
        "sort_order": 1
      },
      {
        "id": 156082858,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 8,
        "type_id": 18,
        "section": "event",
        "player_id": 37669492,
        "related_player_id": 5270462,
        "player_name": "Trey Nyoni",
        "related_player_name": "Ryan Gravenberch",
        "result": null,
        "info": null,
        "addition": "4th Substitution",
        "minute": 86,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 4
      },
      {
        "id": 156082231,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 1,
        "type_id": 14,
        "section": "event",
        "player_id": 524055,
        "related_player_id": 1592,
        "player_name": "Taty Castellanos",
        "related_player_name": "Jarrod Bowen ",
        "result": "4-2",
        "info": "Header",
        "addition": "6th Goal",
        "minute": 75,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": 1694,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 6
      },
      {
        "id": 156082276,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 8,
        "type_id": 18,
        "section": "event",
        "player_id": 37721333,
        "related_player_id": 37288979,
        "player_name": "Rio Ngumoha",
        "related_player_name": "Hugo Ekitiké",
        "result": null,
        "info": null,
        "addition": "1st Substitution",
        "minute": 76,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 1
      },
      {
        "id": 156081085,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 8,
        "type_id": 19,
        "section": "event",
        "player_id": 30062,
        "related_player_id": null,
        "player_name": "Cody Gakpo",
        "related_player_name": null,
        "result": null,
        "info": "Foul",
        "addition": "2nd Yellowcard",
        "minute": 55,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": false,
        "sort_order": 2
      },
      {
        "id": 156082836,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 8,
        "type_id": 19,
        "section": "event",
        "player_id": 785998,
        "related_player_id": null,
        "player_name": "Dominik Szoboszlai",
        "related_player_name": null,
        "result": null,
        "info": "Foul",
        "addition": "4th Yellowcard",
        "minute": 85,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": false,
        "sort_order": 4
      },
      {
        "id": 156081909,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 8,
        "type_id": 14,
        "section": "event",
        "player_id": 30062,
        "related_player_id": 37288979,
        "player_name": "Cody Gakpo",
        "related_player_name": "Hugo Ekitiké",
        "result": "4-1",
        "info": "Right foot shot",
        "addition": "5th Goal",
        "minute": 70,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": 1522,
        "detailed_period_id": 6817010,
        "rescinded": null,
        "sort_order": 5
      },
      {
        "id": 156082438,
        "fixture_id": 19427161,
        "period_id": 6817010,
        "participant_id": 1,
        "type_id": 19,
        "section": "event",
        "player_id": 9939203,
        "related_player_id": null,
        "player_name": "Crysencio Summerville",
        "related_player_name": null,
        "result": null,
        "info": "Foul",
        "addition": "3rd Yellowcard",
        "minute": 79,
        "extra_minute": null,
        "injured": null,
        "on_bench": false,
        "coach_id": null,
        "sub_type_id": null,
        "detailed_period_id": 6817010,
        "rescinded": false,
        "sort_order": 3
      }
    ]
  }
}


# Syntax

> This syntax applies broadly across most Sportmonks endpoints. Each endpoint’s documentation will point out any exceptions.

### Syntax operators & usage

| Operator    | Purpose                                          | Example                              |
| ----------- | ------------------------------------------------ | ------------------------------------ |
| `&select=`  | Pick specific fields on the base entity          | `&select=name,starting_at`           |
| `&include=` | Include related entities / relations             | `&include=lineups,events`            |
| `;`         | Terminates one include chain and allows new ones | `&include=lineups;events`            |
| `:`         | Indicates field selection inside an include      | `&include=events:player_name,minute` |
| `,`         | Separates multiple IDs or fields                 | `&filters=eventTypes:14,18`          |

### Example use patterns

**Base field selection**

Fetch only fields you need:

```
?api_token=…&select=name,starting_at
```

**Including relations**

Include related data objects:

```
?api_token=…&include=lineups,events
```

**Field filtering inside includes**

Limit fields of included relations:

```
?api_token=…&include=events:player_name,minute&filters=eventTypes:14,18
```

**Nested includes (multi-level)**

Chain includes for nested relations:

```
?api_token=…&include=events.player.country:name
```

### Exceptions & endpoint-specific notes

> ⚠️ Some endpoints do **not** support certain operators or include relations. Always review the endpoint’s documentation for allowed fields and relations.

* Invalid syntax (wrong field names, relations, or separators) may cause a **400 Bad Request**.
* When using both `include` and `filters`, filters may apply to the base entity or included entities depending on endpoint behavior.
* Some endpoints restrict depth of includes or fields allowed — use the “Allowed includes / fields” section of that endpoint page.

<table><thead><tr><th>Syntax</th><th width="211">Usage</th><th width="272">Example</th></tr></thead><tbody><tr><td><code>&#x26;select=</code></td><td>Select specific fields on the base entity</td><td><code>&#x26;select=name</code></td></tr><tr><td><code>&#x26;include=</code></td><td>Include relations</td><td><code>&#x26;include=lineups</code></td></tr><tr><td><code>&#x26;filters=</code></td><td>Filter your request</td><td><code>&#x26;filters=eventTypes:15</code></td></tr><tr><td><code>;</code></td><td>Mark end of (nested) relation. You can start including other relations from here</td><td><code>&#x26;include=lineups;events;participants</code></td></tr><tr><td><code>:</code></td><td>Mark field selection</td><td><code>&#x26;include=lineups:player_name;events:player_name,related_player_name,minute</code></td></tr><tr><td><code>,</code></td><td>Used as separation to select or filter on more IDs</td><td><code>&#x26;include=events:player_name,related_player_name,minute&#x26;filters=eventTypes:15</code></td></tr></tbody></table>

# Error codes

Whenever you receive an unexpected response or experience unexpected behavior, check the HTTP response code and use this guide to troubleshoot the issue.

### Quick reference

| Code  | Error                 | When It Happens                       | Quick Fix                                |
| ----- | --------------------- | ------------------------------------- | ---------------------------------------- |
| `200` | OK                    | Request succeeded                     | No action needed ✅                       |
| `400` | Bad Request           | Malformed request, invalid parameters | Check request syntax and parameters      |
| `401` | Unauthorized          | Missing or invalid API token          | Verify your API token                    |
| `403` | Forbidden             | Accessing unauthorized resource       | Check your plan access                   |
| `404` | Not Found             | Resource doesn't exist                | Verify the ID or endpoint                |
| `429` | Too Many Requests     | Rate limit exceeded                   | Reduce request frequency or upgrade plan |
| `500` | Internal Server Error | Server-side issue                     | Contact support if persistent            |

{% hint style="info" %}
💡 **Pro tip:** Always implement proper error handling in your code to catch and handle these errors gracefully.
{% endhint %}

### Detailed error explanations

Click an error code below for detailed troubleshooting information:

#### 200: OK ✅

**What it means:** Your request was successful and data has been returned.

**Response structure:**

```json
{
  "data": { ... },
  "subscription": [ ... ],
  "rate_limit": { ... },
  "timezone": "UTC"
}
```

**Best practices:**

* Always check that `data` field exists before processing
* Store `rate_limit` information to monitor your usage
* Handle empty data arrays appropriately

📖 **Learn more:** [Understanding API Responses](https://docs.sportmonks.com/v3/api/syntax)

#### 400: Bad request ❌

**What it means:** There's a problem with how your request is formatted or the parameters you're using.

**Common causes:**

**1. Invalid query parameters**

```bash
# ❌ Wrong
GET /fixtures?invalid_param=123

# ✅ Correct
GET /fixtures?api_token=YOUR_TOKEN&filters=fixtureLeagues:501
```

**2. Malformed include syntax**

```bash
# ❌ Wrong - space in include
GET /fixtures/123?include=participants, events

# ✅ Correct - no spaces
GET /fixtures/123?include=participants;events
```

**3. Invalid filter syntax**

```bash
# ❌ Wrong - incorrect format
GET /fixtures?filters=league=501

# ✅ Correct - proper format
GET /fixtures?filters=fixtureLeagues:501
```

**4. Invalid timezone**

```bash
# ❌ Wrong - invalid timezone
GET /fixtures?timezone=NewYork

# ✅ Correct - proper timezone format
GET /fixtures?timezone=America/New_York
```

**Example error response:**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "filters": [
      "The filters format is invalid."
    ]
  }
}
```

**How to fix:**

1. **Check parameter spelling** - Use exact names from documentation
2. **Verify filter syntax** - See [Filter Tutorial](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/filter-and-select-fields)
3. **Validate include format** - Use semicolons, no spaces
4. **Test with minimal parameters** - Remove optional params to isolate issue

**Code example (Error handling):**

```javascript
try {
  const response = await fetch(url);
  const data = await response.json();
  
  if (response.status === 400) {
    console.error('Bad Request:', data.message);
    console.error('Errors:', data.errors);
    // Fix your request parameters
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

📖 **Related:** [Request Options](https://docs.sportmonks.com/v3/api/request-options) | [Filter Tutorial](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/filter-and-select-fields)

#### 401: Unauthorized 🔒

**What it means:** Your API token is missing, invalid, or expired.

**Common causes:**

**1. Missing API token**

```bash
# ❌ Wrong - no token
GET https://api.sportmonks.com/v3/football/fixtures

# ✅ Correct - token included
GET https://api.sportmonks.com/v3/football/fixtures?api_token=YOUR_TOKEN
```

**2. Token typo or extra spaces**

```bash
# ❌ Wrong - extra space
?api_token= YOUR_TOKEN

# ✅ Correct - no spaces
?api_token=YOUR_TOKEN
```

**3. Using test token in production**

```bash
# ❌ Wrong environment
Production URL + Test Token = 401 Error

# ✅ Correct - matching environment
Production URL + Production Token
```

**4. Revoked or expired token**

* Token was regenerated in MySportmonks
* Token was manually revoked
* Account subscription expired

**Example error response:**

```json
{
  "error": "Unauthenticated.",
  "message": "Please provide a valid API token"
}
```

**How to fix:**

1. **Verify your token:**
   * Go to [MySportmonks Dashboard](https://my.sportmonks.com)
   * Navigate to API tokens section
   * Copy the correct token (don't type it manually)
2. **Test with cURL:**

```bash
curl "https://api.sportmonks.com/v3/football/fixtures?api_token=YOUR_TOKEN"
```

3. **Check token format in code:**

```javascript
// ✅ Correct implementation
const API_TOKEN = process.env.SPORTMONKS_TOKEN; // From environment variable
const url = `https://api.sportmonks.com/v3/football/fixtures?api_token=${API_TOKEN}`;
```

4. **Common mistakes to avoid:**
   * ❌ Hardcoding tokens in frontend code (security risk)
   * ❌ Including quotes around the token
   * ❌ Adding spaces before or after the token
   * ❌ Using header authentication (use query parameter instead)

**Security best practices:**

```javascript
// ✅ Good - Server-side only
// backend/api.js
const SPORTMONKS_TOKEN = process.env.SPORTMONKS_TOKEN;

// ❌ Bad - Exposed in frontend
// frontend/app.js
const SPORTMONKS_TOKEN = 'abcd1234...'; // Visible to users!
```

📖 **Related:** [Authentication Guide](https://docs.sportmonks.com/v3/welcome/authentication) | [Best Practices](https://docs.sportmonks.com/v3/welcome/best-practices)

#### 403: Forbidden 🚫

**What it means:** Your API token is valid, but you don't have permission to access this resource.

**Common Causes:**

**1. Resource not in your plan**

```bash
# Your plan: Free Plan (Danish & Scottish leagues only)
GET /fixtures?filters=fixtureLeagues:8 # Premier League
# Result: 403 Forbidden
```

**2. Feature not available in your tier**

```bash
# Your plan: Basic (no xG access)
GET /fixtures/123?include=xGFixture
# Result: 403 Forbidden
```

**3. Accessing premium endpoints**

```bash
# Predictions endpoint requires add-on
GET /predictions/probabilities/fixtures/123
# Result: 403 if you don't have Predictions add-on
```

**Example Error Response:**

```json
{
  "error": "Access Denied",
  "message": "This resource is not available in your current subscription.",
  "resource": "xGFixture",
  "plan_required": "Standard or higher"
}
```

**How to fix:**

1. **Check your plan access:**
   * Go to [MySportmonks Dashboard](https://my.sportmonks.com)
   * Review "My Subscriptions" section
   * Check which leagues and features are included
2. **Verify resource availability:**

```javascript
// Check if resource is accessible
try {
  const response = await fetch(url);
  
  if (response.status === 403) {
    console.log('Resource not available in your plan');
    console.log('Upgrade at: https://www.sportmonks.com/football-api/#plans-pricing');
  }
} catch (error) {
  console.error(error);
}
```

3. **Common 403 scenarios:**

| Scenario              | Plan needed        | Solution                          |
| --------------------- | ------------------ | --------------------------------- |
| Access Premier League | Standard+          | Upgrade or filter to your leagues |
| Use xG data           | Standard+          | Upgrade or remove xG includes     |
| Access Predictions    | Predictions add-on | Add predictions to your plan      |
| Live odds             | Odds package       | Subscribe to odds package         |

4. **Workarounds (if you can't upgrade):**
   * Filter requests to only leagues in your plan
   * Remove premium includes from requests
   * Check [Data Features by League](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/data-features-per-league)

📖 **Related:** [Plan Features](https://www.sportmonks.com/football-api/#plans-pricing) | [Data Features per League](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/data-features-per-league)

#### 404: Not found 🔍

**What it means:** The resource you're trying to access doesn't exist.

**Common Causes:**

**1. Invalid ID**

```bash
# ❌ Wrong - fixture doesn't exist
GET /fixtures/99999999999

# ✅ Correct - use valid fixture ID
GET /fixtures/18535517
```

**2. Wrong endpoint path**

```bash
# ❌ Wrong - typo in endpoint
GET /v3/football/fixture/123  # "fixture" should be "fixtures"

# ✅ Correct - proper endpoint
GET /v3/football/fixtures/123
```

**3. Resource was deleted**

```bash
# Fixture was removed from database
# (e.g., cancelled match, placeholder fixture)
GET /fixtures/12345
# Result: 404 Not Found
```

**Example error response:**

```json
{
  "error": "Not Found",
  "message": "The requested resource could not be found.",
  "resource_type": "fixture",
  "resource_id": "99999999"
}
```

**How to fix:**

1. **Verify the ID exists:**

```javascript
// Search for the resource first
const searchResponse = await fetch(
  'https://api.sportmonks.com/v3/football/fixtures/search/Celtic?api_token=YOUR_TOKEN'
);
const results = await searchResponse.json();

// Then use a valid ID from results
const fixtureId = results.data[0].id;
```

2. **Check endpoint spelling:**

```javascript
// ✅ Correct endpoints
/v3/football/fixtures/{id}
/v3/football/teams/{id}
/v3/football/players/{id}
/v3/football/leagues/{id}

// ❌ Common mistakes
/v3/football/fixture/{id}   // Missing 's'
/v3/soccer/fixtures/{id}    // Wrong sport name
/v3/football/match/{id}     // Wrong entity name
```

3. **Handle 404 gracefully:**

```javascript
async function getFixture(fixtureId) {
  try {
    const response = await fetch(
      `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}?api_token=YOUR_TOKEN`
    );
    
    if (response.status === 404) {
      console.log('Fixture not found');
      return null; // Return null instead of throwing error
    }
    
    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

4. **Use ID finder tool:**
   * Visit [ID Finder](https://my.sportmonks.com/resources/id-finder)
   * Search for teams, players, leagues, etc.
   * Get valid IDs for your requests

📖 **Related:** [API Structure](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/api-structure-and-navigation) | [Endpoints Reference](https://docs.sportmonks.com/v3/endpoints-and-entities/endpoints)

#### 429: Too many requests ⏱️

**What it means:** You've exceeded your plan's rate limit.

**Common causes:**

**1. Making requests too quickly**

```javascript
// ❌ Wrong - rapid fire requests
for (let i = 0; i < 1000; i++) {
  fetch(url); // Hitting rate limit!
}

// ✅ Correct - with delay
for (let i = 0; i < 1000; i++) {
  await fetch(url);
  await sleep(100); // 100ms delay
}
```

**2. Inefficient API usage**

```javascript
// ❌ Wrong - separate requests
const team1 = await fetch('/teams/53');
const team2 = await fetch('/teams/62');
const fixture = await fetch('/fixtures/123');
// 3 API calls

// ✅ Correct - use includes
const fixture = await fetch('/fixtures/123?include=participants');
// 1 API call with all data
```

**3. Not caching reference data**

```javascript
// ❌ Wrong - fetching types every time
for (const stat of statistics) {
  const type = await fetch(`/types/${stat.type_id}`); // Wasteful!
}

// ✅ Correct - fetch once and cache
const allTypes = await fetch('/types');
const typesMap = new Map(allTypes.data.map(t => [t.id, t]));
// Use cached types for lookups
```

**Example error response:**

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit of 3000 requests per hour exceeded.",
  "retry_after": 1847,
  "rate_limit": {
    "remaining": 0,
    "total": 3000,
    "resets_in": "30:47"
  }
}
```

**How to fix:**

**1. Check your rate limit:** Every successful response includes rate limit info:

```json
{
  "data": { ... },
  "rate_limit": {
    "resets_in_seconds": 1847,
    "remaining": 2847,
    "requested_entity": "Fixture"
  }
}
```

**2. Implement rate limiting:**

```javascript
class RateLimiter {
  constructor(maxRequests, perSeconds) {
    this.maxRequests = maxRequests;
    this.perSeconds = perSeconds;
    this.requests = [];
  }
  
  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.perSeconds * 1000);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = (this.perSeconds * 1000) - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(Date.now());
  }
}

// Usage
const limiter = new RateLimiter(3000, 3600); // 3000 requests per hour

async function makeRequest(url) {
  await limiter.throttle();
  return fetch(url);
}
```

**3. Implement retry with exponential backoff:**

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

**4. Optimisation strategies:**

| Strategy             | Savings | How                                      |
| -------------------- | ------- | ---------------------------------------- |
| Use includes         | 50-80%  | Combine related data in one request      |
| Cache reference data | 30-50%  | Store types, states, leagues locally     |
| Batch operations     | 40-60%  | Use multi-ID endpoints where available   |
| Smart polling        | 30-40%  | Only poll live matches, reduce frequency |

**Example - Before & after optimisation:**

```javascript
// ❌ Before: 50 API calls for 10 fixtures
for (const fixtureId of fixtureIds) {
  const fixture = await fetch(`/fixtures/${fixtureId}`);
  const team1 = await fetch(`/teams/${fixture.team1_id}`);
  const team2 = await fetch(`/teams/${fixture.team2_id}`);
  const events = await fetch(`/fixtures/${fixtureId}/events`);
  const stats = await fetch(`/fixtures/${fixtureId}/statistics`);
}

// ✅ After: 2 API calls for 10 fixtures
const fixtures = await fetch(
  `/fixtures/multi/${fixtureIds.join(',')}?include=participants;events;statistics.type`
);
// Then fetch types once and cache
const types = await fetch('/types');
```

**5. Monitor your usage:**

```javascript
function logRateLimit(response) {
  const remaining = response.rate_limit.remaining;
  const total = response.rate_limit.resets_in_seconds;
  
  console.log(`Rate limit: ${remaining} requests remaining`);
  
  if (remaining < 100) {
    console.warn('⚠️ Low on API calls! Optimize your requests.');
  }
}
```

📖 **Related:** [Rate Limiting Guide](https://docs.sportmonks.com/v3/api/rate-limit) | [Includes Tutorial](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/includes) | [Best Practices](https://docs.sportmonks.com/v3/welcome/best-practices)

#### 500: Internal server error 🔧

**What it means:** Something went wrong on our servers.

**When this happens:**

* Temporary server issue
* Database connectivity problem
* Unexpected data format causing server error
* Service maintenance or deployment

**Example error response:**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Our team has been notified.",
  "error_id": "err_abc123xyz"
}
```

**How to handle:**

**1. Implement retry logic:**

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 500) {
        if (i < maxRetries - 1) {
          console.log(`Server error. Retrying (${i + 1}/${maxRetries})...`);
          await sleep(Math.pow(2, i) * 1000); // Exponential backoff
          continue;
        }
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

**2. Check API status:**

* Visit [Sportmonks Status Page](https://status.sportmonks.com) (if available)
* Check for maintenance announcements
* Verify if issue is widespread or isolated

**3. Contact support (if persistent):**

```javascript
if (response.status === 500) {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    endpoint: url,
    error_id: response.error_id,
    request_id: response.headers.get('X-Request-ID')
  };
  
  console.error('Persistent 500 error:', errorDetails);
  // Send to support: support@sportmonks.com
}
```

**4. Graceful degradation:**

```javascript
async function getFixtures(fallbackData) {
  try {
    const response = await fetch(url);
    
    if (response.status === 500) {
      console.warn('Server error. Using cached data.');
      return fallbackData; // Use cached or default data
    }
    
    return await response.json();
  } catch (error) {
    console.error('Complete failure:', error);
    return fallbackData;
  }
}
```

📖 **Related:** [Best Practices](https://docs.sportmonks.com/v3/welcome/best-practices) | [Contact Support](https://www.sportmonks.com/contact-support/)

### Common error scenarios

#### Scenario 1: "Data is missing"

**Problem:** Response is 200 OK but data is empty or missing fields.

**Not an error code issue!** This is usually because:

* Resource not in your plan → Check [plan access](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/data-features-per-league)
* Missing includes → Add necessary includes to request
* Filtering too strict → Review [filter syntax](https://docs.sportmonks.com/v3/tutorials-and-guides/tutorials/filter-and-select-fields)

#### Scenario 2: CORS Errors (Frontend)

**Problem:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:** This isn't an API error - use a backend proxy:

```javascript
// ❌ Don't do this - frontend direct call
fetch('https://api.sportmonks.com/v3/football/fixtures?api_token=YOUR_TOKEN')

// ✅ Do this - call your backend
fetch('/api/fixtures') // Your backend proxies to Sportmonks
```

📖 **Learn more:** [CORS Best Practices](https://docs.sportmonks.com/v3/welcome/best-practices#cors-and-frontend-security)

#### Scenario 3: Timeout errors

**Problem:** Request times out with no response.

**Solutions:**

* Reduce includes complexity
* Add pagination to large requests
* Check your network connectivity
* Increase timeout threshold in your code

### Error handling code examples

#### Complete Example (JavaScript/Node.js)

{% tabs %}
{% tab title="JavaScript" %}

```javascript
class SportmonksAPI {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseURL = 'https://api.sportmonks.com/v3/football';
  }
  
  async request(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    url.searchParams.append('api_token', this.apiToken);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      // Handle different status codes
      switch (response.status) {
        case 200:
          return { success: true, data: data.data };
          
        case 400:
          throw new Error(`Bad Request: ${data.message || 'Invalid parameters'}`);
          
        case 401:
          throw new Error('Unauthorized: Check your API token');
          
        case 403:
          throw new Error(`Forbidden: ${data.message || 'Resource not in your plan'}`);
          
        case 404:
          throw new Error(`Not Found: Resource doesn't exist`);
          
        case 429:
          const retryAfter = data.retry_after || 60;
          throw new Error(`Rate Limited: Retry after ${retryAfter} seconds`);
          
        case 500:
          throw new Error('Server Error: Try again later or contact support');
          
        default:
          throw new Error(`Unexpected error: ${response.status}`);
      }
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }
}

// Usage
const api = new SportmonksAPI(process.env.SPORTMONKS_TOKEN);

try {
  const fixtures = await api.request('/fixtures', {
    filters: 'fixtureLeagues:501',
    include: 'participants'
  });
  console.log(fixtures);
} catch (error) {
  // Handle error appropriately in your app
  console.error('Failed to fetch fixtures:', error);
}
```

{% endtab %}

{% tab title="Python" %}

```python
import requests
import time
from typing import Optional, Dict, Any

class SportmonksAPI:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = 'https://api.sportmonks.com/v3/football'
    
    def request(self, endpoint: str, params: Optional[Dict] = None, retry_count: int = 0) -> Dict[str, Any]:
        """Make API request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Add API token to params
        if params is None:
            params = {}
        params['api_token'] = self.api_token
        
        try:
            response = requests.get(url, params=params, timeout=30)
            
            # Handle different status codes
            if response.status_code == 200:
                return {'success': True, 'data': response.json().get('data')}
            
            elif response.status_code == 400:
                error_data = response.json()
                raise ValueError(f"Bad Request: {error_data.get('message', 'Invalid parameters')}")
            
            elif response.status_code == 401:
                raise PermissionError('Unauthorized: Check your API token')
            
            elif response.status_code == 403:
                error_data = response.json()
                raise PermissionError(f"Forbidden: {error_data.get('message', 'Resource not in your plan')}")
            
            elif response.status_code == 404:
                raise LookupError('Not Found: Resource does not exist')
            
            elif response.status_code == 429:
                if retry_count < 3:
                    retry_after = response.json().get('retry_after', 60)
                    print(f"Rate limited. Retrying after {retry_after} seconds...")
                    time.sleep(retry_after)
                    return self.request(endpoint, params, retry_count + 1)
                else:
                    raise Exception('Rate limit exceeded. Max retries reached.')
            
            elif response.status_code == 500:
                if retry_count < 2:
                    wait_time = 2 ** retry_count
                    print(f"Server error. Retrying after {wait_time} seconds...")
                    time.sleep(wait_time)
                    return self.request(endpoint, params, retry_count + 1)
                else:
                    raise Exception('Server error persists. Contact support.')
            
            else:
                raise Exception(f"Unexpected error: HTTP {response.status_code}")
        
        except requests.exceptions.Timeout:
            raise TimeoutError('Request timed out')
        
        except requests.exceptions.ConnectionError:
            raise ConnectionError('Failed to connect to API')

# Usage
api = SportmonksAPI(os.environ.get('SPORTMONKS_TOKEN'))

try:
    fixtures = api.request('/fixtures', {
        'filters': 'fixtureLeagues:501',
        'include': 'participants'
    })
    print(f"Found {len(fixtures['data'])} fixtures")
except Exception as error:
    print(f"Error: {error}")
```

{% endtab %}
{% endtabs %}

### See also

* [Rate Limiting Guide](https://docs.sportmonks.com/v3/api/rate-limit) - Understand and optimize rate limits
* [Authentication](https://docs.sportmonks.com/v3/welcome/authentication) - Setting up API access
* [Best Practices](https://docs.sportmonks.com/v3/welcome/best-practices) - Build robust applications
* [Request Options](https://docs.sportmonks.com/v3/api/request-options) - Available query parameters
* [Contact Support](https://www.sportmonks.com/contact-support/) - Get help when needed

\
**Need help?** Contact <support@sportmonks.com> or use the chat widget.
