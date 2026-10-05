-- ============================================================================
-- Migration: 002_case_sequence.sql
-- Purpose: Add a sequence for auto-generating CASE-YYYY-NNNN numbers
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1;
