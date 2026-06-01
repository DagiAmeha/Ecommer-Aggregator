# System Testing Documentation

This document covers major/core testing only. It intentionally avoids exhaustive CRUD-level cases and minor UI actions. The focus is on academic core workflows and business logic.

Scope includes:
- Authentication
- Product aggregation
- Product normalization
- Duplicate prevention
- Product grouping
- Product search
- Product comparison
- API ingestion
- Web scraping ingestion
- Wishlist
- Vendor dashboard
- Admin dashboard

Emphasis chain:
Aggregation -> Normalization -> Grouping -> Comparison

Out of scope:
- Every endpoint or small CRUD flow
- Pixel-perfect UI checks
- Micro-utilities and trivial getters/setters

## Test Levels

### Unit Testing
- Validate core logic in isolation: normalization rules, duplicate detection, grouping heuristics, comparison scoring, auth token validation, wishlist constraints.
- Use stubs/mocks for external API responses, scraping results, and databases.

### Integration Testing
- Validate module-to-module behavior: ingestion -> normalization -> grouping -> comparison pipeline, auth + protected endpoints, search + filters, dashboard data retrieval.
- Use a test database and controlled seed data.

### System Testing
- Validate end-to-end scenarios: user authentication, ingestion flows, search/compare workflows, wishlist usage, and admin/vendor dashboards.

### Functional Testing
- Confirm that requirements for each major workflow are met and the system behaves correctly for expected inputs, boundaries, and key errors.

### Non-Functional Testing
- Performance, reliability, security, and resilience for the major flows.

## Test Data Strategy
- Use representative vendor data with known overlaps, variant naming, and attribute inconsistencies.
- Provide at least two vendors that list the same product differently for grouping and duplicate checks.
- Include mixed currency, locale, and missing attributes to validate normalization and comparison.
- Seed users with different roles: admin, vendor, and standard user.

## Core Workflows and Test Cases

### 1) Authentication

#### Unit Tests
- UT-AUTH-001: Hashing and verification uses expected algorithm and rejects invalid hashes.
- UT-AUTH-002: Token creation embeds expected claims and expiration.
- UT-AUTH-003: Token validation rejects expired or tampered tokens.
- UT-AUTH-004: Role parsing recognizes admin/vendor/user correctly.

#### Integration Tests
- IT-AUTH-001: Login succeeds and returns token for valid credentials.
- IT-AUTH-002: Protected route rejects missing token and accepts valid token.
- IT-AUTH-003: Role-restricted route blocks insufficient roles.

#### System/Functional Tests
- ST-AUTH-001: User signs in, accesses protected search and wishlist, signs out, and access is revoked.

#### Non-Functional Tests
- NFT-AUTH-001: Brute-force protection triggers after repeated failures.
- NFT-AUTH-002: Session/token expiry time meets policy.

---

### 2) Aggregation -> Normalization -> Grouping -> Comparison (Core Chain)

This chain is the academic core and should be tested as a single pipeline and as individual modules.

#### Unit Tests
- UT-AGG-001: Aggregation merges incoming vendor data without dropping items.
- UT-NORM-001: Normalization standardizes brand names, units, and currency.
- UT-NORM-002: Normalization handles missing attributes with defaults or nulls.
- UT-DEDUP-001: Duplicate detection identifies same SKU across sources.
- UT-GROUP-001: Grouping clusters equivalent products with variant naming.
- UT-COMP-001: Comparison score calculation ranks offers correctly by price + attributes.

#### Integration Tests
- IT-PIPE-001: API ingestion -> normalization -> grouping -> comparison yields a single grouped product with multiple offers.
- IT-PIPE-002: Scraping ingestion -> normalization -> grouping -> comparison matches existing grouped product (no duplicates created).
- IT-PIPE-003: Mixed currency offers are normalized and compared on a single base currency.

#### System/Functional Tests
- ST-PIPE-001: User searches a product, opens comparison, and sees grouped offers aggregated from API and scraping sources.
- ST-PIPE-002: Admin triggers a re-aggregation job; grouped products remain stable and duplicates are not created.

#### Non-Functional Tests
- NFT-PIPE-001: End-to-end pipeline completes within defined SLA for N items.
- NFT-PIPE-002: Pipeline handles partial vendor failure without corrupting grouped products.

---

### 3) Product Aggregation

#### Unit Tests
- UT-AGG-002: Aggregator supports multiple sources per vendor.
- UT-AGG-003: Aggregator preserves vendor metadata (source, timestamp).

#### Integration Tests
- IT-AGG-001: Aggregation stores raw items and forwards to normalization.

#### System/Functional Tests
- ST-AGG-001: Aggregated products appear in search results after successful ingestion.

#### Non-Functional Tests
- NFT-AGG-001: Aggregation processes a batch without memory spikes.

---

### 4) Product Normalization

#### Unit Tests
- UT-NORM-003: Normalization corrects common attribute variants (e.g., TB vs TeraByte).
- UT-NORM-004: Normalization validates and rejects invalid or impossible values.

#### Integration Tests
- IT-NORM-001: Normalized products are indexed for search and grouping.

#### System/Functional Tests
- ST-NORM-001: Normalized attributes appear consistently in UI filters.

---

### 5) Duplicate Prevention

#### Unit Tests
- UT-DEDUP-002: Fuzzy match detects duplicates by name + specs + brand.
- UT-DEDUP-003: Duplicate prevention skips insert and updates existing product with new offer.

#### Integration Tests
- IT-DEDUP-001: API and scraping sources for same item do not create two grouped products.

#### System/Functional Tests
- ST-DEDUP-001: Re-ingestion does not increase product count but updates offers.

---

### 6) Product Grouping

#### Unit Tests
- UT-GROUP-002: Grouping respects thresholds for similarity and does not merge distinct models.
- UT-GROUP-003: Grouping keeps variant sizes/colors as separate offers under one group.

#### Integration Tests
- IT-GROUP-001: Grouping outputs stable group IDs across re-ingestion.

#### System/Functional Tests
- ST-GROUP-001: Group view shows all vendor offers for the same product.

---

### 7) Product Search

#### Unit Tests
- UT-SEARCH-001: Query parser supports keywords and attribute filters.
- UT-SEARCH-002: Sorting respects price/ratings relevance.

#### Integration Tests
- IT-SEARCH-001: Search index updates after new ingestion and normalization.

#### System/Functional Tests
- ST-SEARCH-001: User can search, filter by brand and price, and open a product group.

#### Non-Functional Tests
- NFT-SEARCH-001: Search results return within latency SLA for typical queries.

---

### 8) Product Comparison

#### Unit Tests
- UT-COMP-002: Comparison highlights differing attributes correctly.
- UT-COMP-003: Comparison handles missing fields without UI breakage.

#### Integration Tests
- IT-COMP-001: Comparison loads grouped offers from multiple vendors.

#### System/Functional Tests
- ST-COMP-001: User compares two or more grouped offers and sees correct price and attribute differences.

---

### 9) API Ingestion

#### Unit Tests
- UT-API-ING-001: API parser handles pagination and rate limits.
- UT-API-ING-002: API errors are retried with backoff rules.

#### Integration Tests
- IT-API-ING-001: API ingestion feeds normalization with valid items only.

#### System/Functional Tests
- ST-API-ING-001: Vendor API ingestion populates new offers visible in grouped products.

#### Non-Functional Tests
- NFT-API-ING-001: Ingestion handles peak data size without timeouts.

---

### 10) Web Scraping Ingestion

#### Unit Tests
- UT-SCRAPE-001: Scraping parsers extract name, price, and URL reliably.
- UT-SCRAPE-002: Anti-bot failures are detected and logged.

#### Integration Tests
- IT-SCRAPE-001: Scraped items are normalized and grouped correctly.

#### System/Functional Tests
- ST-SCRAPE-001: Scraped offers appear in comparison view after processing.

#### Non-Functional Tests
- NFT-SCRAPE-001: Scraping jobs recover after a transient failure.

---

### 11) Wishlist

#### Unit Tests
- UT-WISH-001: Wishlist prevents duplicates per user.
- UT-WISH-002: Wishlist handles deleted or unavailable products gracefully.

#### Integration Tests
- IT-WISH-001: Authenticated user adds a grouped product and it appears in wishlist.

#### System/Functional Tests
- ST-WISH-001: User adds a product group to wishlist and receives updated offers later.

---

### 12) Vendor Dashboard

#### Unit Tests
- UT-VEND-001: Vendor can only access their own offers and metrics.
- UT-VEND-002: Vendor analytics aggregates by time range correctly.

#### Integration Tests
- IT-VEND-001: Vendor dashboard loads offers and ingestion statuses.

#### System/Functional Tests
- ST-VEND-001: Vendor logs in and verifies ingestion status and product visibility.

---

### 13) Admin Dashboard

#### Unit Tests
- UT-ADMIN-001: Admin can access all vendors and aggregation jobs.
- UT-ADMIN-002: Admin actions are audited.

#### Integration Tests
- IT-ADMIN-001: Admin dashboard shows ingestion failures and allows re-run.

#### System/Functional Tests
- ST-ADMIN-001: Admin reviews grouping anomalies and triggers re-processing.

---

## Non-Functional Test Focus
- Security: Authentication/authorization, token expiry, and role boundaries.
- Performance: Search latency and pipeline processing time under load.
- Reliability: Ingestion retries and partial failure isolation.
- Data integrity: No duplicate grouped products after repeated ingestion.
- Observability: Key pipeline errors are logged with correlation IDs.

## Acceptance Criteria for Core Workflows
- Aggregation -> Normalization -> Grouping -> Comparison completes without data loss.
- Duplicate prevention maintains stable product counts across re-ingestion.
- Search and comparison reflect latest aggregated offers within the expected window.
- Admin and vendor roles see only permitted data and actions.
