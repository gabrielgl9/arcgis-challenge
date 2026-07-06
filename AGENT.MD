# AGENT.md

## Project

Parcels & Zoning Data Pipeline

This project is a take-home assessment for a Software Engineer position.

The objective is NOT to build a production-ready application, but to demonstrate:

- System design
- Data modeling
- Data ingestion
- Spatial reasoning
- PostgreSQL/PostGIS knowledge
- Clean architecture

The project should remain simple and understandable.

---

# Business Goal

Consume two public ArcGIS Feature Services:

1. Current Zoning (City of Buda)
2. Hays County Parcels

Normalize both datasets and persist them into PostgreSQL + PostGIS.

After ingestion, expose REST endpoints capable of answering questions such as:

> Show residential parcels larger than one acre.

---

# Important Constraints

These requirements come directly from the assessment.

## Residential

A parcel is residential when:

- zoning category starts with "R"
  OR
- zoning description starts with "Residential"

Do not invent additional rules.

---

## Lot Area

Lot area MUST be calculated from parcel geometry.

Never trust any "area" field from the source dataset.

Always use PostGIS geometry functions.

---

## Relationship

There is NO foreign key between parcels and zoning.

The relationship is spatial.

Always use PostGIS spatial predicates such as:

- ST_Intersects
- ST_Contains

Never create a zoning_id column inside parcels.

---

## Source of Truth

ArcGIS is only an external data source.

The application must NEVER query ArcGIS during normal API requests.

Workflow:

ArcGIS
↓

Import

↓

PostgreSQL

↓

REST API

---

# Architecture

External ArcGIS APIs

↓

ArcGIS Client

↓

Importers

↓

Normalization

↓

PostgreSQL + PostGIS

↓

REST API

---

# Components

## ArcGIS Client

Responsibilities:

- Execute HTTP requests
- Handle ArcGIS pagination
- Return Feature collections
- Hide ArcGIS-specific details

Must NOT contain business logic.

---

## Zoning Importer

Responsibilities:

- Download zoning dataset
- Normalize fields
- Convert ArcGIS geometry
- Upsert zoning records

---

## Parcels Importer

Responsibilities:

- Download parcels dataset
- Normalize fields
- Convert geometry
- Calculate parcel area
- Upsert parcel records

---

## REST API

Responsibilities:

- Query PostgreSQL
- Never communicate with ArcGIS
- Return JSON

---

# Tech Stack

Language

- TypeScript

Runtime

- Node.js

Framework

- Fastify

Database

- PostgreSQL

Spatial Extension

- PostGIS

ORM

- Drizzle ORM

Containerization

- Docker Compose

---

# Database

Use PostgreSQL with PostGIS enabled.

Example:

CREATE EXTENSION IF NOT EXISTS postgis;

Spatial columns should use Geometry.

Spatial indexes should use GiST.

---

# Geometry

ArcGIS geometries must be converted into PostGIS geometries.

Do NOT store raw ArcGIS JSON inside the database.

Preferred geometry type:

Polygon

or

MultiPolygon

depending on the source.

---

# Spatial Queries

Prefer PostGIS SQL.

Examples:

ST_Area()

ST_Intersects()

ST_Contains()

ST_Transform()

Avoid trying to emulate spatial calculations in TypeScript.

---

# ORM

Use Drizzle ORM.

Regular CRUD may use Drizzle query builder.

Spatial queries should use raw SQL through Drizzle.

Example:

db.execute(sql`SELECT ... ST_Intersects(...)`)

This is expected.

---

# Ingestion

The ingestion pipeline must be idempotent.

Running it multiple times must update existing records instead of inserting duplicates.

Use UPSERT whenever possible.

---

# API

Expected endpoints:

POST /api/ingestion

Imports both datasets.

---

GET /api/parcels/residential

Query parameters:

minArea

Returns residential parcels larger than the given acreage.

---

GET /api/stats

Returns:

- parcel count
- median parcel size

Grouped by area (currently assumed to mean neighborhood).

---

# Code Style

Prefer:

- small classes
- small functions
- composition over inheritance
- dependency injection
- explicit types

Avoid:

- huge service classes
- unnecessary abstractions
- premature optimization

---

# Time Budget

This project intentionally targets approximately four hours of work.

Keep implementations simple.

Do not over-engineer.

---

# Things NOT to Build

Do NOT implement:

- Authentication
- Authorization
- Frontend
- Background workers
- Message queues
- Event sourcing
- CQRS
- GraphQL
- Microservices
- Caching

Unless explicitly requested.

---

# Assumptions

Current assumptions:

- Area means neighborhood.
- Parcels outside zoning polygons are ignored.
- ArcGIS geometry is authoritative.
- Area is always computed from geometry.

---

# Questions for Stakeholders

If requirements become ambiguous, prefer documenting questions instead of making assumptions.

Examples:

- What exactly is "group by area"?
- How should mixed-use zoning be classified?
- Should parcels outside Buda be returned?
- Can zoning polygons overlap?
- Is incremental synchronization required?

---

# Guiding Principle

Whenever there is a design decision, prefer the simplest implementation that satisfies the requirements and can be clearly explained during the interview.

The goal is clarity over completeness.
