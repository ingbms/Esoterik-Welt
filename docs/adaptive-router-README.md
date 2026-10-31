# Hermes Adaptive Router

An adaptive model router plugin for Hermes Agent with Bayesian quality-based routing, benchmark harness, and strict policy enforcement.

## Features

- **Bayesian Model Routing**: Uses Lower Confidence Bound (LCB) on success probability for exploration/exploitation balance
- **Quality Engine**: Benchmark execution and online quality measurement with verified results
- **Policy Enforcement**: Strict routing policies including "Free First + Codex Escalation"
- **Dashboard**: Real-time model quality metrics, policy management, routing testing, and benchmark results
- **Hermes Integration**: Plugin with tools, hooks, and desktop dashboard

## Architecture

```
adaptive-router/
├── adaptive_router/          # Core Python package
│   ├── router.py            # Bayesian routing logic
│   ├── quality_engine.py    # Benchmark execution & quality measurement
│   ├── storage.py           # SQLite database (WAL mode)
│   ├── policy.py            # Policy enforcement (FORCE_MODEL, FREE_FIRST_CODEX_ESCALATION, etc.)
│   └── schemas.py           # Tool schemas
├── dashboard/               # Desktop dashboard plugin
│   ├── manifest.json
│   ├── plugin_api.py        # FastAPI backend
│   └── dist/
│       ├── index.js         # Minimal entry point
│       └── index.full.js    # Full dashboard implementation
├── benchmarks/              # Benchmark suites
└── tests/
```

## Installation

### 1. Install as Hermes Plugin

```bash
# From the project directory
cd C:\Users\mas\Arbeit\hermes-adaptive-router

# Install the plugin (symlinks into ~/.hermes/plugins/)
hermes plugins install . --enable
```

### 2. Enable the Dashboard Plugin

After installation, enable the dashboard extension in Hermes Desktop:
1. Open Hermes Desktop → Settings → Plugins
2. Find "adaptive-router" and toggle it ON
3. The "Adaptive Router" tab appears in the sidebar

### 3. Configure API Keys

Ensure your providers are configured:
```bash
hermes auth add openrouter      # For free OpenRouter models
hermes auth add openai-codex    # For Codex/GPT-6.1 Sol
hermes auth add nvidia          # For Nemotron free tier
hermes auth add google          # For Gemini free tier
```

## Built-in Policies

| Policy ID | Description |
|-----------|-------------|
| `free_first_codex_escalation` | **Recommended** - Uses free models first, escalates to Codex on failures |
| `force_codex_sol` | Forces GPT-6.1 Sol for all calls (no fallback) |
| `auto_quality` | Quality-based automatic routing |
| `free_only` | Only free models, pauses on quota exhaustion |

## Usage

### CLI Tools (available in Hermes chat)

```bash
# Get routing decision
hermes chat -z "route_task task_class=coding difficulty=hard policy_mode=free_first_codex_escalation"

# Record result
hermes chat -z "record_result run_id=... task_id=... model_id=gpt-6.1-sol provider=openai-codex task_class=coding success=true"

# Get model stats
hermes chat -z "get_model_stats"

# Run benchmark
hermes chat -z "run_benchmark benchmark_name=coding_basic models=[{\"model_id\":\"gpt-6.1-sol\",\"provider\":\"openai-codex\"}]"

# Manage policies
hermes chat -z "set_policy policy_id=my_policy policy={'name':'My Policy','mode':'free_first_codex_escalation',...}"
hermes chat -z "list_policies"
```

### Dashboard

Open Hermes Desktop → Adaptive Router tab for:
- **Overview**: Model count, active policies, best LCB
- **Model Quality**: Full statistics table with LCB, success rates, latency, cost
- **Policies**: View/edit/create routing policies with JSON configuration
- **Test Routing**: Interactive routing decision tester
- **Benchmarks**: Run benchmarks and view results

### Kanban Integration

Use with Hermes Kanban for durable tasks:

```bash
# Create task with routing policy
hermes kanban create "Implement feature X" \
  --project trading \
  --metadata '{"policy_id":"free_first_codex_escalation","task_class":"coding","difficulty":"hard"}'

# Dispatcher will call route_task before assigning
```

## Policy: Free First + Codex Escalation

The recommended policy for cost-effective high-quality routing:

```yaml
mode: free_first_codex_escalation
free_models:
  - model_id: deepseek/deepseek-v4-flash
    provider: openrouter
  - model_id: qwen3.5-397b
    provider: custom
    base_url: https://ollama.com/v1
  - model_id: nemotron-3-ultra
    provider: nvidia
  - model_id: gemini-3-flash
    provider: google
codex_model: gpt-6.1-sol
codex_provider: openai-codex
escalation_triggers:
  - test_failure
  - build_failure
  - lint_failure
  - security_scan_failure
  - reasoning_complexity_high
  - explicit_user_request
  - consecutive_failures_3
scope: all_llm_calls
allow_fallback: true
on_quota_exhausted: escalate_to_codex
on_model_unavailable: try_next_free_then_codex
require_verification: true
```

## Quality Database

SQLite database at `~/.hermes/adaptive_router_quality.db` with tables:
- `models` - Model inventory from OpenRouter/providers
- `tasks` - Task metadata (class, difficulty, risk)
- `runs` - Individual task executions
- `evaluations` - Validation results
- `model_statistics` - Aggregated stats with Wilson score LCB
- `routing_policies` - Policy definitions
- `model_inventory` - Discovered models with pricing

## Development

```bash
# Run tests
cd C:\Users\mas\Arbeit\hermes-adaptive-router
python -m pytest tests/ -v

# Run benchmark manually
python -c "
from adaptive_router import QualityEngine, QualityDB
db = QualityDB()
engine = QualityEngine(db)
results = engine.run_benchmark('coding_basic', [{'model_id':'gpt-6.1-sol','provider':'openai-codex'}])
print(results)
"
```

## Windows Notes

- Runs natively on Windows (git-bash, Windows Terminal, PowerShell)
- Database uses WAL mode for concurrent reads
- Desktop dashboard works in Hermes Desktop app (Electron)
- No WSL required

## License

MIT