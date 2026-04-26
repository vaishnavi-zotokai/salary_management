# Ledgr — Salary Intelligence Platform

A full-stack salary management tool built for HR and finance teams. Handles 10,000 employees with full CRUD, filtering, pagination, and a live insights dashboard broken down by country, role, and department.

---

## Stack

- **Backend** — Python, FastAPI, SQLAlchemy, SQLite
- **Frontend** — React 19, Vite, React Query, Recharts
- **Styling** — Inline styles (primary), Tailwind CSS (secondary)

---

## Getting Started

**Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed          # loads 10,000 employees
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

API docs at `http://localhost:8000/docs`

---

## How It's Structured

```
browser
  └── React (EmployeesPage, InsightsPage)
        └── React Query + axios
              └── FastAPI
                    ├── /employees  (CRUD + pagination)
                    ├── /insights   (aggregate by country/role)
                    └── /insights/departments  (GROUP BY department)
                          └── SQLAlchemy → SQLite
```

The backend is split into three layers — routes handle HTTP, a service layer holds all business logic, and models own the DB schema. This keeps each layer easy to test independently.

---

## Data Model

```
employees
  id, full_name, job_title, country, salary, currency,
  department, email, hire_date, created_at

Indexes: country | job_title | (country, job_title) | salary
```

The composite `(country, job_title)` index is the important one — the insights queries filter on both and then aggregate. Without it, every salary benchmark request would scan all 10,000 rows.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | List with filters: `search`, `country`, `department`, `page` |
| `POST` | `/employees` | Create |
| `PUT` | `/employees/{id}` | Update |
| `DELETE` | `/employees/{id}` | Delete |
| `GET` | `/insights` | Salary stats for a country + optional job title |
| `GET` | `/insights/departments` | Per-department stats for a country, sorted by avg salary |

---

## Frontend Notes

### Layout
The whole app fits in the viewport — no page scroll. The employees table is the only thing that scrolls internally. This uses a two-table trick: a separate `<thead>` table sits fixed above a scrollable `<tbody>` div. Both share identical `<colgroup>` column widths so everything stays aligned.

The flex layout relies on `min-height: 0` on every flex child — without it, browsers won't let flex items shrink below their content height, which breaks the constraint.

### Data fetching
React Query handles all server state. `placeholderData` keeps the previous page visible while the next one loads (no flash between pages). `staleTime: 30s` means navigating back to a page you've already visited hits the cache, not the network.

### Styling
Inline styles are the primary approach after running into a Tailwind v4 build cache issue where classes were in the source but no CSS was emitted for them. Inline styles are evaluated by the JS runtime so they can never silently break.

---

## Insights Dashboard

**Overview tab** shows salary benchmarks across countries with:
- Avg salary, total payroll (avg × headcount), pay gap ratio (max ÷ min), estimated bonus pool, and headcount
- A country rank ("US ranks #2 of 10 by avg salary")
- Two side-by-side charts: avg salary by country and estimated bonus by country, both with the selected country highlighted

**Department Compare tab** lets you toggle multiple departments on/off and compare them side by side:
- Horizontal bar chart sorted by avg salary, each department gets a unique color
- A breakdown table showing avg salary, pay gap ratio, and headcount per department

### Why these metrics?

| Metric | Reason |
|--------|--------|
| Total Payroll | Finance teams need to know total compensation exposure, not just per-person |
| Bonus Pool | Helps with year-end planning — total bonus liability for a region/role |
| Country Rank | Quick answer to "are we competitive here compared to other markets?" |
| Global Avg reference line | Context on the chart — is this country above or below market? |

---

## Trade-offs & Decisions

**SQLite over Postgres** — removes all infrastructure overhead for an assessment. SQLAlchemy makes swapping the DB a one-line change if needed.

**Server-side pagination** — sending 10,000 records on load would be ~2 MB of JSON. Server-side keeps each response under 5 KB.

**Server-side aggregation** — `MIN / MAX / AVG / COUNT` in SQL is faster than pulling all rows and computing in JS. The index makes it efficient.

**One department endpoint returning all departments** — the compare feature needs all departments at once to draw the chart. Fetching one at a time would mean 10 parallel requests every time you switch country.

**Bonus rates hardcoded on the frontend** — they're a business rule that changes rarely, not per-employee data. In production this would live in a config table.

---

## What I'd Do Differently at Scale

- Replace `ILIKE '%search%'` with full-text search (e.g. `pg_trgm` in Postgres) — it can't use an index
- Replace `COUNT(*)` on every paginated request with cursor-based pagination
- Replace the 10 parallel country requests with a single `GROUP BY country` endpoint
- Add Redis caching for the insights endpoints since the underlying data changes infrequently

---

## How I Used Claude Code (AI Agent)

I used Claude Code as a pair programmer throughout this project — not to generate the whole thing blindly, but to move faster on implementation while I stayed in control of decisions.

Here's roughly how the conversation went:

---

**Starting point — UI polish**
> "the ui looks like this, can we make this better, use some design principles and standards. this is an assignment for a job role so we need to give our best and look decent"

This kicked off the first big redesign — colored avatars, indigo primary color, search icon, skeleton loaders, better stat cards with icons.

---

**Fixing what didn't look right**
> "its still not taking the whole page, if you see the search icon is stacked over the box, employees and insights are very close, spacing is not very good. please check and make it presentable"

> "put some margin on the left. its right there sticking to the screen. the column names are also the same font as the rows. can we change it"

I was reviewing the output in the browser and flagging things visually. The AI would diagnose why (e.g. absolute-positioned icon fighting with padding) and fix it.

---

**Specifying the exact layout I wanted**
> "Fix the layout and spacing issues in the React frontend. Here are the exact problems to fix: [8 numbered points covering navbar padding, table header styling, pagination format, button colors...]"

Once I knew exactly what I wanted, I wrote it out as a numbered spec. This produced much more precise output than vague feedback.

---

**When Tailwind stopped working**
> "The Tailwind CSS classes are not being applied at all in the React components. The UI has zero padding/spacing even though classes like px-8, py-4, gap-3 etc are written. The root cause is likely that Tailwind is not configured to scan the right files."

I described the symptom and my hypothesis. The AI confirmed the config was correct, identified the stale `.vite` cache as the real cause, cleared it, and rewrote the components with inline styles as a fallback so it wouldn't happen again.

---

**Viewport layout — no page scroll**
> "Fix the table layout so the page doesn't scroll — only the table body scrolls internally. [detailed structure with style values]"

I described the layout model I wanted (fixed nav, fixed header/filters, scrollable tbody only). The AI came up with the two-table trick and explained why `min-height: 0` was necessary.

---

**Asking for ideas rather than specifying**
> "Any other meaningful metrics you believe are helpful for the user persona. please add some cool metrics that add real value to the dashboard. or anything out of the box"

Here I deliberately left it open. The AI suggested total payroll, pay gap ratio, country ranking, and the global average reference line — I reviewed them and kept all four because they made sense for the HR/finance use case.

---

**Feature request**
> "can we have department wise insights as well? they can help compare the stats between departments. a compare feature between more than one departments in a same country"

This turned into a full backend + frontend feature: new DB query, new API endpoint, new schema, and a tab with pill selectors, a horizontal bar chart, and a comparison table.

---

**Branding**
> "make the name salaryIQ to something cool!"

The AI suggested PayPulse, Ledgr, Moneta, and Payvault. I picked Ledgr — it felt like a real fintech product name.

---

### What I learned about prompting

- **Vague prompts produce generic output.** "Make it look better" gives you safe, average choices. "The search icon overlaps the text because pl-9 isn't applying — fix it" gets you the exact fix.
- **Describe the symptom and your hypothesis together.** The AI can confirm or correct your diagnosis, which is faster than trial and error.
- **Numbered specs work better than paragraphs** when you have multiple precise requirements in one go.
- **Open-ended questions are useful too** — asking "what metrics would be valuable here?" surfaces ideas you might not have thought of, which you then evaluate yourself.
- **Review every output before accepting it.** The AI doesn't know your priorities. It'll add features you didn't ask for or make assumptions about your design intent. Reading the diff and pushing back is part of the workflow.
