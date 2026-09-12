#!/usr/bin/env python3
"""Read-only audit of one OMP session JSONL file.

This intentionally understands only the stable evidence needed by omp-kit runtime
smokes. It never discovers sessions implicitly and never invokes OMP/provider traffic.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path
from typing import Any

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
POSITIVE_INT = r'[1-9][0-9]*'
BOUNDED_DASH_SELECTOR = re.compile(rf'^(?P<start>{POSITIVE_INT})-(?P<end>{POSITIVE_INT})$')
BOUNDED_COUNT_SELECTOR = re.compile(rf'^(?P<start>{POSITIVE_INT})\+(?P<count>{POSITIVE_INT})$')
OPEN_ENDED_SELECTOR = re.compile(rf'^(?P<start>{POSITIVE_INT})-?$')
RELATIVE_BOUNDED_SELECTOR = re.compile(rf'^-(?P<count>{POSITIVE_INT})$')
MODEL_EFFORT_SUFFIXES = {'off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto'}



class AuditError(RuntimeError):
    pass


def _iso_ms(value: str) -> int:
    normalized = f'{value[:-1]}+00:00' if value.endswith('Z') else value
    try:
        dt = datetime.fromisoformat(normalized)
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
                    'branched/non-linear session unsupported in audit schema v1: '
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


def _tool_calls(
    entries: Iterable[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    calls: list[dict[str, Any]] = []
    results: dict[str, dict[str, Any]] = {}
    call_order = 0
    for entry_index, entry in enumerate(entries):
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
            for content_index, block in enumerate(content):
                if not isinstance(block, dict) or block.get('type') != 'toolCall':
                    continue
                name = block.get('name')
                args = block.get('arguments')
                if not isinstance(name, str):
                    continue
                if not isinstance(args, dict):
                    args = {}
                call_id = block.get('id') or block.get('toolCallId')
                calls.append(
                    {
                        'order': call_order,
                        'entry_index': entry_index,
                        'content_index': content_index,
                        'entry_id': entry.get('id'),
                        'timestamp': entry.get('timestamp'),
                        'id': call_id if isinstance(call_id, str) else None,
                        'name': name,
                        'arguments': args,
                    }
                )
                call_order += 1
        elif role == 'toolResult':
            call_id = message.get('toolCallId')
            if isinstance(call_id, str):
                results[call_id] = {
                    'entry_index': entry_index,
                    'entry_id': entry.get('id'),
                    'timestamp': entry.get('timestamp'),
                    'isError': message.get('isError') is True,
                    'message': message,
                }
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


def _classify_history_selector(path: str, base: str, history_length: int | None) -> dict[str, Any] | None:
    if path == base:
        return {'path': path, 'selector': None, 'kind': 'unbounded', 'interval': None}
    prefix = f'{base}:'
    if not path.startswith(prefix):
        return None
    selector = path[len(prefix) :]

    match = BOUNDED_DASH_SELECTOR.fullmatch(selector)
    if match:
        start = int(match.group('start'))
        end = int(match.group('end'))
        if end < start:
            return {'path': path, 'selector': selector, 'kind': 'unsupported_selector', 'interval': None}
        return {
            'path': path,
            'selector': selector,
            'kind': 'bounded_range',
            'interval': (start, end),
        }

    match = BOUNDED_COUNT_SELECTOR.fullmatch(selector)
    if match:
        start = int(match.group('start'))
        count = int(match.group('count'))
        return {
            'path': path,
            'selector': selector,
            'kind': 'bounded_count',
            'interval': (start, start + count - 1),
            'count': count,
        }

    match = RELATIVE_BOUNDED_SELECTOR.fullmatch(selector)
    if match:
        count = int(match.group('count'))
        interval = None
        if history_length is not None and history_length > 0:
            interval = (max(1, history_length - count + 1), history_length)
        return {
            'path': path,
            'selector': selector,
            'kind': 'relative_bounded',
            'interval': interval,
            'count': count,
        }

    if OPEN_ENDED_SELECTOR.fullmatch(selector):
        return {'path': path, 'selector': selector, 'kind': 'open_ended', 'interval': None}

    return {'path': path, 'selector': selector, 'kind': 'unsupported_selector', 'interval': None}


def _merge_intervals(intervals: Iterable[tuple[int, int]]) -> list[tuple[int, int]]:
    ordered = sorted(intervals)
    if not ordered:
        return []
    merged: list[tuple[int, int]] = []
    current_start, current_end = ordered[0]
    for start, end in ordered[1:]:
        if start <= current_end + 1:
            current_end = max(current_end, end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = start, end
    merged.append((current_start, current_end))
    return merged


def _interval_size(intervals: Iterable[tuple[int, int]]) -> int:
    return sum(end - start + 1 for start, end in intervals)


def _history_metrics(
    calls: list[dict[str, Any]],
    tool_results: dict[str, dict[str, Any]],
    base: str,
    history_length: int | None,
) -> dict[str, Any]:
    grep_patterns: list[str] = []
    grep_calls: list[dict[str, Any]] = []
    successful_greps: list[dict[str, Any]] = []
    read_details: list[dict[str, Any]] = []
    intervals: list[tuple[int, int]] = []

    for call in calls:
        name = call['name']
        args = call['arguments']
        paths = _path_values(args)
        if name == 'grep' and base in paths:
            pattern = args.get('pattern')
            pattern_value = pattern if isinstance(pattern, str) else ''
            grep_patterns.append(pattern_value)
            grep_calls.append(call)
            call_id = call.get('id')
            result = tool_results.get(call_id) if isinstance(call_id, str) else None
            if (
                isinstance(result, dict)
                and result.get('isError') is False
                and isinstance(result.get('entry_index'), int)
                and result['entry_index'] > call['entry_index']
            ):
                successful_greps.append(
                    {
                        'call_entry_index': call['entry_index'],
                        'result_entry_index': result['entry_index'],
                        'call_id': call_id,
                        'pattern': pattern_value,
                    }
                )
        if name != 'read':
            continue
        for path in paths:
            classification = _classify_history_selector(path, base, history_length)
            if classification is None:
                continue
            detail = {
                **classification,
                'call_order': call['order'],
                'call_entry_index': call['entry_index'],
                'call_entry_id': call.get('entry_id'),
            }
            read_details.append(detail)
            interval = classification.get('interval')
            if isinstance(interval, tuple):
                intervals.append(interval)

    merged = _merge_intervals(intervals)
    span = None if not merged else [merged[0][0], merged[-1][1]]
    requested_unique_lines = _interval_size(merged)
    coverage = None
    if history_length is not None and history_length > 0:
        clipped = []
        for start, end in intervals:
            clipped_start = max(1, start)
            clipped_end = min(history_length, end)
            if clipped_start <= clipped_end:
                clipped.append((clipped_start, clipped_end))
        coverage = _interval_size(_merge_intervals(clipped)) / history_length

    first_read_entry = min(
        (detail['call_entry_index'] for detail in read_details),
        default=None,
    )
    successful_grep_before_first_read = False
    if first_read_entry is not None:
        successful_grep_before_first_read = any(
            grep['result_entry_index'] < first_read_entry for grep in successful_greps
        )

    kinds = Counter(detail['kind'] for detail in read_details)
    bounded_kinds = {'bounded_range', 'bounded_count', 'relative_bounded'}
    targeted_count = sum(kinds[kind] for kind in bounded_kinds)
    disallowed_count = (
        kinds['unbounded'] + kinds['open_ended'] + kinds['unsupported_selector']
    )

    return {
        'history_grep_patterns': grep_patterns,
        'history_grep_count': len(grep_calls),
        'history_successful_grep_count': len(successful_greps),
        'history_successful_greps': successful_greps,
        'history_read_selectors': [detail['path'] for detail in read_details],
        'history_read_selector_details': read_details,
        'history_targeted_read_count': targeted_count,
        'history_bounded_range_read_count': kinds['bounded_range'],
        'history_bounded_count_read_count': kinds['bounded_count'],
        'history_relative_bounded_read_count': kinds['relative_bounded'],
        'history_open_ended_read_count': kinds['open_ended'],
        'history_unsupported_selector_count': kinds['unsupported_selector'],
        'history_unbounded_read_count': kinds['unbounded'],
        'history_disallowed_read_count': disallowed_count,
        'history_successful_grep_before_first_read': successful_grep_before_first_read,
        'history_requested_unique_lines': requested_unique_lines,
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
            waits.append(
                {
                    'order': call['order'],
                    'timeoutMs': args.get('timeoutMs'),
                    'from': args.get('from'),
                    'ids': args.get('ids'),
                    'name': args.get('name'),
                }
            )
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
        texts: list[str] = []
        for block in content:
            if not isinstance(block, dict) or block.get('type') != 'text':
                continue
            text = block.get('text')
            if isinstance(text, str):
                texts.append(text)
        if texts:
            return '\n'.join(texts)
    return None


def _normalize_omp_model_selector(provider: Any, model: Any) -> str | None:
    if not isinstance(model, str) or not model:
        return None
    identity = model if '/' in model else f'{provider}/{model}' if isinstance(provider, str) and provider else model
    base, separator, suffix = identity.rpartition(':')
    if separator and '/' in base and suffix in MODEL_EFFORT_SUFFIXES:
        return base
    return identity


def _model_effort(model: Any) -> str | None:
    if not isinstance(model, str):
        return None
    base, separator, suffix = model.rpartition(':')
    if separator and '/' in base and suffix in MODEL_EFFORT_SUFFIXES:
        return suffix
    return None


def _model_metrics(entries: list[dict[str, Any]]) -> dict[str, Any]:
    trajectory: list[dict[str, Any]] = []
    task_request_events: list[dict[str, Any]] = []
    auxiliary_usage_events: list[dict[str, Any]] = []
    thinking_levels: list[str] = []

    for entry_index, entry in enumerate(entries):
        entry_type = entry.get('type')
        if entry_type == 'session_init':
            raw_model = entry.get('resolvedModel')
            model = _normalize_omp_model_selector(None, raw_model)
            if model is not None:
                fallback_value = entry.get('resolvedModelIsFallback')
                effort = _model_effort(raw_model)
                trajectory.append(
                    {
                        'source': 'session_init',
                        'model': model,
                        'raw_model': raw_model,
                        'effort': effort,
                        'role': entry.get('modelRole') if isinstance(entry.get('modelRole'), str) else None,
                        'fallback': fallback_value if isinstance(fallback_value, bool) else None,
                        'entry_id': entry.get('id'),
                        'entry_index': entry_index,
                        'timestamp': entry.get('timestamp'),
                    }
                )
                if effort is not None and effort not in thinking_levels:
                    thinking_levels.append(effort)
        elif entry_type == 'model_change':
            raw_model = entry.get('model')
            model = _normalize_omp_model_selector(None, raw_model)
            if model is not None:
                fallback_value = entry.get('resolvedModelIsFallback')
                effort = _model_effort(raw_model)
                trajectory.append(
                    {
                        'source': 'model_change',
                        'model': model,
                        'raw_model': raw_model,
                        'effort': effort,
                        'role': entry.get('role') if isinstance(entry.get('role'), str) else None,
                        'fallback': fallback_value if isinstance(fallback_value, bool) else None,
                        'entry_id': entry.get('id'),
                        'entry_index': entry_index,
                        'timestamp': entry.get('timestamp'),
                    }
                )
                if effort is not None and effort not in thinking_levels:
                    thinking_levels.append(effort)
        elif entry_type == 'thinking_level_change':
            level = entry.get('thinkingLevel')
            if isinstance(level, str) and level not in thinking_levels:
                thinking_levels.append(level)
        elif entry_type == 'model_usage':
            model = _normalize_omp_model_selector(entry.get('provider'), entry.get('model'))
            if model is not None:
                auxiliary_usage_events.append(
                    {
                        'model': model,
                        'purpose': entry.get('purpose') if isinstance(entry.get('purpose'), str) else None,
                        'role': entry.get('role') if isinstance(entry.get('role'), str) else None,
                        'entry_id': entry.get('id'),
                        'entry_index': entry_index,
                        'timestamp': entry.get('timestamp'),
                    }
                )
        elif entry_type == 'message':
            message = entry.get('message')
            if not isinstance(message, dict) or message.get('role') != 'assistant':
                continue
            model = _normalize_omp_model_selector(message.get('provider'), message.get('model'))
            if model is not None:
                task_request_events.append(
                    {
                        'model': model,
                        'entry_id': entry.get('id'),
                        'entry_index': entry_index,
                        'timestamp': entry.get('timestamp'),
                    }
                )

    task_models_seen: list[str] = []
    for event in [*trajectory, *task_request_events]:
        model = event.get('model')
        if isinstance(model, str) and model not in task_models_seen:
            task_models_seen.append(model)
    auxiliary_models_seen: list[str] = []
    for event in auxiliary_usage_events:
        model = event.get('model')
        if isinstance(model, str) and model not in auxiliary_models_seen:
            auxiliary_models_seen.append(model)

    fallback_values = [event.get('fallback') for event in trajectory]
    fallback_observed = any(value is True for value in fallback_values)
    fallback_evidence_complete = bool(trajectory) and all(
        isinstance(value, bool) for value in fallback_values
    )

    ordered_task_events: list[dict[str, Any]] = []
    for event in trajectory:
        ordered_task_events.append({'source': event['source'], **event})
    for event in task_request_events:
        ordered_task_events.append({'source': 'assistant_request', **event})
    ordered_task_events.sort(key=lambda event: int(event['entry_index']))
    final_task_model = None
    for event in reversed(ordered_task_events):
        model = event.get('model')
        if isinstance(model, str):
            final_task_model = model
            break

    return {
        'model_trajectory': trajectory,
        'task_request_model_events': task_request_events,
        'task_models_seen': task_models_seen,
        'models_seen': task_models_seen,
        'final_task_model': final_task_model,
        'auxiliary_model_usage_events': auxiliary_usage_events,
        'auxiliary_models_seen': auxiliary_models_seen,
        'thinking_levels_seen': thinking_levels,
        'fallback_observed': fallback_observed,
        'fallback_evidence_complete': fallback_evidence_complete,
    }



def audit_session(
    path: Path,
    *,
    history_base: str = 'history://Main',
    history_length: int | None = None,
) -> dict[str, Any]:
    header, entries = _load_jsonl(path)
    version = header.get('version')
    if version not in SUPPORTED_SESSION_VERSIONS:
        raise AuditError(
            f'unsupported OMP session version: {version!r}; '
            f'supported: {sorted(SUPPORTED_SESSION_VERSIONS)}'
        )
    _validate_linear(entries)

    unknown_values: set[str] = set()
    for entry in entries:
        entry_type = entry.get('type')
        if isinstance(entry_type, str) and entry_type not in KNOWN_ENTRY_TYPES:
            unknown_values.add(entry_type)
    unknown = sorted(unknown_values)

    calls, tool_results = _tool_calls(entries)
    usage_records = _usage_records(entries)
    usage = _sum_usage(usage_records)
    model_metrics = _model_metrics(entries)

    session_init = next((entry for entry in entries if entry.get('type') == 'session_init'), {})
    agent = session_init.get('agent') if isinstance(session_init.get('agent'), str) else None
    model_role = session_init.get('modelRole') if isinstance(session_init.get('modelRole'), str) else None
    initial_resolved_model = session_init.get('resolvedModel') if isinstance(session_init.get('resolvedModel'), str) else None
    initial_model = _normalize_omp_model_selector(None, initial_resolved_model)
    initial_model_effort = _model_effort(initial_resolved_model)

    timestamps: list[str] = []
    for entry in entries:
        timestamp = entry.get('timestamp')
        if isinstance(timestamp, str):
            timestamps.append(timestamp)
    first_entry_at = timestamps[0] if timestamps else None
    last_entry_at = timestamps[-1] if timestamps else None
    session_span_ms = None
    if first_entry_at is not None and last_entry_at is not None:
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
        'initial_model_effort': initial_model_effort,
        'initial_resolved_model': initial_resolved_model,
        **model_metrics,
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
    result.update(_history_metrics(calls, tool_results, history_base, history_length))
    result.update(_coordination_metrics(calls))
    return result


def _policy_failures(result: dict[str, Any], args: argparse.Namespace) -> list[str]:
    failures: list[str] = []
    if args.expect_agent and result.get('agent') != args.expect_agent:
        failures.append(f"expected agent {args.expect_agent!r}, got {result.get('agent')!r}")

    expected_model = args.expect_only_task_model
    if expected_model:
        task_models = result.get('task_models_seen', [])
        if not isinstance(task_models, list) or not task_models:
            failures.append(f'cannot verify task model {expected_model!r}: no task-model evidence')
        elif any(model != expected_model for model in task_models):
            failures.append(f"expected only task model {expected_model!r}, got {task_models!r}")

    if args.expect_final_task_model and result.get('final_task_model') != args.expect_final_task_model:
        failures.append(
            f"expected final task model {args.expect_final_task_model!r}, "
            f"got {result.get('final_task_model')!r}"
        )

    if args.expect_thinking:
        thinking_levels = result.get('thinking_levels_seen', [])
        if not isinstance(thinking_levels, list) or not thinking_levels:
            failures.append(
                f'cannot verify thinking level {args.expect_thinking!r}: no thinking evidence'
            )
        elif any(level != args.expect_thinking for level in thinking_levels):
            failures.append(
                f"expected only thinking level {args.expect_thinking!r}, got {thinking_levels!r}"
            )

    if args.forbid_fallback:
        if result.get('fallback_observed'):
            failures.append('runtime fallback was observed')
        elif not result.get('fallback_evidence_complete'):
            failures.append('cannot prove absence of runtime fallback: fallback evidence is incomplete')

    if args.require_history_grep and result.get('history_grep_count', 0) == 0:
        failures.append(f"no grep call targeted {args.require_history_grep!r}")

    if args.forbid_unbounded_history_read:
        if result.get('history_unbounded_read_count', 0) > 0:
            failures.append(f"unbounded read targeted {args.forbid_unbounded_history_read!r}")
        if result.get('history_open_ended_read_count', 0) > 0:
            failures.append(f"open-ended read targeted {args.forbid_unbounded_history_read!r}")
        if result.get('history_unsupported_selector_count', 0) > 0:
            failures.append(
                f"unsupported history selector targeted {args.forbid_unbounded_history_read!r}"
            )

    if args.require_grep_before_history_read:
        if result.get('history_grep_count', 0) == 0:
            failures.append('no matching history grep was observed before history reads')
        elif result.get('history_successful_grep_count', 0) == 0:
            failures.append('no successful matching history grep result was observed')
        elif result.get('history_read_selectors') and not result.get(
            'history_successful_grep_before_first_read'
        ):
            failures.append('first history read did not occur after a successful matching grep result')

    if args.forbid_unbounded_hub_wait and result.get('hub_unbounded_wait_count', 0) > 0:
        failures.append('explicit hub wait with timeoutMs=0 was observed')
    return failures


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('session', type=Path, help='explicit OMP session JSONL path')
    parser.add_argument('--history-base', default='history://Main')
    parser.add_argument('--history-length', type=int)
    parser.add_argument('--expect-agent')
    parser.add_argument(
        '--expect-model',
        '--expect-only-task-model',
        dest='expect_only_task_model',
        help='require all observed task-model evidence to use exactly this model',
    )
    parser.add_argument('--expect-final-task-model')
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
            parser.error(
                '--require-history-grep and --forbid-unbounded-history-read must target the same URI'
            )
        history_base = args.forbid_unbounded_history_read
    try:
        result = audit_session(
            args.session,
            history_base=history_base,
            history_length=args.history_length,
        )
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
