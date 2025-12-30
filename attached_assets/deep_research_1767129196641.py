"""
Gemini Deep Research integration for watch sales research.

This module uses Google's Gemini Deep Research Agent to perform comprehensive
web-based research on watch listings and sales, then compares results with
the existing scraping methodology.
"""

import logging
import time
import os
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, field

# Load .env file if python-dotenv is available
# Use override=True to ensure .env values take precedence over system env vars
try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except ImportError:
    pass  # python-dotenv not installed, rely on system env vars

from .models import WatchSale, WatchAnalysis, PriceStatistics, SourceType
from .config import Config

logger = logging.getLogger(__name__)

# Check for google-genai availability
try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-genai not available. Install with: pip install google-genai")


@dataclass
class TokenUsage:
    """Token usage and cost estimation for a Deep Research run."""
    prompt_tokens: int = 0
    response_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0

    # Gemini 3 Pro pricing (as of Dec 2025)
    # Input: $2.00/M tokens (≤200K), $4.00/M (>200K)
    # Output: $12.00/M tokens (≤200K), $18.00/M (>200K)
    INPUT_COST_PER_MILLION = 2.00  # Using lower tier rate
    OUTPUT_COST_PER_MILLION = 12.00  # Includes thinking tokens

    def calculate_cost(self) -> float:
        """Calculate estimated cost based on token counts."""
        input_cost = (self.prompt_tokens / 1_000_000) * self.INPUT_COST_PER_MILLION
        output_cost = (self.response_tokens / 1_000_000) * self.OUTPUT_COST_PER_MILLION
        self.estimated_cost_usd = input_cost + output_cost
        return self.estimated_cost_usd

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'prompt_tokens': self.prompt_tokens,
            'response_tokens': self.response_tokens,
            'total_tokens': self.total_tokens,
            'estimated_cost_usd': round(self.estimated_cost_usd, 4)
        }


@dataclass
class DeepResearchResult:
    """Container for Deep Research results."""
    interaction_id: str
    status: str
    raw_report: str
    extracted_sales: List[WatchSale] = field(default_factory=list)
    market_insights: Dict[str, Any] = field(default_factory=dict)
    sources_cited: List[str] = field(default_factory=list)
    research_duration_seconds: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)
    token_usage: Optional[TokenUsage] = None
    original_prompt: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'interaction_id': self.interaction_id,
            'status': self.status,
            'raw_report': self.raw_report,
            'extracted_sales': [s.to_dict() for s in self.extracted_sales],
            'market_insights': self.market_insights,
            'sources_cited': self.sources_cited,
            'research_duration_seconds': self.research_duration_seconds,
            'timestamp': self.timestamp.isoformat(),
            'token_usage': self.token_usage.to_dict() if self.token_usage else None,
            'original_prompt': self.original_prompt
        }


class GeminiDeepResearcher:
    """
    Uses Gemini Deep Research Agent to research watch listings and sales.
    
    This provides an alternative/complementary research methodology to the
    existing ScrapeGraphAI-based scraper.
    """
    
    AGENT_NAME = 'deep-research-pro-preview-12-2025'
    DEFAULT_POLL_INTERVAL = 10  # seconds
    MAX_WAIT_TIME = 3600  # 60 minutes max
    
    def __init__(self, config: Optional[Config] = None, api_key: Optional[str] = None):
        """
        Initialize the Deep Research agent.
        
        Args:
            config: Optional application configuration
            api_key: Optional Gemini API key (overrides env var)
        """
        if not GENAI_AVAILABLE:
            raise ImportError(
                "google-genai package is required. Install with: pip install google-genai"
            )
        
        self.config = config
        
        # Get API key from various sources
        self.api_key = api_key or os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')

        if not self.api_key:
            raise ValueError(
                "Gemini API key not found. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable, "
                "or pass api_key parameter."
            )

        # Debug: show which key is being used (first 10 and last 4 chars for verification)
        key_preview = f"{self.api_key[:10]}...{self.api_key[-4:]}" if len(self.api_key) > 14 else "***"
        logger.info(f"Using API key: {key_preview}")

        # Initialize the genai client
        self.client = genai.Client(api_key=self.api_key)
        
        logger.info("Gemini Deep Research agent initialized")
    
    def research_watch(
        self,
        brand: str,
        reference: str,
        include_streaming: bool = False,
        poll_interval: int = DEFAULT_POLL_INTERVAL
    ) -> DeepResearchResult:
        """
        Research a watch using Gemini Deep Research.
        
        Args:
            brand: Watch brand name (e.g., "Rolex", "Patek Philippe")
            reference: Watch reference number (e.g., "126500", "5712R")
            include_streaming: Whether to stream progress updates
            poll_interval: Seconds between status checks
        
        Returns:
            DeepResearchResult with the research findings
        """
        start_time = time.time()
        
        # Build the research prompt
        prompt = self._build_research_prompt(brand, reference)
        
        logger.info(f"Starting Deep Research for {brand} {reference}")
        
        try:
            if include_streaming:
                return self._research_with_streaming(brand, reference, prompt, start_time)
            else:
                return self._research_with_polling(brand, reference, prompt, poll_interval, start_time)
        
        except Exception as e:
            logger.error(f"Deep Research failed: {str(e)}", exc_info=True)
            raise

    def _build_research_prompt(self, brand: str, reference: str) -> str:
        """Build a comprehensive research prompt for watch sales data."""
        return f"""Research comprehensive watch sales and listing data for {brand} {reference}.

Your research should cover:

1. **Recent Sales Data**: Find actual COMPLETED sale prices from auction houses (Christie's, Sotheby's, Phillips),
   marketplaces (Chrono24, WatchBox, Hodinkee Shop), and collector forums.

2. **Current Market Listings**: Find CURRENT asking prices from active listings on Chrono24, WatchBox,
   eBay, dealer websites, and other marketplaces. These show where sellers believe the market is.

3. **Price Trends**: How have prices changed over the past 1-3 years?

4. **Condition Impact**: How does condition (BNIB, unworn, lightly worn, etc.) affect pricing?

5. **Special Editions**: Are there special/limited edition variants? How do they compare in value?

6. **Market Insights**: What factors drive demand? Any notable recent events affecting prices?

Format the output as a comprehensive report with the following structure:

## Executive Summary
Brief overview of current market status for {brand} {reference}

## Completed Sales Table
| Date | Price (USD) | Condition | Source | Notes |
|------|-------------|-----------|--------|-------|
(Include as many ACTUAL COMPLETED sales as you can find with dates - these are transactions that have closed)

## Current Listings Table
| Date Listed | Asking Price (USD) | Condition | Source | Notes |
|-------------|-------------------|-----------|--------|-------|
(Include CURRENT asking prices from active listings - these represent where the market is heading)

## Price Statistics
- Average Sold Price: $X
- Median Sold Price: $X
- Sold Price Range: $X - $X
- Average Asking Price: $X
- Asking Price Range: $X - $X
- Recent trend: increasing/stable/decreasing
- Asking vs Sold Spread: X% (indicates negotiation room)

## Condition-Based Pricing
| Condition | Typical Sold Range | Typical Asking Range |
|-----------|-------------------|---------------------|

## Special Editions & Variants
List any special editions with pricing differences

## Market Analysis
Key insights about supply, demand, and market dynamics.
Include analysis of the spread between asking and sold prices.

## Sources
List all sources used with URLs where available

IMPORTANT: Clearly distinguish between COMPLETED SALES (actual transactions) and ASKING PRICES (current listings).
Both are valuable - sales show realized value, asking prices show market sentiment.
Prioritize recent data (last 12-18 months) but include historical data for trend analysis."""

    def _research_with_polling(
        self,
        brand: str,
        reference: str,
        prompt: str,
        poll_interval: int,
        start_time: float
    ) -> DeepResearchResult:
        """Execute research using polling approach."""
        # Start the research task
        interaction = self.client.interactions.create(
            input=prompt,
            agent=self.AGENT_NAME,
            background=True
        )

        interaction_id = interaction.id
        logger.info(f"Research started with interaction ID: {interaction_id}")

        # Poll for completion
        while True:
            elapsed = time.time() - start_time
            if elapsed > self.MAX_WAIT_TIME:
                raise TimeoutError(f"Research exceeded maximum wait time of {self.MAX_WAIT_TIME} seconds")

            interaction = self.client.interactions.get(interaction_id)

            if interaction.status == "completed":
                logger.info(f"Research completed in {elapsed:.1f} seconds")
                break
            elif interaction.status == "failed":
                error_msg = getattr(interaction, 'error', 'Unknown error')
                raise RuntimeError(f"Research failed: {error_msg}")

            logger.debug(f"Research in progress... ({elapsed:.0f}s elapsed)")
            time.sleep(poll_interval)

        # Extract the report text
        raw_report = ""
        if interaction.outputs:
            raw_report = interaction.outputs[-1].text

        # Parse the results
        duration = time.time() - start_time
        return self._parse_research_results(
            interaction_id=interaction_id,
            status="completed",
            raw_report=raw_report,
            brand=brand,
            reference=reference,
            duration=duration,
            original_prompt=prompt
        )

    def _research_with_streaming(
        self,
        brand: str,
        reference: str,
        prompt: str,
        start_time: float
    ) -> DeepResearchResult:
        """Execute research with streaming updates."""
        stream = self.client.interactions.create(
            input=prompt,
            agent=self.AGENT_NAME,
            background=True,
            stream=True,
            agent_config={
                "type": "deep-research",
                "thinking_summaries": "auto"
            }
        )

        interaction_id = None
        raw_report = ""

        for chunk in stream:
            if chunk.event_type == "interaction.start":
                interaction_id = chunk.interaction.id
                logger.info(f"Research started: {interaction_id}")

            if chunk.event_type == "content.delta":
                if chunk.delta.type == "text":
                    raw_report += chunk.delta.text
                elif chunk.delta.type == "thought_summary":
                    logger.debug(f"Thought: {chunk.delta.content.text}")

            elif chunk.event_type == "interaction.complete":
                logger.info("Research stream completed")
                break

        duration = time.time() - start_time
        return self._parse_research_results(
            interaction_id=interaction_id or "unknown",
            status="completed",
            raw_report=raw_report,
            brand=brand,
            reference=reference,
            duration=duration,
            original_prompt=prompt
        )

    def _parse_research_results(
        self,
        interaction_id: str,
        status: str,
        raw_report: str,
        brand: str,
        reference: str,
        duration: float,
        original_prompt: str = ""
    ) -> DeepResearchResult:
        """Parse the raw research report into structured data."""
        extracted_sales = []
        market_insights = {}
        sources_cited = []
        token_usage = None

        try:
            # Extract sales data from table if present
            extracted_sales = self._extract_sales_from_report(raw_report, brand, reference)

            # Extract market insights
            market_insights = self._extract_market_insights(raw_report)

            # Extract sources
            sources_cited = self._extract_sources(raw_report)

            # Estimate token usage
            token_usage = self._estimate_token_usage(original_prompt, raw_report)

        except Exception as e:
            logger.warning(f"Error parsing research results: {str(e)}")

        return DeepResearchResult(
            interaction_id=interaction_id,
            status=status,
            raw_report=raw_report,
            extracted_sales=extracted_sales,
            market_insights=market_insights,
            sources_cited=sources_cited,
            research_duration_seconds=duration,
            timestamp=datetime.now(),
            token_usage=token_usage,
            original_prompt=original_prompt
        )

    def _estimate_token_usage(self, prompt: str, response: str) -> TokenUsage:
        """
        Estimate token usage for a Deep Research run.

        Uses the Gemini token counting API for the prompt, and estimates
        response tokens based on the report length.

        Note: This is an approximation. Deep Research involves multiple
        intermediate reasoning steps that we cannot directly count.
        The actual token usage (and cost) is likely higher due to:
        - Planning/reasoning tokens
        - Multiple search queries
        - Intermediate content processing
        """
        usage = TokenUsage()

        try:
            # Try to use the official token counting API for prompt
            try:
                # Use the models.count_tokens endpoint
                count_result = self.client.models.count_tokens(
                    model="gemini-2.0-pro",  # Base model for token counting
                    contents=prompt
                )
                usage.prompt_tokens = count_result.total_tokens
                logger.debug(f"Prompt tokens (API): {usage.prompt_tokens}")
            except Exception as e:
                # Fallback: estimate ~4 chars per token (rough approximation)
                usage.prompt_tokens = len(prompt) // 4
                logger.debug(f"Prompt tokens (estimated): {usage.prompt_tokens}, error: {e}")

            # Count response tokens
            try:
                count_result = self.client.models.count_tokens(
                    model="gemini-2.0-pro",
                    contents=response
                )
                usage.response_tokens = count_result.total_tokens
                logger.debug(f"Response tokens (API): {usage.response_tokens}")
            except Exception as e:
                # Fallback: estimate ~4 chars per token
                usage.response_tokens = len(response) // 4
                logger.debug(f"Response tokens (estimated): {usage.response_tokens}, error: {e}")

            usage.total_tokens = usage.prompt_tokens + usage.response_tokens
            usage.calculate_cost()

            logger.info(f"Token usage estimate: {usage.prompt_tokens} prompt + "
                       f"{usage.response_tokens} response = {usage.total_tokens} total, "
                       f"~${usage.estimated_cost_usd:.4f}")

            # Note: The actual cost is likely 2-5x higher due to intermediate reasoning
            logger.info("Note: Actual cost may be higher due to intermediate reasoning tokens")

        except Exception as e:
            logger.warning(f"Could not estimate token usage: {e}")

        return usage

    def _extract_sales_from_report(
        self,
        report: str,
        brand: str,
        reference: str
    ) -> List[WatchSale]:
        """Extract structured sales and asking price data from the research report."""
        all_records = []

        # Split report into sections to identify table context
        sections = report.split('##')

        for section in sections:
            section_lower = section.lower()

            # Determine price type based on section header
            if any(term in section_lower for term in ['completed sale', 'sales data', 'sold', 'auction result']):
                price_type = "Sold"
            elif any(term in section_lower for term in ['current listing', 'asking price', 'active listing', 'for sale']):
                price_type = "Asking"
            else:
                price_type = "Unknown"

            # Look for markdown table patterns in this section
            table_pattern = r'\|[^\n]+\|[^\n]+\|[^\n]+\|[^\n]+\|'
            table_rows = re.findall(table_pattern, section)

            for row in table_rows:
                # Skip header/separator rows
                if '---' in row or 'Date' in row.split('|')[1] if len(row.split('|')) > 1 else False:
                    continue
                # Also skip rows that look like headers
                if 'Price' in row and ('USD' in row or 'Condition' in row):
                    continue

                cells = [c.strip() for c in row.split('|') if c.strip()]
                if len(cells) >= 4:
                    try:
                        record = self._parse_table_row_to_sale(cells, brand, reference, price_type)
                        if record:
                            all_records.append(record)
                    except Exception as e:
                        logger.debug(f"Could not parse row: {cells}, error: {e}")

        # Count by type
        sold_count = sum(1 for r in all_records if r.price_type == "Sold")
        asking_count = sum(1 for r in all_records if r.price_type == "Asking")
        unknown_count = sum(1 for r in all_records if r.price_type == "Unknown")

        logger.info(f"Extracted {len(all_records)} records from Deep Research report "
                   f"({sold_count} sold, {asking_count} asking, {unknown_count} unknown)")
        return all_records

    def _parse_table_row_to_sale(
        self,
        cells: List[str],
        brand: str,
        reference: str,
        price_type: str = "Unknown"
    ) -> Optional[WatchSale]:
        """Parse a table row into a WatchSale object."""
        from dateutil import parser as date_parser

        try:
            # Expected: Date, Price, Condition, Source, Notes
            date_str = cells[0] if len(cells) > 0 else ""
            price_str = cells[1] if len(cells) > 1 else ""
            condition = cells[2] if len(cells) > 2 else "Unknown"
            source = cells[3] if len(cells) > 3 else "Deep Research"
            notes = cells[4] if len(cells) > 4 else ""

            # Parse price
            price_clean = re.sub(r'[^\d.]', '', price_str)
            if not price_clean:
                return None
            price = float(price_clean)

            # Parse date
            sale_date = None
            if date_str and date_str not in ['N/A', '-', 'Unknown']:
                try:
                    sale_date = date_parser.parse(date_str)
                except:
                    pass

            # Categorize condition
            condition_category = self._categorize_condition(condition)

            return WatchSale(
                brand=brand,
                reference=reference,
                price=price,
                currency="USD",
                price_usd=price,
                price_type=price_type,
                sale_date=sale_date,
                condition=condition,
                condition_category=condition_category,
                description=notes,
                source=source,
                source_type="Other",
                url="",
                is_special_edition=False,
                variant_details="",
                scraped_at=datetime.now(),
                validated=False,
                raw_data={"cells": cells, "source": "deep_research", "price_type": price_type}
            )
        except Exception as e:
            logger.debug(f"Error parsing table row: {e}")
            return None

    def _categorize_condition(self, condition: str) -> str:
        """Categorize condition string into standard categories."""
        condition_lower = condition.lower()

        if any(term in condition_lower for term in ['bnib', 'brand new', 'new in box']):
            return "BNIB"
        elif any(term in condition_lower for term in ['unworn', 'never worn', 'mint']):
            return "Unworn"
        elif any(term in condition_lower for term in ['excellent', 'lightly', 'light wear']):
            return "Lightly Worn"
        elif any(term in condition_lower for term in ['good', 'moderate', 'fair']):
            return "Moderately Worn"
        elif any(term in condition_lower for term in ['poor', 'heavy', 'worn']):
            return "Heavily Worn"
        else:
            return "Unknown"

    def _extract_market_insights(self, report: str) -> Dict[str, Any]:
        """Extract market insights from the report."""
        insights = {}

        # Try to extract average sold price
        avg_sold_pattern = r'[Aa]verage\s*[Ss]old\s*[Pp]rice[:\s]*\$?([\d,]+)'
        avg_sold_match = re.search(avg_sold_pattern, report)
        if avg_sold_match:
            insights['average_sold_price'] = float(avg_sold_match.group(1).replace(',', ''))
        else:
            # Fall back to generic average price
            avg_pattern = r'[Aa]verage\s*[Pp]rice[:\s]*\$?([\d,]+)'
            avg_match = re.search(avg_pattern, report)
            if avg_match:
                insights['average_sold_price'] = float(avg_match.group(1).replace(',', ''))

        # Try to extract median sold price
        median_sold_pattern = r'[Mm]edian\s*[Ss]old\s*[Pp]rice[:\s]*\$?([\d,]+)'
        median_sold_match = re.search(median_sold_pattern, report)
        if median_sold_match:
            insights['median_sold_price'] = float(median_sold_match.group(1).replace(',', ''))
        else:
            median_pattern = r'[Mm]edian\s*[Pp]rice[:\s]*\$?([\d,]+)'
            median_match = re.search(median_pattern, report)
            if median_match:
                insights['median_sold_price'] = float(median_match.group(1).replace(',', ''))

        # Try to extract average asking price
        avg_asking_pattern = r'[Aa]verage\s*[Aa]sking\s*[Pp]rice[:\s]*\$?([\d,]+)'
        avg_asking_match = re.search(avg_asking_pattern, report)
        if avg_asking_match:
            insights['average_asking_price'] = float(avg_asking_match.group(1).replace(',', ''))

        # Try to extract asking price range
        asking_range_pattern = r'[Aa]sking\s*[Pp]rice\s*[Rr]ange[:\s]*\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)'
        asking_range_match = re.search(asking_range_pattern, report)
        if asking_range_match:
            insights['asking_price_min'] = float(asking_range_match.group(1).replace(',', ''))
            insights['asking_price_max'] = float(asking_range_match.group(2).replace(',', ''))

        # Try to extract sold price range
        sold_range_pattern = r'[Ss]old\s*[Pp]rice\s*[Rr]ange[:\s]*\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)'
        sold_range_match = re.search(sold_range_pattern, report)
        if sold_range_match:
            insights['sold_price_min'] = float(sold_range_match.group(1).replace(',', ''))
            insights['sold_price_max'] = float(sold_range_match.group(2).replace(',', ''))

        # Try to extract asking vs sold spread
        spread_pattern = r'[Aa]sking\s*vs\s*[Ss]old\s*[Ss]pread[:\s]*([\d.]+)%'
        spread_match = re.search(spread_pattern, report)
        if spread_match:
            insights['asking_vs_sold_spread_pct'] = float(spread_match.group(1))

        # Try to extract trend
        if 'increasing' in report.lower():
            insights['trend'] = 'increasing'
        elif 'decreasing' in report.lower() or 'declining' in report.lower():
            insights['trend'] = 'decreasing'
        elif 'stable' in report.lower():
            insights['trend'] = 'stable'

        return insights

    def _extract_sources(self, report: str) -> List[str]:
        """Extract cited sources from the report."""
        sources = []

        # Look for URLs
        url_pattern = r'https?://[^\s\)\]\>]+'
        urls = re.findall(url_pattern, report)
        sources.extend(urls[:20])  # Limit to 20 sources

        # Look for known source names
        known_sources = [
            "Christie's", "Sotheby's", "Phillips", "Chrono24", "WatchBox",
            "Hodinkee", "Bob's Watches", "Watchfinder", "Crown & Caliber"
        ]
        for source in known_sources:
            if source.lower() in report.lower():
                sources.append(source)

        return list(set(sources))


@dataclass
class ComparisonResult:
    """Result of comparing Deep Research with traditional scraping."""
    brand: str
    reference: str

    # Deep Research metrics
    deep_research_sales_count: int = 0
    deep_research_avg_price: float = 0.0
    deep_research_sources: List[str] = field(default_factory=list)
    deep_research_duration: float = 0.0

    # Traditional scraper metrics
    scraper_sales_count: int = 0
    scraper_avg_price: float = 0.0
    scraper_sources: List[str] = field(default_factory=list)
    scraper_duration: float = 0.0

    # Comparison metrics
    price_difference_pct: float = 0.0
    sales_overlap_count: int = 0
    unique_to_deep_research: int = 0
    unique_to_scraper: int = 0
    complementary_value: str = ""  # "high", "medium", "low"
    recommendation: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'brand': self.brand,
            'reference': self.reference,
            'deep_research': {
                'sales_count': self.deep_research_sales_count,
                'avg_price': self.deep_research_avg_price,
                'sources': self.deep_research_sources,
                'duration_seconds': self.deep_research_duration
            },
            'scraper': {
                'sales_count': self.scraper_sales_count,
                'avg_price': self.scraper_avg_price,
                'sources': self.scraper_sources,
                'duration_seconds': self.scraper_duration
            },
            'comparison': {
                'price_difference_pct': self.price_difference_pct,
                'sales_overlap_count': self.sales_overlap_count,
                'unique_to_deep_research': self.unique_to_deep_research,
                'unique_to_scraper': self.unique_to_scraper,
                'complementary_value': self.complementary_value,
                'recommendation': self.recommendation
            }
        }


class ResearchComparator:
    """Compares Deep Research results with traditional scraping methodology."""

    def __init__(self, config: Optional[Config] = None):
        """Initialize the comparator."""
        self.config = config

    def compare(
        self,
        deep_result: DeepResearchResult,
        scraper_analysis: WatchAnalysis,
        scraper_duration: float = 0.0
    ) -> ComparisonResult:
        """
        Compare Deep Research results with traditional scraper results.

        Args:
            deep_result: Results from Gemini Deep Research
            scraper_analysis: Results from traditional WatchResearchApp
            scraper_duration: How long the scraper took

        Returns:
            ComparisonResult with detailed comparison metrics
        """
        brand = scraper_analysis.brand
        reference = scraper_analysis.reference

        # Calculate Deep Research metrics
        dr_sales = deep_result.extracted_sales
        dr_avg = sum(s.price_usd for s in dr_sales) / len(dr_sales) if dr_sales else 0.0

        # Calculate scraper metrics
        sc_sales = scraper_analysis.sales_data
        sc_avg = scraper_analysis.overall_statistics.average

        # Calculate price difference
        price_diff_pct = 0.0
        if sc_avg > 0 and dr_avg > 0:
            price_diff_pct = ((dr_avg - sc_avg) / sc_avg) * 100

        # Estimate overlap (by matching similar prices and dates)
        overlap = self._estimate_overlap(dr_sales, sc_sales)

        # Calculate unique counts
        unique_dr = len(dr_sales) - overlap
        unique_sc = len(sc_sales) - overlap

        # Determine complementary value
        complementary_value = self._assess_complementary_value(
            dr_sales_count=len(dr_sales),
            sc_sales_count=len(sc_sales),
            unique_dr=unique_dr,
            unique_sc=unique_sc
        )

        # Generate recommendation
        recommendation = self._generate_recommendation(
            dr_count=len(dr_sales),
            sc_count=len(sc_sales),
            price_diff_pct=price_diff_pct,
            complementary_value=complementary_value,
            dr_duration=deep_result.research_duration_seconds,
            sc_duration=scraper_duration
        )

        return ComparisonResult(
            brand=brand,
            reference=reference,
            deep_research_sales_count=len(dr_sales),
            deep_research_avg_price=dr_avg,
            deep_research_sources=deep_result.sources_cited,
            deep_research_duration=deep_result.research_duration_seconds,
            scraper_sales_count=len(sc_sales),
            scraper_avg_price=sc_avg,
            scraper_sources=scraper_analysis.data_sources,
            scraper_duration=scraper_duration,
            price_difference_pct=price_diff_pct,
            sales_overlap_count=overlap,
            unique_to_deep_research=unique_dr,
            unique_to_scraper=unique_sc,
            complementary_value=complementary_value,
            recommendation=recommendation
        )

    def _estimate_overlap(
        self,
        dr_sales: List[WatchSale],
        sc_sales: List[WatchSale]
    ) -> int:
        """Estimate overlap between two sets of sales data."""
        if not dr_sales or not sc_sales:
            return 0

        overlap = 0
        tolerance = 0.05  # 5% price tolerance

        for dr_sale in dr_sales:
            for sc_sale in sc_sales:
                # Check if prices are within tolerance
                if dr_sale.price_usd > 0 and sc_sale.price_usd > 0:
                    diff = abs(dr_sale.price_usd - sc_sale.price_usd) / sc_sale.price_usd
                    if diff <= tolerance:
                        # Check if dates are close (within 7 days) if both have dates
                        if dr_sale.sale_date and sc_sale.sale_date:
                            date_diff = abs((dr_sale.sale_date - sc_sale.sale_date).days)
                            if date_diff <= 7:
                                overlap += 1
                                break
                        elif not dr_sale.sale_date or not sc_sale.sale_date:
                            # If no date, just use price match
                            overlap += 1
                            break

        return overlap

    def _assess_complementary_value(
        self,
        dr_sales_count: int,
        sc_sales_count: int,
        unique_dr: int,
        unique_sc: int
    ) -> str:
        """Assess how complementary the two methods are."""
        total_unique = unique_dr + unique_sc
        total_sales = dr_sales_count + sc_sales_count

        if total_sales == 0:
            return "unknown"

        unique_ratio = total_unique / total_sales

        if unique_ratio >= 0.6:
            return "high"
        elif unique_ratio >= 0.3:
            return "medium"
        else:
            return "low"

    def _generate_recommendation(
        self,
        dr_count: int,
        sc_count: int,
        price_diff_pct: float,
        complementary_value: str,
        dr_duration: float,
        sc_duration: float
    ) -> str:
        """Generate a recommendation based on comparison."""
        recommendations = []

        if complementary_value == "high":
            recommendations.append(
                "HIGH COMPLEMENTARY VALUE: Use both methods together for most comprehensive data."
            )
        elif complementary_value == "medium":
            recommendations.append(
                "MODERATE COMPLEMENTARY VALUE: Both methods provide some unique data."
            )
        else:
            recommendations.append(
                "LOW COMPLEMENTARY VALUE: Methods return similar data; choose one based on needs."
            )

        if dr_count > sc_count * 1.5:
            recommendations.append(
                f"Deep Research found {dr_count} vs {sc_count} sales - may have better reach."
            )
        elif sc_count > dr_count * 1.5:
            recommendations.append(
                f"Traditional scraper found {sc_count} vs {dr_count} sales - more granular data."
            )

        if abs(price_diff_pct) > 10:
            direction = "higher" if price_diff_pct > 0 else "lower"
            recommendations.append(
                f"Price difference of {price_diff_pct:.1f}%: Deep Research prices are {direction}."
            )

        if dr_duration > sc_duration * 3:
            recommendations.append(
                f"Deep Research took {dr_duration:.0f}s vs {sc_duration:.0f}s - slower but more comprehensive."
            )

        return " | ".join(recommendations)


def run_deep_research(
    brand: str,
    reference: str,
    api_key: Optional[str] = None,
    compare_with_scraper: bool = False,
    export_json: bool = True,
    verbose: bool = False
) -> DeepResearchResult:
    """
    Run Deep Research on a watch and optionally compare with traditional scraper.

    Args:
        brand: Watch brand name
        reference: Watch reference number
        api_key: Optional Gemini API key
        compare_with_scraper: Whether to also run traditional scraper for comparison
        export_json: Whether to export results to JSON
        verbose: Enable verbose output

    Returns:
        DeepResearchResult with research findings
    """
    import json
    from pathlib import Path

    # Set up logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=log_level, format='%(asctime)s - %(levelname)s - %(message)s')

    print(f"\n{'='*60}")
    print(f"🔬 GEMINI DEEP RESEARCH: {brand} {reference}")
    print(f"{'='*60}\n")

    # Run Deep Research
    researcher = GeminiDeepResearcher(api_key=api_key)

    print("Starting Deep Research (this may take several minutes)...")
    deep_result = researcher.research_watch(brand, reference)

    # Count records by type
    sold_count = sum(1 for r in deep_result.extracted_sales if r.price_type == "Sold")
    asking_count = sum(1 for r in deep_result.extracted_sales if r.price_type == "Asking")
    unknown_count = sum(1 for r in deep_result.extracted_sales if r.price_type == "Unknown")

    print(f"\n✅ Deep Research completed in {deep_result.research_duration_seconds:.1f} seconds")
    print(f"   - Total records extracted: {len(deep_result.extracted_sales)}")
    print(f"     • Completed sales: {sold_count}")
    print(f"     • Asking prices: {asking_count}")
    if unknown_count > 0:
        print(f"     • Unknown type: {unknown_count}")
    print(f"   - Found {len(deep_result.sources_cited)} sources")

    if deep_result.market_insights:
        print(f"\n📊 Market Insights:")
        for key, value in deep_result.market_insights.items():
            if isinstance(value, float):
                print(f"   - {key}: ${value:,.0f}" if 'price' in key.lower() else f"   - {key}: {value}")
            else:
                print(f"   - {key}: {value}")

    if deep_result.token_usage:
        print(f"\n💰 Token Usage & Cost Estimate:")
        print(f"   - Prompt tokens: {deep_result.token_usage.prompt_tokens:,}")
        print(f"   - Response tokens: {deep_result.token_usage.response_tokens:,}")
        print(f"   - Total tokens: {deep_result.token_usage.total_tokens:,}")
        print(f"   - Estimated cost: ${deep_result.token_usage.estimated_cost_usd:.4f}")
        print(f"   ⚠️  Note: Actual cost may be 2-5x higher due to intermediate reasoning")

    # Export results
    if export_json:
        exports_dir = Path("exports")
        exports_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{brand}_{reference}_deep_research_{timestamp}.json"
        filepath = exports_dir / filename

        with open(filepath, 'w') as f:
            json.dump(deep_result.to_dict(), f, indent=2)

        print(f"\n📁 Results exported to: {filepath}")

    # Optionally compare with traditional scraper
    if compare_with_scraper:
        print(f"\n{'='*60}")
        print("🔄 Running traditional scraper for comparison...")
        print(f"{'='*60}\n")

        try:
            from .main import WatchResearchApp

            scraper_start = time.time()
            app = WatchResearchApp()
            analysis = app.research_watch(brand, reference, display_console=False)
            scraper_duration = time.time() - scraper_start

            # Compare results
            comparator = ResearchComparator()
            comparison = comparator.compare(deep_result, analysis, scraper_duration)

            print(f"\n📊 COMPARISON RESULTS:")
            print(f"   Deep Research: {comparison.deep_research_sales_count} sales, avg ${comparison.deep_research_avg_price:,.0f}")
            print(f"   Traditional:   {comparison.scraper_sales_count} sales, avg ${comparison.scraper_avg_price:,.0f}")
            print(f"   Price diff:    {comparison.price_difference_pct:+.1f}%")
            print(f"   Overlap:       {comparison.sales_overlap_count} sales")
            print(f"   Unique to DR:  {comparison.unique_to_deep_research} sales")
            print(f"   Unique to Sc:  {comparison.unique_to_scraper} sales")
            print(f"\n📋 Recommendation: {comparison.recommendation}")

            # Export comparison
            if export_json:
                comp_filename = f"{brand}_{reference}_comparison_{timestamp}.json"
                comp_filepath = exports_dir / comp_filename

                with open(comp_filepath, 'w') as f:
                    json.dump(comparison.to_dict(), f, indent=2)

                print(f"📁 Comparison exported to: {comp_filepath}")

        except Exception as e:
            print(f"⚠️ Could not run comparison: {str(e)}")

    # Print raw report excerpt
    print(f"\n{'='*60}")
    print("📄 RESEARCH REPORT (first 2000 chars):")
    print(f"{'='*60}\n")
    print(deep_result.raw_report[:2000])
    if len(deep_result.raw_report) > 2000:
        print(f"\n... (truncated, full report in exported JSON)")

    return deep_result


def main():
    """Command-line interface for Deep Research."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Gemini Deep Research for Watch Sales',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Basic research
  python -m watch_research.deep_research --brand "Rolex" --reference "126500"

  # Compare with traditional scraper
  python -m watch_research.deep_research --brand "Patek Philippe" --reference "5712R" --compare

  # Verbose output
  python -m watch_research.deep_research --brand "Omega" --reference "310.30.42.50.01.001" -v
        '''
    )

    parser.add_argument(
        '--brand',
        type=str,
        required=True,
        help='Watch brand name (e.g., "Rolex", "Patek Philippe")'
    )

    parser.add_argument(
        '--reference',
        type=str,
        required=True,
        help='Watch reference number (e.g., "126500", "5712R")'
    )

    parser.add_argument(
        '--api-key',
        type=str,
        help='Gemini API key (overrides GEMINI_API_KEY env var)'
    )

    parser.add_argument(
        '--compare',
        action='store_true',
        help='Also run traditional scraper and compare results'
    )

    parser.add_argument(
        '--no-export',
        action='store_true',
        help='Do not export results to JSON'
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )

    args = parser.parse_args()

    try:
        run_deep_research(
            brand=args.brand,
            reference=args.reference,
            api_key=args.api_key,
            compare_with_scraper=args.compare,
            export_json=not args.no_export,
            verbose=args.verbose
        )
        return 0

    except KeyboardInterrupt:
        print("\n⚠️ Operation cancelled by user")
        return 1

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        return 1


if __name__ == '__main__':
    import sys
    sys.exit(main())
