#!/usr/bin/env python3
"""Read-only audit of one OMP session JSONL file.

This intentionally understands only the stable evidence needed by omp-kit runtime
smokes. It never discovers sessions implicitly and never invokes OMP/provider traffic.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime
import json
from pathlib import Path
import re
import sys
from typing import Any, Iterable

AUDIT_SCHEMA_VERSION = 1
SUPPORTED_SESSION_VERSIONS = {3}
KNOWN_ENTRY_TYPES = {
    'message',
    'model_usage',
    'thinking_level_change',
    'model_change',
    'service_tier_change',
    'compaction',
    'branch_summary',
    'reset_boundary',
    'custom',
    'custom_message',
    'label',
    'title_change',
    'ttsr_injection',
    'credential_pin',
    'session_init',
    'mode_change',
}
RANGE_SELECTOR = re.compile(r'^(?P<base>.+):(?P<start>\d+)-(?P<end>\d+)$')


class AuditError(RuntimeError):
    pass


def _iso_ms(value: str) -> int:
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (TypeError, ValueError) as exc:
        raise AuditError(f'invalid ISO timestamp: {value!r}') from exc
    return int(dt.timestamp() * 1000)


def _load_jsonl(path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    if not path.is_file():
        raise AuditError(f'session file does not exist: {path}')
    objects: list[dict[str, Any]] = []
    try:
        text = path.read_text(encoding='utf-8-sig')
    except OSError as exc:
        raise AuditError(f'cannot read session file: {path}') from exc
    for lineno, raw in enumerate(text.splitlines(), start=1):
        if not raw.strip():
            continue
        try:
            value = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise AuditError(f'malformed JSON at {path}:{lineno}: {exc.msg}') from exc
        if not isinstance(value, dict):
            raise AuditError(f'JSONL entry at {path}:{lineno} is not an object')
        objects.append(value)
    if objects and objects[0].get('type') == 'title':
        objects = objects[1:]
    if not objects or objects[0].get('type') != 'session' or not isinstance(objects[0].get('id'), str):
        raise AuditError('first logical JSONL entry must be a session header with string id')
    return objects[0], objects[1:]


def _validate_linear(entries: list[dict[str, Any]]) -> None:
    seen: set[str] = set()
    previous: str | None = None
    for index, entry in enumerate(entries):
        entry_id = entry.get('id')
        if not isinstance(entry_id, str) or not entry_id:
            raise AuditError(f'entry {index} is missing a string id')
        if entry_id in seen:
            raise AuditError(f'duplicate session entry id: {entry_id}')
        parent = entry.get('parentId')
        if parent is not None and not isinstance(parent, str):
            raise AuditError(f'entry {entry_id} has invalid parentId')
        if index == 0:
            if parent is not None:
                raise AuditError(
                    f'branched/non-linear session unsupported in audit schema v1: '
                    f'first entry {entry_id} has parent {parent!r}'
                )
        elif parent != previous:
            raise AuditError(
                'branched/non-linear session unsupported in audit schema v1: '
                f'entry {entry_id} has parent {parent!r}, expected {previous!r}'
            )
        seen.add(entry_id)
        previous = entry_id


def _as_number(value: Any) -> int | float | None:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    return None


def _usage_records(entries: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for entry in entries:
        if entry.get('type') == 'model_usage' and isinstance(entry.get('usage'), dict):
            records.append(entry['usage'])
            continue
        if entry.get('type') != 'message':
            continue
        message = entry.get('message')
        if not isinstance(message, dict) or message.get('role') != 'assistant':
            continue
        usage = message.get('usage')
        if isinstance(usage, dict):
            records.append(usage)
    return records


def _sum_usage(records: list[dict[str, Any]]) -> dict[str, Any]:
    fields = ('input', 'cacheRead', 'cacheWrite', 'output', 'totalTokens')
    result: dict[str, Any] = {}
    for field in fields:
        values = [_as_number(record.get(field)) for record in records]
        result[field] = sum(value for value in values if value is not None)
        result[f'{field}Complete'] = bool(records) and all(value is not None for value in values)
    reasoning_values = [_as_number(record.get('reasoningTokens')) for record in records]
    result['reasoningTokens'] = sum(value for value in reasoning_values if value is not None)
    result['reasoningTokensComplete'] = bool(records) and all(value is not None for value in reasoning_values)
    return result


def _tool_calls(entries: Iterable[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    calls: list[dict[str, Any]] = []
    results: dict[str, dict[str, Any]] = {}
    order = 0
    for entry in entries:
        if entry.get('type') != 'message':
            continue
        message = entry.get('message')
        if not isinstance(message, dict):
            continue
        role = message.get('role')
        if role == 'assistant':
            content = message.get('content')
            if not isinstance(content, list):
                continue
            for block in content:
                if not isinstance(block, dict) or block.get('type') != 'toolCall':
                    continue
                name = block.get('name')
                args = block.get('arguments')
                if not isinstance(name, str):
                    continue
                if not isinstance(args, dict):
                    args = {}
                call_id = block.get('id') or block.get('toolCallId')
                calls.append({
                    'order': order,
                    'entry_id': entry.get('id'),
                    'timestamp': entry.get('timestamp'),
                    'id': call_id if isinstance(call_id, str) else None,
                    'name': name,
                    'arguments': args,
                })
                order += 1
        elif role == 'toolResult':
            call_id = message.get('toolCallId')
            if isinstance(call_id, str):
                results[call_id] = message
    return calls, results


def _path_values(args: dict[str, Any]) -> list[str]:
    values: list[str] = []
    path = args.get('path')
    if isinstance(path, str):
        values.append(path)
    paths = args.get('paths')
    if isinstance(paths, str):
        values.append(paths)
    elif isinstance(paths, list):
        values.extend(value for value in paths if isinstance(value, str))
    return values


def _history_metrics(calls: list[dict[str, Any]], base: str, history_length: int | None) -> dict[str, Any]:
    grep_patterns: list[str] = []
    read_selectors: list[str] = []
    ranges: list[tuple[int, int]] = []
    grep_orders: list[int] = []
    read_orders: list[int] = []
    unbounded = 0

    for call in calls:
        name = call['name']
        args = call['arguments']
        paths = _path_values(args)
        if name == 'grep' and base in paths:
            pattern = args.get('pattern')
            grep_patterns.append(pattern if isinstance(pattern, str) else '')
            grep_orders.append(call['order'])
        if name != 'read':
            continue
        for path in paths:
            if path == base:
                unbounded += 1
                read_selectors.append(path)
                read_orders.append(call['order'])
                continue
            match = RANGE_SELECTOR.match(path)
            if not match or match.group('base') != base:
                continue
            start = int(match.group('start'))
            end = int(match.group('end'))
            if start <= 0 or end < start:
                continue
            ranges.append((start, end))
            read_selectors.append(path)
            read_orders.append(call['order'])

    unique_lines: set[int] = set()
    for start, end in ranges:
        unique_lines.update(range(start, end + 1))
    span = None if not ranges else [min(start for start, _ in ranges), max(end for _, end in ranges)]
    coverage = None
    if history_length is not None and history_length > 0:
        in_bounds = {line for line in unique_lines if 1 <= line <= history_length}
        coverage = len(in_bounds) / history_length

    first_grep = min(grep_orders) if grep_orders else None
    reads_before_first_grep = 0
    if first_grep is not None:
        reads_before_first_grep = sum(order < first_grep for order in read_orders)
    elif read_orders:
        reads_before_first_grep = len(read_orders)

    return {
        'history_grep_patterns': grep_patterns,
        'history_read_selectors': read_selectors,
        'history_grep_count': len(grep_orders),
        'history_targeted_read_count': len(ranges),
        'history_unbounded_read_count': unbounded,
        'history_reads_before_first_grep': reads_before_first_grep,
        'history_requested_unique_lines': len(unique_lines),
        'history_requested_span': span,
        'history_coverage_ratio_when_length_known': coverage,
    }


def _coordination_metrics(calls: list[dict[str, Any]]) -> dict[str, Any]:
    waits: list[dict[str, Any]] = []
    send_count = 0
    cancel_count = 0
    for call in calls:
        if call['name'] != 'hub':
            continue
        args = call['arguments']
        op = args.get('op')
        if op == 'wait':
            waits.append({
                'order': call['order'],
                'timeoutMs': args.get('timeoutMs'),
                'from': args.get('from'),
                'ids': args.get('ids'),
                'name': args.get('name'),
            })
        elif op == 'send':
            send_count += 1
        elif op == 'cancel':
            cancel_count += 1
    return {
        'hub_wait_count': len(waits),
        'hub_unbounded_wait_count': sum(wait.get('timeoutMs') == 0 for wait in waits),
        'hub_send_count': send_count,
        'hub_cancel_count': cancel_count,
        'hub_waits': waits,
    }


def _last_result(calls: list[dict[str, Any]], entries: Iterable[dict[str, Any]]) -> Any:
    for call in reversed(calls):
        if call['name'] == 'yield':
            return call['arguments']
    for entry in reversed(list(entries)):
        if entry.get('type') != 'message':
            continue
        message = entry.get('message')
        if not isinstance(message, dict) or message.get('role') != 'assistant':
            continue
        content = message.get('content')
        if not isinstance(content, list):
            continue
        texts = [block.get('text') for block in content if isinstance(block, dict) and block.get('type') == 'text' and isinstance(block.get('text'), str)]
        if texts:
            return '\n'.join(texts)
    return None


def audit_session(path: Path, *, history_base: str = 'history://Main', history_length: int | None = None) -> dict[str, Any]:
    header, entries = _load_jsonl(path)
    version = header.get('version')
    if version not in SUPPORTED_SESSION_VERSIONS:
        raise AuditError(f'unsupported OMP session version: {version!r}; supported: {sorted(SUPPORTED_SESSION_VERSIONS)}')
    _validate_linear(entries)

    unknown = sorted({entry.get('type') for entry in entries if isinstance(entry.get('type'), str) and entry.get('type') not in KNOWN_ENTRY_TYPES})
    calls, tool_results = _tool_calls(entries)
    usage_records = _usage_records(entries)
    usage = _sum_usage(usage_records)

    session_init = next((entry for entry in entries if entry.get('type') == 'session_init'), {})
    agent = session_init.get('agent') if isinstance(session_init.get('agent'), str) else None
    model_role = session_init.get('modelRole') if isinstance(session_init.get('modelRole'), str) else None
    initial_model = session_init.get('resolvedModel') if isinstance(session_init.get('resolvedModel'), str) else None

    models_seen: list[str] = []
    if initial_model:
        models_seen.append(initial_model)
    fallback_observed = False
    thinking_levels: list[str] = []
    for entry in entries:
        if entry.get('type') == 'model_change':
            model = entry.get('model')
            if isinstance(model, str) and model not in models_seen:
                models_seen.append(model)
            fallback_observed = fallback_observed or entry.get('resolvedModelIsFallback') is True
        elif entry.get('type') == 'thinking_level_change':
            level = entry.get('thinkingLevel')
            if isinstance(level, str) and level not in thinking_levels:
                thinking_levels.append(level)
        elif entry.get('type') == 'message':
            message = entry.get('message')
            if isinstance(message, dict) and message.get('role') == 'assistant':
                provider = message.get('provider')
                model = message.get('model')
                if isinstance(provider, str) and isinstance(model, str):
                    identity = f'{provider}/{model}'
                    if identity not in models_seen:
                        models_seen.append(identity)

    timestamps = [entry.get('timestamp') for entry in entries if isinstance(entry.get('timestamp'), str)]
    first_entry_at = timestamps[0] if timestamps else None
    last_entry_at = timestamps[-1] if timestamps else None
    session_span_ms = None
    if first_entry_at and last_entry_at:
        session_span_ms = max(0, _iso_ms(last_entry_at) - _iso_ms(first_entry_at))

    assistant_request_count = sum(
        entry.get('type') == 'message'
        and isinstance(entry.get('message'), dict)
        and entry['message'].get('role') == 'assistant'
        and isinstance(entry['message'].get('usage'), dict)
        for entry in entries
    )
    tool_counts = Counter(call['name'] for call in calls)
    tool_error_count = sum(
        result.get('isError') is True
        for result in tool_results.values()
        if isinstance(result, dict)
    )

    result: dict[str, Any] = {
        'audit_schema_version': AUDIT_SCHEMA_VERSION,
        'omp_session_version': version,
        'session_id': header.get('id'),
        'agent': agent,
        'model_role': model_role,
        'initial_model': initial_model,
        'models_seen': models_seen,
        'thinking_levels_seen': thinking_levels,
        'fallback_observed': fallback_observed,
        'first_entry_at': first_entry_at,
        'last_entry_at': last_entry_at,
        'session_span_ms': session_span_ms,
        'assistant_request_count': assistant_request_count,
        'tool_calls_by_name': dict(sorted(tool_counts.items())),
        'tool_error_count': tool_error_count,
        'input_tokens': usage['input'],
        'input_tokens_complete': usage['inputComplete'],
        'cache_read_tokens': usage['cacheRead'],
        'cache_read_tokens_complete': usage['cacheReadComplete'],
        'cache_write_tokens': usage['cacheWrite'],
        'cache_write_tokens_complete': usage['cacheWriteComplete'],
        'output_tokens': usage['output'],
        'output_tokens_complete': usage['outputComplete'],
        'reasoning_tokens': usage['reasoningTokens'],
        'reasoning_tokens_complete': usage['reasoningTokensComplete'],
        'total_tokens': usage['totalTokens'],
        'total_tokens_complete': usage['totalTokensComplete'],
        'unknown_entry_types': unknown,
        'final_result': _last_result(calls, entries),
    }
    result.update(_history_metrics(calls, history_base, history_length))
    result.update(_coordination_metrics(calls))
    return result


def _policy_failures(result: dict[str, Any], args: argparse.Namespace) -> list[str]:
    failures: list[str] = []
    if args.expect_agent and result.get('agent') != args.expect_agent:
        failures.append(f"expected agent {args.expect_agent!r}, got {result.get('agent')!r}")
    if args.expect_model and args.expect_model not in result.get('models_seen', []):
        failures.append(f"expected model {args.expect_model!r}, got {result.get('models_seen')!r}")
    if args.expect_thinking and args.expect_thinking not in result.get('thinking_levels_seen', []):
        failures.append(f"expected thinking level {args.expect_thinking!r}, got {result.get('thinking_levels_seen')!r}")
    if args.forbid_fallback and result.get('fallback_observed'):
        failures.append('runtime fallback was observed')
    if args.require_history_grep and result.get('history_grep_count', 0) == 0:
        failures.append(f"no grep call targeted {args.require_history_grep!r}")
    if args.forbid_unbounded_history_read and result.get('history_unbounded_read_count', 0) > 0:
        failures.append(f"unbounded read targeted {args.forbid_unbounded_history_read!r}")
    if args.require_grep_before_history_read and result.get('history_reads_before_first_grep', 0) > 0:
        failures.append('history read occurred before the first matching grep')
    if args.forbid_unbounded_hub_wait and result.get('hub_unbounded_wait_count', 0) > 0:
        failures.append('explicit hub wait with timeoutMs=0 was observed')
    return failures


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('session', type=Path, help='explicit OMP session JSONL path')
    parser.add_argument('--history-base', default='history://Main')
    parser.add_argument('--history-length', type=int)
    parser.add_argument('--expect-agent')
    parser.add_argument('--expect-model')
    parser.add_argument('--expect-thinking')
    parser.add_argument('--forbid-fallback', action='store_true')
    parser.add_argument('--require-history-grep', metavar='URI')
    parser.add_argument('--forbid-unbounded-history-read', metavar='URI')
    parser.add_argument('--require-grep-before-history-read', action='store_true')
    parser.add_argument('--forbid-unbounded-hub-wait', action='store_true')
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    history_base = args.history_base
    if args.require_history_grep:
        history_base = args.require_history_grep
    if args.forbid_unbounded_history_read:
        if history_base != args.forbid_unbounded_history_read and args.require_history_grep:
            parser.error('--require-history-grep and --forbid-unbounded-history-read must target the same URI')
        history_base = args.forbid_unbounded_history_read
    try:
        result = audit_session(args.session, history_base=history_base, history_length=args.history_length)
    except AuditError as exc:
        print(f'error: {exc}', file=sys.stderr)
        return 2
    failures = _policy_failures(result, args)
    result['policy_failures'] = failures
    print(json.dumps(result, indent=2, sort_keys=True, ensure_ascii=False))
    if failures:
        for failure in failures:
            print(f'policy failure: {failure}', file=sys.stderr)
        return 3
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
