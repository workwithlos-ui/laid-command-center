#!/usr/bin/env python3
"""
LAID Daily Research Bot , AI News Scanner & Content Drafter
Scans AI news sources, scores by business relevance, drafts content pieces.

Usage:
  python research_bot.py --run          # Run once, scan and draft
  python research_bot.py --sources      # List all monitored sources
  python research_bot.py --review       # Review queued drafts
  python research_bot.py --approve ID   # Approve a draft for import
  python research_bot.py --reject ID    # Reject a draft

Setup:
  pip install requests beautifulsoup4 feedparser python-dotenv
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse

# Try to import optional dependencies
try:
    import requests
    from bs4 import BeautifulSoup
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("WARNING: requests/beautifulsoup4 not installed. Web scraping disabled.")
    print("Run: pip install requests beautifulsoup4 feedparser")

try:
    import feedparser
    HAS_FEEDPARSER = True
except ImportError:
    HAS_FEEDPARSER = False

# ─── CONFIGURATION ───
SOURCES = {
    "OpenAI Blog": {
        "url": "https://openai.com/blog",
        "type": "web",
        "selector": "article, .post, .blog-post",
        "priority": 10
    },
    "Anthropic News": {
        "url": "https://www.anthropic.com/news",
        "type": "web",
        "selector": "article, .news-item",
        "priority": 10
    },
    "Google AI Blog": {
        "url": "https://blog.google/technology/ai/",
        "type": "web",
        "selector": "article",
        "priority": 10
    },
    "Google Workspace Updates": {
        "url": "https://workspaceupdates.googleblog.com/",
        "type": "rss",
        "feed": "https://workspaceupdates.googleblog.com/feeds/posts/default",
        "priority": 9
    },
    "AI Google Dev": {
        "url": "https://ai.google.dev/gemini-api/docs/changelog",
        "type": "web",
        "selector": ".changelog-entry, article",
        "priority": 9
    },
    "TechCrunch AI": {
        "url": "https://techcrunch.com/category/artificial-intelligence/",
        "type": "rss",
        "feed": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "priority": 8
    },
    "The Verge AI": {
        "url": "https://www.theverge.com/ai-artificial-intelligence",
        "type": "rss",
        "feed": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml",
        "priority": 8
    },
    "VentureBeat AI": {
        "url": "https://venturebeat.com/ai/",
        "type": "rss",
        "feed": "https://venturebeat.com/category/ai/feed/",
        "priority": 7
    },
    "Mistral AI": {
        "url": "https://mistral.ai/news",
        "type": "web",
        "selector": "article",
        "priority": 9
    },
    "xAI / Grok": {
        "url": "https://x.ai/blog",
        "type": "web",
        "selector": "article",
        "priority": 9
    },
    "Notion Blog": {
        "url": "https://www.notion.so/blog",
        "type": "web",
        "selector": "article",
        "priority": 8
    },
    "Zapier Blog": {
        "url": "https://zapier.com/blog/ai/",
        "type": "rss",
        "feed": "https://zapier.com/blog/feed/",
        "priority": 7
    },
    "Figma Blog": {
        "url": "https://www.figma.com/blog/",
        "type": "web",
        "selector": "article",
        "priority": 7
    },
    "Replit Blog": {
        "url": "https://blog.replit.com/",
        "type": "web",
        "selector": "article, .post",
        "priority": 7
    },
    "Product Hunt AI": {
        "url": "https://www.producthunt.com/categories/artificial-intelligence",
        "type": "web",
        "selector": ".post-item",
        "priority": 6
    }
}

# Business relevance keywords (higher weight = more relevant to $500K-$10M owners)
RELEVANCE_KEYWORDS = {
    # High value (weight 3)
    "automation": 3, "workflow": 3, "leads": 3, "sales": 3, "revenue": 3,
    "cost": 3, "savings": 3, "roi": 3, "pricing": 3, "free tier": 3,
    "no-code": 3, "integration": 3, "api": 3, "agent": 3,

    # Medium value (weight 2)
    "enterprise": 2, "business": 2, "productivity": 2, "efficiency": 2,
    "marketing": 2, "analytics": 2, "dashboard": 2, "report": 2,
    "voice": 2, "video": 2, "document": 2, "spreadsheet": 2,

    # Low value (weight 1)
    "update": 1, "launch": 1, "release": 1, "new feature": 1,
    "model": 1, "ai": 1, "gpt": 1, "claude": 1, "gemini": 1,
}

# Keywords that indicate NOT business relevant
NOISE_KEYWORDS = [
    "research paper", "arxiv", "benchmark", "academic", "phd",
    "theoretical", "open source model release", "training data",
    "gpu", "compute cluster", "data center", "llama 4",
    "parameter count", "token", "embedding", "vector"
]

# ─── SCORING ENGINE ───
def score_relevance(title, summary=""):
    """Score a news item 1-10 by business relevance for $500K-$10M owners."""
    text = (title + " " + summary).lower()
    score = 5  # Base score

    # Add points for relevance keywords
    for keyword, weight in RELEVANCE_KEYWORDS.items():
        if keyword in text:
            score += weight

    # Subtract for noise/academic keywords
    for noise in NOISE_KEYWORDS:
        if noise in text:
            score -= 2

    # Bonus for money-related terms
    money_terms = ["$", "pricing", "cost", "free", "discount", "save"]
    for term in money_terms:
        if term in text:
            score += 1
            break

    # Bonus for action-oriented terms
    action_terms = ["how to", "guide", "tutorial", "setup", "build", "create"]
    for term in action_terms:
        if term in text:
            score += 1
            break

    return max(1, min(10, score))

def categorize_story(title, summary=""):
    """Categorize a story into content keyword buckets."""
    text = (title + " " + summary).lower()

    categories = []

    if any(w in text for w in ["ad", "campaign", "google ads", "ppc", "cpc", "ai max"]):
        categories.append("LEADS")
    if any(w in text for w in ["automation", "workflow", "zapier", "notion agent", "custom agent"]):
        categories.append("AUTOMATE")
    if any(w in text for w in ["content", "generate", "document", "proposal", "file", "spreadsheet"]):
        categories.append("CREATE")
    if any(w in text for w in ["code", "build app", "no-code", "replit", "lovable", "developer"]):
        categories.append("CODE")
    if any(w in text for w in ["research", "webhook", "mcp", "intelligence", "monitor", "scan"]):
        categories.append("RESEARCH")
    if any(w in text for w in ["voice", "audio", "speak", "ivr", "narration", "clone"]):
        categories.append("TALK")
    if any(w in text for w in ["ad creative", "copy", "meet", "custom instruction", "brand voice"]):
        categories.append("ADS")
    if any(w in text for w in ["security", "vulnerability", "team", "cost tracking", "developer tool"]):
        categories.append("TEAM")
    if any(w in text for w in ["video", "vids", "figma", "dashboard", "free tier", "pricing"]):
        categories.append("MONEY")

    return categories if categories else ["LAID"]

# ─── CONTENT DRAFTER ───
def draft_content_piece(story, tone="pro"):
    """Draft a content piece from a news story using v7 templates."""

    title = story["title"]
    source = story["source_name"]
    date = story.get("date", datetime.now().strftime("%B %d, %Y"))
    url = story.get("url", "")
    score = story.get("score", 5)
    categories = story.get("categories", ["LAID"])

    # Pick primary keyword
    keyword = categories[0]

    if tone == "beginner":
        hook_templates = {
            "LEADS": f"Want more leads but hate marketing jargon? {title.split(',')[0].strip()} makes it simple.",
            "AUTOMATE": f"What if {source} could handle your busy work while you focus on clients? Here's how.",
            "CREATE": f"Need professional documents fast? This new feature does the formatting for you.",
            "CODE": f"Always wanted an app for your business? Now you can build one without coding.",
            "RESEARCH": f"Your competitor probably knows this already. Here's how to catch up in 20 minutes.",
            "TALK": f"What if your phone, videos, and ads all sounded like YOU? Here's the beginner guide.",
            "ADS": f"Writing ads is hard. This tool writes them for you using your actual sales conversations.",
            "TEAM": f"Worried about security? This free tool scans your business and finds problems automatically.",
            "MONEY": f"Two free tools just dropped. Together they save business owners $3,000+/month.",
            "LAID": f"Want AI to actually help your business grow? Start here."
        }
    else:
        hook_templates = {
            "LEADS": f"{title.split(',')[0].strip()} , Here's how to use it to cut lead costs 30%.",
            "AUTOMATE": f"{title.split(',')[0].strip()} , 3 automations that replace $3,500/mo of manual work.",
            "CREATE": f"{title.split(',')[0].strip()} , How to replace 2 hours of formatting with 4 minutes.",
            "CODE": f"{title.split(',')[0].strip()} , Built my first app in 45 minutes. $7 total.",
            "RESEARCH": f"{title.split(',')[0].strip()} , Your competitor's AI is doing this automatically already.",
            "TALK": f"{title.split(',')[0].strip()} , $800 voiceover projects now cost $0.",
            "ADS": f"{title.split(',')[0].strip()} , 20 ad variations in 20 minutes using real customer language.",
            "TEAM": f"{title.split(',')[0].strip()} , Found 14 vulnerabilities my team missed. Free.",
            "MONEY": f"{title.split(',')[0].strip()} , $3,688/month in tool savings from 2 updates.",
            "LAID": f"{title.split(',')[0].strip()} , Stop renting AI. Own it."
        }

    hook = hook_templates.get(keyword, f"{title} , Here's what business owners need to know.")

    return {
        "id": f"draft_{datetime.now().strftime('%Y%m%d')}_{hash(title) % 10000:04d}",
        "title": title,
        "hook": hook,
        "source": source,
        "url": url,
        "date": date,
        "relevance_score": score,
        "keyword": keyword,
        "tone": tone,
        "categories": categories,
        "status": "draft",
        "body_preview": f"**Hook:** {hook}\n\n**Source:** {source} , {date}\n**Relevance Score:** {score}/10\n**Categories:** {', '.join(categories)}\n\n[Full content to be expanded after approval]",
        "created_at": datetime.now().isoformat()
    }

# ─── SCRAPING ENGINE ───
def scrape_web_source(name, config):
    """Scrape a web-based news source."""
    stories = []
    if not HAS_REQUESTS:
        return stories

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(config["url"], headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")

        # Try to find article elements
        articles = soup.select(config["selector"])

        for article in articles[:10]:  # Top 10 from each source
            title_el = article.select_one("h1, h2, h3, .title, .headline")
            link_el = article.select_one("a")
            summary_el = article.select_one("p, .summary, .description")

            title = title_el.get_text(strip=True) if title_el else "Unknown"
            link = urljoin(config["url"], link_el["href"]) if link_el and link_el.has_attr("href") else config["url"]
            summary = summary_el.get_text(strip=True)[:200] if summary_el else ""

            if len(title) > 10:  # Filter out empty/junk titles
                score = score_relevance(title, summary)
                categories = categorize_story(title, summary)
                stories.append({
                    "title": title,
                    "url": link,
                    "source_name": name,
                    "date": datetime.now().strftime("%B %d, %Y"),
                    "summary": summary,
                    "score": score,
                    "categories": categories
                })
    except Exception as e:
        print(f"  [ERROR] {name}: {str(e)[:100]}")

    return stories

def scrape_rss_source(name, config):
    """Scrape an RSS feed."""
    stories = []
    if not HAS_FEEDPARSER:
        return stories

    try:
        feed = feedparser.parse(config["feed"])
        for entry in feed.entries[:10]:  # Top 10 from each feed
            title = entry.get("title", "Unknown")
            summary = entry.get("summary", entry.get("description", ""))[:300]
            link = entry.get("link", config["url"])
            published = entry.get("published", datetime.now().strftime("%B %d, %Y"))

            score = score_relevance(title, summary)
            categories = categorize_story(title, summary)
            stories.append({
                "title": title,
                "url": link,
                "source_name": name,
                "date": published,
                "summary": summary,
                "score": score,
                "categories": categories
            })
    except Exception as e:
        print(f"  [ERROR] RSS {name}: {str(e)[:100]}")

    return stories

# ─── QUEUE MANAGEMENT ───
def load_queue():
    """Load the content queue from disk."""
    queue_path = os.path.join(os.path.dirname(__file__), "research_queue.json")
    if os.path.exists(queue_path):
        with open(queue_path, "r") as f:
            return json.load(f)
    return {"drafts": [], "approved": [], "rejected": [], "last_run": None}

def save_queue(queue):
    """Save the content queue to disk."""
    queue_path = os.path.join(os.path.dirname(__file__), "research_queue.json")
    with open(queue_path, "w") as f:
        json.dump(queue, f, indent=2)

def load_existing_content():
    """Load existing content to avoid duplicates."""
    content_path = os.path.join(os.path.dirname(__file__), "src", "data", "laid_content.json")
    if os.path.exists(content_path):
        with open(content_path, "r") as f:
            data = json.load(f)
            return set(item["title"] for item in data)
    return set()

# ─── MAIN COMMANDS ───
def cmd_run():
    """Execute a full research run."""
    print("\n" + "=" * 60)
    print("LAID DAILY RESEARCH BOT , Scanning AI News")
    print("=" * 60 + "\n")

    queue = load_queue()
    existing_titles = load_existing_content()
    all_stories = []

    # Scan all sources
    for name, config in SOURCES.items():
        print(f"Scanning: {name}...")

        if config["type"] == "rss" and HAS_FEEDPARSER:
            stories = scrape_rss_source(name, config)
        elif config["type"] == "web" and HAS_REQUESTS:
            stories = scrape_web_source(name, config)
        else:
            stories = []

        # Filter: only high-relevance stories we haven't seen
        new_stories = [
            s for s in stories 
            if s["score"] >= 6 and s["title"] not in existing_titles
        ]

        all_stories.extend(new_stories)
        print(f"  Found {len(stories)} stories, {len(new_stories)} new high-relevance")

    # Sort by score
    all_stories.sort(key=lambda x: x["score"], reverse=True)

    # Take top 5 stories
    top_stories = all_stories[:5]

    print(f"\n{'=' * 60}")
    print(f"TOP {len(top_stories)} STORIES TODAY:")
    print("=" * 60)

    new_drafts = []
    for i, story in enumerate(top_stories, 1):
        print(f"\n  #{i} [Score: {story['score']}/10] {story['title']}")
        print(f"     Source: {story['source_name']}")
        print(f"     Categories: {', '.join(story['categories'])}")
        print(f"     URL: {story['url'][:80]}...")

        # Draft both tones
        pro_draft = draft_content_piece(story, tone="pro")
        beg_draft = draft_content_piece(story, tone="beginner")

        new_drafts.extend([pro_draft, beg_draft])

    # Add to queue
    queue["drafts"].extend(new_drafts)
    queue["last_run"] = datetime.now().isoformat()
    save_queue(queue)

    print(f"\n{'=' * 60}")
    print(f"QUEUED: {len(new_drafts)} new drafts ({len(top_stories)} stories × 2 tones)")
    print(f"Queue path: research_queue.json")
    print(f"Review with: python research_bot.py --review")
    print("=" * 60 + "\n")

def cmd_review():
    """Review queued drafts."""
    queue = load_queue()

    if not queue["drafts"]:
        print("\nNo drafts in queue. Run: python research_bot.py --run")
        return

    print("\n" + "=" * 60)
    print("CONTENT QUEUE , Drafts Awaiting Review")
    print("=" * 60 + "\n")

    for i, draft in enumerate(queue["drafts"], 1):
        status_icon = "🟡" if draft["status"] == "draft" else "✅" if draft["status"] == "approved" else "❌"
        print(f"{status_icon} [{i}] {draft['title'][:60]}")
        print(f"     Keyword: {draft['keyword']} | Tone: {draft['tone']} | Score: {draft['relevance_score']}/10")
        print(f"     Hook: {draft['hook'][:70]}...")
        print(f"     Source: {draft['source']} , {draft['date']}")
        print()

    print(f"Total: {len(queue['drafts'])} drafts")
    print(f"Approved: {len(queue['approved'])} | Rejected: {len(queue['rejected'])}")
    print("\nCommands:")
    print("  python research_bot.py --approve N    # Approve draft #N")
    print("  python research_bot.py --reject N     # Reject draft #N")

def cmd_approve(index):
    """Approve a draft by index."""
    queue = load_queue()

    try:
        idx = int(index) - 1
        draft = queue["drafts"][idx]
        draft["status"] = "approved"
        queue["approved"].append(draft)
        print(f"\n✅ Approved: {draft['title'][:60]}")
        print(f"   Ready for content expansion and import.")
    except (IndexError, ValueError):
        print(f"\n❌ Invalid index: {index}")
        print(f"   Run --review to see available drafts")

def cmd_reject(index):
    """Reject a draft by index."""
    queue = load_queue()

    try:
        idx = int(index) - 1
        draft = queue["drafts"][idx]
        draft["status"] = "rejected"
        queue["rejected"].append(draft)
        del queue["drafts"][idx]
        print(f"\n❌ Rejected: {draft['title'][:60]}")
    except (IndexError, ValueError):
        print(f"\n❌ Invalid index: {index}")

def cmd_sources():
    """List all monitored sources."""
    print("\n" + "=" * 60)
    print("MONITORED SOURCES")
    print("=" * 60 + "\n")

    for name, config in sorted(SOURCES.items(), key=lambda x: -x[1]["priority"]):
        status = "✅" if (config["type"] == "rss" and HAS_FEEDPARSER) or \
                         (config["type"] == "web" and HAS_REQUESTS) else "⚠️ NEEDS SETUP"
        print(f"  {status} {name}")
        print(f"     Type: {config['type']} | Priority: {config['priority']}/10")
        print(f"     URL: {config['url'][:70]}")
        print()

def main():
    parser = argparse.ArgumentParser(description="LAID Daily Research Bot")
    parser.add_argument("--run", action="store_true", help="Run full research scan")
    parser.add_argument("--review", action="store_true", help="Review queued drafts")
    parser.add_argument("--approve", type=str, help="Approve draft by number")
    parser.add_argument("--reject", type=str, help="Reject draft by number")
    parser.add_argument("--sources", action="store_true", help="List monitored sources")

    args = parser.parse_args()

    if not any([args.run, args.review, args.approve, args.reject, args.sources]):
        parser.print_help()
        return

    if args.run:
        cmd_run()
    elif args.review:
        cmd_review()
    elif args.approve:
        cmd_approve(args.approve)
    elif args.reject:
        cmd_reject(args.reject)
    elif args.sources:
        cmd_sources()

if __name__ == "__main__":
    main()
