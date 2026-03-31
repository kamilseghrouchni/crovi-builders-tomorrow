#!/usr/bin/env python3
"""
serve_query.py — Lightweight HTTP server for testing vCRO agent endpoints.

Serves three endpoints:
  GET  /api/runs              — list available runs
  GET  /api/schema?run_id=X   — dynamic parameter schema for a run
  POST /api/query             — parameterized query over run artifacts

Usage:
  python3 scripts/serve_query.py [--port 8080] [--store store]

This is a throwaway test server. Replace with Next.js webapp in production.
"""

import json
import os
import sys
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

STORE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "store")


def read_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def safe_run_id(run_id):
    """Prevent path traversal."""
    return re.sub(r"[^a-zA-Z0-9_-]", "", run_id)


def get_run_dir(run_id):
    safe = safe_run_id(run_id)
    d = os.path.join(STORE_DIR, "runs", safe)
    if not d.startswith(os.path.join(STORE_DIR, "runs")):
        return None
    if not os.path.isdir(d):
        return None
    return d


def derive_status(run_state):
    phases = run_state.get("phases", {})
    if phases.get("deliver", {}).get("status") == "completed":
        return "complete"
    for p in phases.values():
        if p.get("status") == "failed":
            return "failed"
        if p.get("status") == "running":
            return "in_progress"
    return "in_progress"


def list_runs(filters=None):
    runs_dir = os.path.join(STORE_DIR, "runs")
    if not os.path.isdir(runs_dir):
        return []
    results = []
    for entry in sorted(os.listdir(runs_dir), reverse=True):
        if entry.startswith("."):
            continue
        run_dir = os.path.join(runs_dir, entry)
        if not os.path.isdir(run_dir):
            continue
        state = read_json(os.path.join(run_dir, "run_state.json"))
        request = read_json(os.path.join(run_dir, "request.json"))
        if not state:
            continue
        status = derive_status(state)
        if filters and filters.get("status") and status != filters["status"]:
            continue
        results.append({
            "run_id": entry,
            "status": status,
            "indication": request.get("indication") if request else None,
            "use_case": request.get("use_case_type") if request else None,
            "created_at": state.get("created"),
            "one_liner": request.get("scope_notes", "")[:120] if request else None,
        })
    return results


def resolve_latest_run():
    for run in list_runs():
        if run["status"] == "complete":
            return run["run_id"]
    runs = list_runs()
    return runs[0]["run_id"] if runs else None


def execute_query(params):
    run_id = params.get("run_id") or resolve_latest_run()
    if not run_id:
        return {"error": "No runs found"}, 404

    run_dir = get_run_dir(run_id)
    if not run_dir:
        return {"error": f"Run not found: {run_id}"}, 404

    state = read_json(os.path.join(run_dir, "run_state.json"))
    request = read_json(os.path.join(run_dir, "request.json"))
    status = derive_status(state) if state else "unknown"

    # Deep dive mode
    cohort_id = params.get("cohort_id")
    if cohort_id:
        cohorts = read_json(os.path.join(run_dir, "extracted_cohorts.json")) or []
        match = [c for c in cohorts if c.get("id") == cohort_id]
        if not match:
            return {"error": f"Cohort not found: {cohort_id}"}, 404
        return {"run_id": run_id, "status": status, "cohort": match[0]}, 200

    # Load schema for resolution
    schema = read_json(os.path.join(run_dir, "endpoint_schema.json"))

    # Load available artifacts
    include = params.get("include", ["recommendations", "signal"])
    fmt = params.get("format", "full")
    top_k = params.get("top_k", 5)

    response = {
        "run_id": run_id,
        "status": status,
        "query": params,
    }

    # Load cohorts and apply decision-axis filtering
    cohorts = read_json(os.path.join(run_dir, "extracted_cohorts.json")) or []
    ranking = read_json(os.path.join(run_dir, "ranking.json"))

    # Apply text-search filtering from decision axes
    if schema and schema.get("resolution"):
        for axis in schema.get("decision_axes", []):
            value = params.get(axis["param"])
            if not value:
                continue
            rule = schema["resolution"].get(axis["param"], {})

            if rule.get("match_type") == "text_search_in_intelligence":
                val_lower = value.lower()
                cohorts = [
                    c for c in cohorts
                    if any(
                        val_lower in i.get("fact", "").lower()
                        or val_lower in i.get("implication", "").lower()
                        for i in c.get("intelligence", [])
                    )
                ]

            # question axis: adjust which artifacts to include
            if axis["param"] == "question" and isinstance(rule.get(value), dict):
                q_rule = rule[value]
                if q_rule.get("include"):
                    include = q_rule["include"]

    # Slice
    if ranking:
        ranked_ids = [r.get("id") for r in ranking[:top_k]]
        ranked_cohorts = [c for c in cohorts if c.get("id") in ranked_ids]
        if ranked_cohorts:
            cohorts = ranked_cohorts
    cohorts = cohorts[:top_k]

    # Format
    if fmt == "summary":
        response["recommendations"] = [
            {
                "cohort_name": ", ".join(c.get("cohorts_named", [])),
                "source_id": c.get("id"),
                "first_author": c.get("first_author"),
            }
            for c in cohorts
        ]
    elif fmt == "actionable":
        response["recommendations"] = [
            {
                "cohort_name": ", ".join(c.get("cohorts_named", [])),
                "source_id": c.get("id"),
                "first_author": c.get("first_author"),
                "intelligence_count": len(c.get("intelligence", [])),
            }
            for c in cohorts
        ]
    else:
        response["recommendations"] = cohorts

    # Include requested sections
    artifact_map = {
        "signal": "signal_summary.json",
        "access": "access_summary.json",
        "contacts": "contacts.json",
        "provider": "provider_intelligence.json",
        "exclusion_log": "validation_results.json",
        "provenance": "run_state.json",
    }
    for section in include:
        if section == "recommendations":
            continue  # already included
        if section == "intelligence" and not cohort_id:
            continue  # only in deep dive
        artifact_file = artifact_map.get(section)
        if artifact_file:
            data = read_json(os.path.join(run_dir, artifact_file))
            if data:
                response[section] = data

    # available_actions
    response["available_actions"] = []
    if len(cohorts) > 0:
        response["available_actions"].append({
            "action": "deep_dive",
            "description": f"Get full intelligence for {', '.join(cohorts[0].get('cohorts_named', []))}",
            "endpoint": "POST /api/query",
            "body": {"run_id": run_id, "cohort_id": cohorts[0].get("id"), "include": ["intelligence"]},
        })
    if schema:
        for axis in schema.get("decision_axes", []):
            for val in axis.get("values", []):
                if params.get(axis["param"]) != val:
                    response["available_actions"].append({
                        "action": f"filter_{axis['param']}",
                        "description": f"Show {val} only — {axis['why'][:60]}",
                        "endpoint": "POST /api/query",
                        "body": {"run_id": run_id, axis["param"]: val},
                    })
                    break  # one alternative per axis

    # _endpoint block
    if schema:
        response["_endpoint"] = {
            "url": "POST /api/query",
            "this_run": run_id,
            "parameters": [
                {
                    "name": axis["param"],
                    "type": axis["type"],
                    "values": axis["values"],
                    "description": axis["why"],
                }
                for axis in schema.get("decision_axes", [])
            ] + [
                {"name": "top_k", "type": "int", "default": 5, "description": "Number of cohorts"},
                {"name": "cohort_id", "type": "string", "description": "Deep dive by PMC/NCT ID"},
                {"name": "format", "type": "string", "values": ["full", "summary", "actionable"], "default": "full"},
            ],
            "examples": schema.get("examples", []),
        }

    return response, 200


class Handler(BaseHTTPRequestHandler):
    def send_json(self, data, status=200):
        body = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)

        if parsed.path == "/api/runs":
            filters = {}
            if "status" in qs:
                filters["status"] = qs["status"][0]
            runs = list_runs(filters)
            self.send_json({"runs": runs})

        elif parsed.path == "/api/schema":
            run_id = qs.get("run_id", [None])[0] or resolve_latest_run()
            if not run_id:
                self.send_json({"error": "No runs found"}, 404)
                return
            run_dir = get_run_dir(run_id)
            if not run_dir:
                self.send_json({"error": f"Run not found: {run_id}"}, 404)
                return
            schema = read_json(os.path.join(run_dir, "endpoint_schema.json"))
            if not schema:
                # Fallback: return fixed params only
                schema = {
                    "run_id": run_id,
                    "one_liner": "No endpoint schema generated for this run",
                    "decision_axes": [],
                    "fixed_params": {
                        "run_id": {"type": "string", "default": run_id},
                        "top_k": {"type": "integer", "default": 5},
                        "cohort_id": {"type": "string"},
                        "format": {"type": "string", "default": "full", "enum": ["full", "summary", "actionable"]},
                    },
                }
            self.send_json(schema)

        else:
            self.send_json({"error": "Not found. Available: GET /api/runs, GET /api/schema, POST /api/query"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/query":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            result, status = execute_query(body)
            self.send_json(result, status)
        else:
            self.send_json({"error": "Not found. Use POST /api/query"}, 404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        sys.stderr.write(f"[serve_query] {args[0]}\n")


def main():
    global STORE_DIR
    port = 8080

    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--port" and i + 1 < len(args):
            port = int(args[i + 1])
            i += 2
        elif args[i] == "--store" and i + 1 < len(args):
            STORE_DIR = os.path.abspath(args[i + 1])
            i += 2
        else:
            i += 1

    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"vCRO query server running on http://localhost:{port}")
    print(f"Store: {STORE_DIR}")
    print()
    print(f"  GET  http://localhost:{port}/api/runs")
    print(f"  GET  http://localhost:{port}/api/schema")
    print(f"  POST http://localhost:{port}/api/query")
    print()
    print("Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
