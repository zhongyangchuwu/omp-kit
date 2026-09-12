from __future__ import annotations

import json
from pathlib import Path

import pytest

from scripts import inspect_omp_session as ios


def _write(path: Path, objects: list[dict]) -> Path:
    path.write_text('\n'.join(json.dumps(obj) for obj in objects) + '\n', encoding='utf-8')
    return path


def _header() -> dict:
    return {
        'type': 'session',
        'version': 3,
        'id': 'session-1',
        'timestamp': '2026-09-13T00:00:00.000Z',
        'cwd': '/tmp/project',
    }


def _entry(type_: str, id_: str, parent: str | None, **extra) -> dict:
    return {
        'type': type_,
        'id': id_,
        'parentId': parent,
        'timestamp': f'2026-09-13T00:00:{len(id_) * 2:02d}.000Z',
        **extra,
    }


def _assistant_entry(id_: str, parent: str | None, content: list[dict], *, usage: dict | None = None) -> dict:
    return _entry(
        'message',
        id_,
        parent,
        message={
            'role': 'assistant',
            'provider': 'cpa',
            'model': 'gpt-5.6-luna',
            'content': content,
            'usage': usage or {
                'input': 10,
                'output': 2,
                'cacheRead': 3,
                'cacheWrite': 0,
                'reasoningTokens': 1,
                'totalTokens': 15,
                'cost': {'input': 0, 'output': 0, 'cacheRead': 0, 'cacheWrite': 0, 'total': 0},
            },
        },
    )


def _tool_result(id_: str, parent: str, call_id: str, tool: str, *, is_error: bool = False) -> dict:
    return _entry(
        'message',
        id_,
        parent,
        message={
            'role': 'toolResult',
            'toolCallId': call_id,
            'toolName': tool,
            'content': [{'type': 'text', 'text': 'ok'}],
            'isError': is_error,
        },
    )


def test_audit_linear_child_session(tmp_path: Path):
    objects = [
        {'type': 'title', 'v': 1, 'title': 'child', 'updatedAt': '2026-09-13T00:00:00Z', 'pad': ''},
        _header(),
        _entry(
            'session_init',
            'a',
            None,
            agent='luna-code',
            modelRole='fast_worker',
            resolvedModel='cpa/gpt-5.6-luna',
            systemPrompt='x',
            task='x',
            tools=['grep', 'read', 'yield'],
        ),
        _entry('thinking_level_change', 'bb', 'a', thinkingLevel='high', configured='high'),
        _assistant_entry(
            'ccc',
            'bb',
            [{'type': 'toolCall', 'id': 'g1', 'name': 'grep', 'arguments': {'path': 'history://Main', 'pattern': 'cache|None'}}],
        ),
        _tool_result('dddd', 'ccc', 'g1', 'grep'),
        _assistant_entry(
            'eeeee',
            'dddd',
            [{'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': 'history://Main:5-10'}}],
        ),
        _tool_result('ffffff', 'eeeee', 'r1', 'read'),
        _entry(
            'model_usage',
            'ggggggg',
            'ffffff',
            purpose='title',
            role='tiny',
            api='openai-responses',
            provider='cpa',
            model='gpt-5.6-luna',
            stopReason='stop',
            usage={
                'input': 5,
                'output': 1,
                'cacheRead': 0,
                'cacheWrite': 0,
                'reasoningTokens': 0,
                'totalTokens': 6,
                'cost': {'input': 0, 'output': 0, 'cacheRead': 0, 'cacheWrite': 0, 'total': 0},
            },
        ),
        _assistant_entry(
            'hhhhhhhh',
            'ggggggg',
            [{'type': 'toolCall', 'id': 'y1', 'name': 'yield', 'arguments': {'result': 'done'}}],
        ),
    ]
    session = _write(tmp_path / 'child.jsonl', objects)

    result = ios.audit_session(session, history_length=20)

    assert result['session_id'] == 'session-1'
    assert result['agent'] == 'luna-code'
    assert result['model_role'] == 'fast_worker'
    assert result['initial_model'] == 'cpa/gpt-5.6-luna'
    assert result['models_seen'] == ['cpa/gpt-5.6-luna']
    assert result['thinking_levels_seen'] == ['high']
    assert result['fallback_observed'] is False
    assert result['assistant_request_count'] == 3
    assert result['tool_calls_by_name'] == {'grep': 1, 'read': 1, 'yield': 1}
    assert result['history_grep_patterns'] == ['cache|None']
    assert result['history_read_selectors'] == ['history://Main:5-10']
    assert result['history_requested_unique_lines'] == 6
    assert result['history_requested_span'] == [5, 10]
    assert result['history_coverage_ratio_when_length_known'] == pytest.approx(6 / 20)
    assert result['history_reads_before_first_grep'] == 0
    assert result['input_tokens'] == 35
    assert result['output_tokens'] == 5
    assert result['cache_read_tokens'] == 6
    assert result['reasoning_tokens'] == 2
    assert result['total_tokens'] == 36
    assert result['reasoning_tokens_complete'] is True
    assert result['final_result'] == {'result': 'done'}


def test_rejects_branched_or_non_linear_session(tmp_path: Path):
    session = _write(
        tmp_path / 'branch.jsonl',
        [
            _header(),
            _entry('custom', 'a', None, customType='x'),
            _entry('custom', 'bb', None, customType='y'),
        ],
    )
    with pytest.raises(ios.AuditError, match='branched/non-linear'):
        ios.audit_session(session)


def test_unknown_entry_is_reported_not_zeroed(tmp_path: Path):
    session = _write(
        tmp_path / 'unknown.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _entry('future_metadata', 'bb', 'a', data={'x': 1}),
        ],
    )
    result = ios.audit_session(session)
    assert result['unknown_entry_types'] == ['future_metadata']


def test_malformed_json_fails_explicitly(tmp_path: Path):
    path = tmp_path / 'bad.jsonl'
    path.write_text(json.dumps(_header()) + '\n{bad\n', encoding='utf-8')
    with pytest.raises(ios.AuditError, match='malformed JSON'):
        ios.audit_session(path)


def test_history_and_hub_policy_metrics(tmp_path: Path):
    session = _write(
        tmp_path / 'policy.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry(
                'bb',
                'a',
                [
                    {'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': 'history://Main'}},
                    {'type': 'toolCall', 'id': 'w1', 'name': 'hub', 'arguments': {'op': 'wait', 'timeoutMs': 0}},
                ],
            ),
        ],
    )
    result = ios.audit_session(session)
    assert result['history_unbounded_read_count'] == 1
    assert result['history_reads_before_first_grep'] == 1
    assert result['hub_wait_count'] == 1
    assert result['hub_unbounded_wait_count'] == 1


def test_model_transition_records_fallback(tmp_path: Path):
    session = _write(
        tmp_path / 'fallback.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _entry('model_change', 'bb', 'a', model='cpa/gpt-5.6-sol', role='default', resolvedModelIsFallback=True),
        ],
    )
    result = ios.audit_session(session)
    assert result['models_seen'] == ['cpa/gpt-5.6-luna', 'cpa/gpt-5.6-sol']
    assert result['fallback_observed'] is True


def test_reasoning_completeness_is_explicit(tmp_path: Path):
    usage = {
        'input': 1,
        'output': 2,
        'cacheRead': 3,
        'cacheWrite': 0,
        'totalTokens': 6,
        'cost': {'input': 0, 'output': 0, 'cacheRead': 0, 'cacheWrite': 0, 'total': 0},
    }
    session = _write(
        tmp_path / 'usage.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry('bb', 'a', [{'type': 'text', 'text': 'x'}], usage=usage),
        ],
    )
    result = ios.audit_session(session)
    assert result['reasoning_tokens'] == 0
    assert result['reasoning_tokens_complete'] is False
    assert result['total_tokens'] == 6
    assert result['total_tokens_complete'] is True
